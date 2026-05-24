const functions = require('firebase-functions');
const axios = require('axios');
const { db, admin } = require('./config/firebaseAdmin');

// M-Pesa API configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.MPESA_CALLBACK_URL
};

// Get OAuth token
const getAccessToken = async () => {
  const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
  const url = MPESA_CONFIG.environment === 'sandbox' 
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Basic ${auth}` }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa token:', error);
    throw error;
  }
};

// Initiate STK Push
exports.initiateSTKPush = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { phoneNumber, amount, orderId } = data;
  
  if (!phoneNumber || !amount || !orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  try {
    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
    
    const url = MPESA_CONFIG.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    
    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: `VALHALA-${orderId.slice(-8)}`,
      TransactionDesc: 'Alcohol Delivery Payment'
    };
    
    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Store checkout request ID
    await db.collection('mpesa_transactions').doc(response.data.CheckoutRequestID).set({
      orderId,
      phoneNumber,
      amount,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      checkoutRequestId: response.data.CheckoutRequestID
    });
    
    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription
    };
  } catch (error) {
    console.error('STK Push error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to initiate payment');
  }
});

// M-Pesa Callback URL (webhook)
exports.mpesaCallback = functions.https.onRequest(async (req, res) => {
  try {
    const callbackData = req.body;
    const { Body } = callbackData;
    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
    
    // Update transaction record
    const transactionRef = db.collection('mpesa_transactions').doc(CheckoutRequestID);
    const transaction = await transactionRef.get();
    
    if (!transaction.exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const transactionData = transaction.data();
    const orderId = transactionData.orderId;
    
    if (ResultCode === 0) {
      // Payment successful
      const metadata = {};
      CallbackMetadata.Item.forEach(item => {
        metadata[item.Name] = item.Value;
      });
      
      await transactionRef.update({
        status: 'success',
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        transactionId: metadata.TransactionId,
        receiptNumber: metadata.ReceiptNumber,
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update order payment status
      await db.collection('orders').doc(orderId).update({
        'paymentStatus.upfront': 'paid',
        upfrontPaymentDetails: {
          transactionId: metadata.TransactionId,
          receiptNumber: metadata.ReceiptNumber,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          amount: transactionData.amount
        },
        status: 'awaiting_driver',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Trigger payment complete function
      await db.collection('payment_events').add({
        orderId,
        type: 'upfront_payment',
        status: 'success',
        transactionId: metadata.TransactionId,
        amount: transactionData.amount,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } else {
      // Payment failed
      await transactionRef.update({
        status: 'failed',
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await db.collection('orders').doc(orderId).update({
        'paymentStatus.upfront': 'failed',
        status: 'pending_payment',
        paymentError: ResultDesc,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal error' });
  }
});

// Query transaction status
exports.queryTransactionStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { checkoutRequestId } = data;
  
  try {
    const token = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
    
    const url = MPESA_CONFIG.environment === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query';
    
    const payload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };
    
    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('Query status error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to query transaction status');
  }
});