const functions = require('firebase-functions');
const { db, admin } = require('../config/firebaseAdmin');

// Trigger when a new order is created
exports.onOrderCreate = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;
    
    try {
      // 1. Update product stock
      const batch = db.batch();
      
      for (const item of order.items) {
        const productRef = db.collection('products').doc(item.productId);
        const productDoc = await productRef.get();
        
        if (productDoc.exists) {
          const currentStock = productDoc.data().stock;
          const newStock = currentStock - item.quantity;
          
          batch.update(productRef, {
            stock: newStock,
            isAvailable: newStock > 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Log stock change
          const logRef = db.collection('inventory_logs').doc();
          batch.set(logRef, {
            productId: item.productId,
            productName: item.name,
            previousStock: currentStock,
            newStock: newStock,
            changeAmount: -item.quantity,
            reason: 'order_placed',
            orderId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      await batch.commit();
      
      // 2. Send confirmation notification to customer
      const userRef = db.collection('users').doc(order.userId);
      const userDoc = await userRef.get();
      const userEmail = userDoc.data()?.email;
      
      // In production, send email here
      console.log(`Order confirmation sent to ${userEmail} for order ${orderId}`);
      
      // 3. Check for available drivers and auto-assign
      const availableDrivers = await db.collection('drivers')
        .where('isActive', '==', true)
        .where('isAvailable', '==', true)
        .limit(1)
        .get();
      
      if (!availableDrivers.empty) {
        const driver = availableDrivers.docs[0];
        const driverId = driver.id;
        
        await db.collection('orders').doc(orderId).update({
          driverId,
          status: 'awaiting_driver',
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('drivers').doc(driverId).update({
          isAvailable: false,
          currentOrderId: orderId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Send notification to driver
        console.log(`Order ${orderId} assigned to driver ${driverId}`);
      }
      
      // 4. Create notification for admin
      await db.collection('notifications').add({
        type: 'new_order',
        orderId,
        message: `New order #${orderId.slice(-8)} for ${order.total} KES`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        targetRole: 'admin'
      });
      
    } catch (error) {
      console.error('Error in onOrderCreate trigger:', error);
    }
  });