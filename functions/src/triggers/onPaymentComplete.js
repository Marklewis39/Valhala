const functions = require('firebase-functions');
const { db, admin } = require('../config/firebaseAdmin');

// Trigger when payment is completed
exports.onPaymentComplete = functions.firestore
  .document('payments/{paymentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Only trigger when payment status changes to success
    if (before.status === 'success' || after.status !== 'success') {
      return;
    }
    
    const payment = after;
    const orderId = payment.orderId;
    
    try {
      // Update order payment status
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) return;
      
      const order = orderDoc.data();
      const isUpfrontPayment = payment.amount === order.paidUpfront;
      
      await orderRef.update({
        [`paymentStatus.${isUpfrontPayment ? 'upfront' : 'remaining'}`]: 'paid',
        [`${isUpfrontPayment ? 'upfront' : 'remaining'}PaymentDetails`]: {
          method: payment.method,
          transactionId: payment.transactionId,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          amount: payment.amount
        },
        status: isUpfrontPayment ? 'awaiting_driver' : 'delivered',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // If remaining payment, update driver stats
      if (!isUpfrontPayment && order.driverId) {
        const driverRef = db.collection('drivers').doc(order.driverId);
        const driverDoc = await driverRef.get();
        
        if (driverDoc.exists) {
          const currentDeliveries = driverDoc.data().totalDeliveries || 0;
          await driverRef.update({
            totalDeliveries: currentDeliveries + 1,
            isAvailable: true,
            currentOrderId: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        // Update product sales stats
        const batch = db.batch();
        for (const item of order.items) {
          const productRef = db.collection('products').doc(item.productId);
          const productDoc = await productRef.get();
          
          if (productDoc.exists) {
            const currentSold = productDoc.data().totalSold || 0;
            const currentRevenue = productDoc.data().totalRevenue || 0;
            const currentProfit = productDoc.data().totalProfit || 0;
            
            batch.update(productRef, {
              totalSold: currentSold + item.quantity,
              totalRevenue: currentRevenue + (item.sellingPrice * item.quantity),
              totalProfit: currentProfit + ((item.sellingPrice - (item.buyPrice || 0)) * item.quantity),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        await batch.commit();
      }
      
      // Send payment confirmation
      const userRef = db.collection('users').doc(order.userId);
      const userDoc = await userRef.get();
      const userEmail = userDoc.data()?.email;
      
      console.log(`Payment confirmation sent to ${userEmail} for order ${orderId}`);
      
    } catch (error) {
      console.error('Error in onPaymentComplete trigger:', error);
    }
  });