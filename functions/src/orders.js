const functions = require('firebase-functions');
const { db, admin } = require('./config/firebaseAdmin');

// Get order details (with user validation)
exports.getOrderDetails = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { orderId } = data;
  
  try {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }
    
    const order = orderDoc.data();
    
    // Check if user has permission to view this order
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userRole = userDoc.data()?.role;
    
    if (userRole !== 'admin' && order.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You don\'t have permission to view this order');
    }
    
    // Get driver info if assigned
    let driverInfo = null;
    if (order.driverId) {
      const driverDoc = await db.collection('drivers').doc(order.driverId).get();
      if (driverDoc.exists) {
        driverInfo = driverDoc.data();
      }
    }
    
    return {
      ...order,
      id: orderDoc.id,
      driverInfo
    };
  } catch (error) {
    console.error('Get order details error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get order details');
  }
});

// Update order status
exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
  // Check admin authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (userDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { orderId, status, additionalData } = data;
  
  try {
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...additionalData
    };
    
    // Add timestamp based on status
    if (status === 'picked_up') {
      updateData.pickedUpAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'en_route') {
      updateData.enRouteAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'delivered') {
      updateData.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    await db.collection('orders').doc(orderId).update(updateData);
    
    // Log status change
    await db.collection('order_logs').add({
      orderId,
      previousStatus: (await db.collection('orders').doc(orderId).get()).data().status,
      newStatus: status,
      changedBy: context.auth.uid,
      changedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Order status updated' };
  } catch (error) {
    console.error('Update order status error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update order status');
  }
});

// Assign driver to order
exports.assignDriver = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (userDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { orderId, driverId } = data;
  
  try {
    // Check if driver exists and is active
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists || !driverDoc.data().isActive) {
      throw new functions.https.HttpsError('not-found', 'Driver not available');
    }
    
    await db.collection('orders').doc(orderId).update({
      driverId,
      status: 'awaiting_driver',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update driver availability
    await db.collection('drivers').doc(driverId).update({
      isAvailable: false,
      currentOrderId: orderId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send notification to driver (implement notification service)
    // await sendDriverNotification(driverId, orderId);
    
    return { success: true, message: 'Driver assigned successfully' };
  } catch (error) {
    console.error('Assign driver error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to assign driver');
  }
});