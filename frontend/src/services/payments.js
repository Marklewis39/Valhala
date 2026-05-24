import { 
  db, collection, addDoc, getDoc, doc, updateDoc, 
  Timestamp, query, where, getDocs, orderBy
} from './firebase';

const COLLECTION = 'payments';

// Payment methods
export const PAYMENT_METHODS = {
  MPESA: 'mpesa',
  CARD: 'card',
  CASH_ON_DELIVERY: 'cash_on_delivery'
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Process payment (mock for prototype)
export const processPayment = async (paymentData) => {
  try {
    const { orderId, amount, method, phoneNumber, cardDetails } = paymentData;
    
    // Create payment record
    const paymentRef = await addDoc(collection(db, COLLECTION), {
      orderId,
      amount,
      method,
      status: PAYMENT_STATUS.PROCESSING,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    // Simulate payment processing
    let paymentSuccess = false;
    let transactionId = null;
    let errorMessage = null;
    
    // Mock payment processing (in production, integrate with actual payment gateway)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For prototype, simulate successful payment
    if (method === PAYMENT_METHODS.MPESA) {
      // Simulate M-Pesa STK Push
      if (phoneNumber && phoneNumber.length >= 10) {
        paymentSuccess = true;
        transactionId = `MPESA${Date.now()}`;
      } else {
        paymentSuccess = false;
        errorMessage = 'Invalid phone number';
      }
    } else if (method === PAYMENT_METHODS.CARD) {
      // Simulate card payment
      if (cardDetails && cardDetails.cardNumber) {
        paymentSuccess = true;
        transactionId = `CARD${Date.now()}`;
      } else {
        paymentSuccess = false;
        errorMessage = 'Invalid card details';
      }
    } else if (method === PAYMENT_METHODS.CASH_ON_DELIVERY) {
      paymentSuccess = true;
      transactionId = `COD${Date.now()}`;
    }
    
    // Update payment record
    const paymentDocRef = doc(db, COLLECTION, paymentRef.id);
    if (paymentSuccess) {
      await updateDoc(paymentDocRef, {
        status: PAYMENT_STATUS.SUCCESS,
        transactionId,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Update order payment status
      await updateOrderPaymentStatus(orderId, method, amount, transactionId);
      
      return {
        success: true,
        transactionId,
        paymentId: paymentRef.id
      };
    } else {
      await updateDoc(paymentDocRef, {
        status: PAYMENT_STATUS.FAILED,
        errorMessage,
        updatedAt: Timestamp.now()
      });
      
      return {
        success: false,
        error: errorMessage,
        paymentId: paymentRef.id
      };
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

// Update order payment status
const updateOrderPaymentStatus = async (orderId, method, amount, transactionId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (orderDoc.exists()) {
      const order = orderDoc.data();
      const isUpfront = amount === order.paidUpfront;
      
      await updateDoc(orderRef, {
        paymentStatus: {
          upfront: isUpfront ? PAYMENT_STATUS.SUCCESS : order.paymentStatus?.upfront,
          remaining: !isUpfront ? PAYMENT_STATUS.SUCCESS : order.paymentStatus?.remaining
        },
        [`${isUpfront ? 'upfront' : 'remaining'}PaymentDetails`]: {
          method,
          amount,
          transactionId,
          paidAt: Timestamp.now()
        },
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating order payment status:', error);
    throw error;
  }
};

// Process M-Pesa STK Push (mock)
export const processMpesaPayment = async (phoneNumber, amount, orderId) => {
  try {
    // Validate phone number
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10 || cleanedPhone.length > 12) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }
    
    // Create payment record
    const paymentData = {
      orderId,
      amount,
      method: PAYMENT_METHODS.MPESA,
      phoneNumber: cleanedPhone,
      status: PAYMENT_STATUS.PROCESSING,
      createdAt: Timestamp.now()
    };
    
    const paymentRef = await addDoc(collection(db, COLLECTION), paymentData);
    
    // Simulate STK Push
    console.log(`Initiating STK Push to ${cleanedPhone} for KES ${amount}`);
    
    // Mock response after 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful payment (90% success rate for prototype)
    const isSuccessful = Math.random() > 0.1;
    
    if (isSuccessful) {
      const transactionId = `MPESA${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      await updateDoc(doc(db, COLLECTION, paymentRef.id), {
        status: PAYMENT_STATUS.SUCCESS,
        transactionId,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Update order
      await updateOrderPaymentStatus(orderId, PAYMENT_METHODS.MPESA, amount, transactionId);
      
      return {
        success: true,
        transactionId,
        paymentId: paymentRef.id,
        message: 'Payment successful!'
      };
    } else {
      await updateDoc(doc(db, COLLECTION, paymentRef.id), {
        status: PAYMENT_STATUS.FAILED,
        errorMessage: 'Payment failed. Please try again.',
        updatedAt: Timestamp.now()
      });
      
      return {
        success: false,
        error: 'Payment failed. Please try again.',
        paymentId: paymentRef.id
      };
    }
  } catch (error) {
    console.error('Error processing M-Pesa payment:', error);
    throw error;
  }
};

// Process Card Payment (mock)
export const processCardPayment = async (cardDetails, amount, orderId) => {
  try {
    const { cardNumber, expiryMonth, expiryYear, cvv, cardholderName } = cardDetails;
    
    // Basic validation
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 15) {
      return {
        success: false,
        error: 'Invalid card number'
      };
    }
    
    if (!expiryMonth || !expiryYear) {
      return {
        success: false,
        error: 'Invalid expiry date'
      };
    }
    
    if (!cvv || cvv.length < 3) {
      return {
        success: false,
        error: 'Invalid CVV'
      };
    }
    
    // Create payment record
    const paymentData = {
      orderId,
      amount,
      method: PAYMENT_METHODS.CARD,
      cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
      status: PAYMENT_STATUS.PROCESSING,
      createdAt: Timestamp.now()
    };
    
    const paymentRef = await addDoc(collection(db, COLLECTION), paymentData);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful payment (95% success rate for prototype)
    const isSuccessful = Math.random() > 0.05;
    
    if (isSuccessful) {
      const transactionId = `CARD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      await updateDoc(doc(db, COLLECTION, paymentRef.id), {
        status: PAYMENT_STATUS.SUCCESS,
        transactionId,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Update order
      await updateOrderPaymentStatus(orderId, PAYMENT_METHODS.CARD, amount, transactionId);
      
      return {
        success: true,
        transactionId,
        paymentId: paymentRef.id,
        message: 'Payment successful!'
      };
    } else {
      await updateDoc(doc(db, COLLECTION, paymentRef.id), {
        status: PAYMENT_STATUS.FAILED,
        errorMessage: 'Card declined. Please try another card.',
        updatedAt: Timestamp.now()
      });
      
      return {
        success: false,
        error: 'Card declined. Please try another card.',
        paymentId: paymentRef.id
      };
    }
  } catch (error) {
    console.error('Error processing card payment:', error);
    throw error;
  }
};

// Process remaining payment on delivery
export const processRemainingPayment = async (orderId, amount, method = PAYMENT_METHODS.CASH_ON_DELIVERY) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      return {
        success: false,
        error: 'Order not found'
      };
    }
    
    const order = orderDoc.data();
    
    // Verify remaining amount
    if (order.remainingDue !== amount) {
      return {
        success: false,
        error: 'Payment amount does not match remaining balance'
      };
    }
    
    // Create payment record
    const paymentRef = await addDoc(collection(db, COLLECTION), {
      orderId,
      amount,
      method,
      type: 'remaining',
      status: PAYMENT_STATUS.SUCCESS,
      transactionId: `COD${Date.now()}`,
      completedAt: Timestamp.now(),
      createdAt: Timestamp.now()
    });
    
    // Update order
    await updateDoc(orderRef, {
      'paymentStatus.remaining': PAYMENT_STATUS.SUCCESS,
      remainingPaymentDetails: {
        method,
        amount,
        paidAt: Timestamp.now()
      },
      updatedAt: Timestamp.now()
    });
    
    return {
      success: true,
      paymentId: paymentRef.id,
      message: 'Remaining payment recorded successfully'
    };
  } catch (error) {
    console.error('Error processing remaining payment:', error);
    throw error;
  }
};

// Get payment by order ID
export const getPaymentsByOrder = async (orderId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting payments by order:', error);
    throw error;
  }
};

// Get payment by transaction ID
export const getPaymentByTransactionId = async (transactionId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('transactionId', '==', transactionId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting payment by transaction ID:', error);
    throw error;
  }
};

// Refund payment
export const refundPayment = async (paymentId, reason = null) => {
  try {
    const paymentRef = doc(db, COLLECTION, paymentId);
    const paymentDoc = await getDoc(paymentRef);
    
    if (!paymentDoc.exists()) {
      return {
        success: false,
        error: 'Payment not found'
      };
    }
    
    const payment = paymentDoc.data();
    
    if (payment.status !== PAYMENT_STATUS.SUCCESS) {
      return {
        success: false,
        error: 'Only successful payments can be refunded'
      };
    }
    
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await updateDoc(paymentRef, {
      status: PAYMENT_STATUS.REFUNDED,
      refundReason: reason,
      refundedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return {
      success: true,
      message: 'Payment refunded successfully'
    };
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
};

// Get payment statistics
export const getPaymentStatistics = async (period = 'month') => {
  try {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate = new Date(0);
    }
    
    const startTimestamp = Timestamp.fromDate(startDate);
    
    const q = query(
      collection(db, COLLECTION),
      where('createdAt', '>=', startTimestamp),
      where('status', '==', PAYMENT_STATUS.SUCCESS)
    );
    
    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => doc.data());
    
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Group by method
    const byMethod = {};
    payments.forEach(payment => {
      const method = payment.method || 'unknown';
      byMethod[method] = {
        count: (byMethod[method]?.count || 0) + 1,
        amount: (byMethod[method]?.amount || 0) + (payment.amount || 0)
      };
    });
    
    return {
      totalPayments,
      totalAmount,
      averageAmount: totalPayments > 0 ? totalAmount / totalPayments : 0,
      byMethod
    };
  } catch (error) {
    console.error('Error getting payment statistics:', error);
    throw error;
  }
};

// Validate payment before checkout
export const validatePayment = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      return {
        valid: false,
        error: 'Order not found'
      };
    }
    
    const order = orderDoc.data();
    
    // Check if already paid
    if (order.paymentStatus?.upfront === PAYMENT_STATUS.SUCCESS) {
      return {
        valid: false,
        error: 'Order already paid'
      };
    }
    
    // Check if order is still valid
    const orderAge = Date.now() - (order.createdAt?.toDate()?.getTime() || 0);
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    if (orderAge > maxAge) {
      return {
        valid: false,
        error: 'Order has expired. Please create a new order.'
      };
    }
    
    return {
      valid: true,
      amount: order.paidUpfront,
      order: order
    };
  } catch (error) {
    console.error('Error validating payment:', error);
    throw error;
  }
};

// Simulate M-Pesa STK Push callback (for testing)
export const simulateMpesaCallback = async (checkoutRequestId, resultCode = 0) => {
  try {
    // Find payment by checkout request ID
    const q = query(
      collection(db, COLLECTION),
      where('checkoutRequestId', '==', checkoutRequestId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        error: 'Payment not found'
      };
    }
    
    const paymentDoc = snapshot.docs[0];
    const payment = paymentDoc.data();
    
    if (resultCode === 0) {
      // Success
      const transactionId = `MPESA${Date.now()}`;
      await updateDoc(doc(db, COLLECTION, paymentDoc.id), {
        status: PAYMENT_STATUS.SUCCESS,
        transactionId,
        completedAt: Timestamp.now(),
        resultCode: 0,
        resultDesc: 'Success'
      });
      
      // Update order
      await updateOrderPaymentStatus(payment.orderId, PAYMENT_METHODS.MPESA, payment.amount, transactionId);
      
      return {
        success: true,
        message: 'Payment confirmed'
      };
    } else {
      // Failed
      await updateDoc(doc(db, COLLECTION, paymentDoc.id), {
        status: PAYMENT_STATUS.FAILED,
        resultCode,
        resultDesc: 'Payment failed',
        updatedAt: Timestamp.now()
      });
      
      return {
        success: false,
        error: 'Payment failed'
      };
    }
  } catch (error) {
    console.error('Error simulating M-Pesa callback:', error);
    throw error;
  }
};

export default {
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  processPayment,
  processMpesaPayment,
  processCardPayment,
  processRemainingPayment,
  getPaymentsByOrder,
  getPaymentByTransactionId,
  refundPayment,
  getPaymentStatistics,
  validatePayment,
  simulateMpesaCallback
};