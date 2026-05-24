const functions = require('firebase-functions');
const { db, admin, auth } = require('../config/firebaseAdmin');

/**
 * Fire/terminate a driver
 * Admin only function
 */
exports.fireDriver = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Verify admin role
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  const adminRole = adminDoc.data()?.role;
  
  if (adminRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { 
    driverId, 
    reason, 
    effectiveImmediately = true,
    reassignOrders = true 
  } = data;
  
  if (!driverId) {
    throw new functions.https.HttpsError('invalid-argument', 'Driver ID is required');
  }
  
  if (!reason || reason.trim() === '') {
    throw new functions.https.HttpsError('invalid-argument', 'Reason for termination is required');
  }
  
  try {
    // Get driver document
    const driverRef = db.collection('drivers').doc(driverId);
    const driverDoc = await driverRef.get();
    
    if (!driverDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Driver not found');
    }
    
    const driverData = driverDoc.data();
    
    // Check if driver is already inactive
    if (!driverData.isActive) {
      return {
        success: true,
        message: 'Driver is already inactive',
        driver: {
          id: driverId,
          name: driverData.name,
          status: 'already_inactive'
        }
      };
    }
    
    // If driver has active orders, handle them
    if (driverData.currentOrderId && reassignOrders) {
      const orderRef = db.collection('orders').doc(driverData.currentOrderId);
      const orderDoc = await orderRef.get();
      
      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        
        // Only reassign if order is not completed
        if (orderData.status !== 'delivered' && orderData.status !== 'cancelled') {
          // Find another available driver
          const availableDrivers = await db.collection('drivers')
            .where('isActive', '==', true)
            .where('isAvailable', '==', true)
            .where('userId', '!=', driverId)
            .limit(1)
            .get();
          
          if (!availableDrivers.empty) {
            const newDriver = availableDrivers.docs[0];
            const newDriverId = newDriver.id;
            
            // Reassign order to new driver
            await orderRef.update({
              driverId: newDriverId,
              reassignedAt: admin.firestore.FieldValue.serverTimestamp(),
              reassignedFrom: driverId,
              reassignReason: `Driver terminated: ${reason}`,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Update new driver's status
            await db.collection('drivers').doc(newDriverId).update({
              isAvailable: false,
              currentOrderId: driverData.currentOrderId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            await db.collection('admin_logs').add({
              action: 'reassign_order',
              adminId: context.auth.uid,
              orderId: driverData.currentOrderId,
              fromDriverId: driverId,
              toDriverId: newDriverId,
              reason: `Driver terminated: ${reason}`,
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            // No available drivers, mark order as pending
            await orderRef.update({
              status: 'awaiting_driver',
              driverId: null,
              previousDriverId: driverId,
              reassignNeeded: true,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
      }
    }
    
    // Disable Firebase Auth user
    try {
      await auth.updateUser(driverId, { disabled: true });
    } catch (authError) {
      console.error('Error disabling auth user:', authError);
      // Continue even if auth update fails
    }
    
    // Update driver document
    const updateData = {
      isActive: false,
      isAvailable: false,
      terminatedAt: admin.firestore.FieldValue.serverTimestamp(),
      terminationReason: reason,
      terminatedBy: context.auth.uid,
      effectiveImmediately,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // If not effective immediately, schedule termination
    if (!effectiveImmediately) {
      updateData.scheduledTerminationDate = admin.firestore.FieldValue.serverTimestamp();
      updateData.terminationNoticeSent = false;
    }
    
    await driverRef.update(updateData);
    
    // Update user document
    await db.collection('users').doc(driverId).update({
      isActive: false,
      role: 'terminated_driver',
      terminatedAt: admin.firestore.FieldValue.serverTimestamp(),
      terminationReason: reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Log the action
    await db.collection('admin_logs').add({
      action: 'fire_driver',
      adminId: context.auth.uid,
      adminEmail: adminDoc.data().email,
      driverId,
      driverName: driverData.name,
      driverEmail: driverData.email,
      terminationReason: reason,
      effectiveImmediately,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send termination notification email
    const emailService = require('../utils/emailService');
    await emailService.sendDriverTerminationEmail(driverData.email, driverData.name, reason);
    
    return {
      success: true,
      message: effectiveImmediately ? 'Driver has been terminated immediately' : 'Driver termination has been scheduled',
      driver: {
        id: driverId,
        name: driverData.name,
        email: driverData.email,
        status: 'terminated',
        terminationDate: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error firing driver:', error);
    throw new functions.https.HttpsError('internal', 'Failed to terminate driver: ' + error.message);
  }
});

/**
 * Reactivate a terminated driver
 */
exports.reactivateDriver = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Verify admin role
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  const adminRole = adminDoc.data()?.role;
  
  if (adminRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { driverId, reason } = data;
  
  if (!driverId) {
    throw new functions.https.HttpsError('invalid-argument', 'Driver ID is required');
  }
  
  try {
    const driverRef = db.collection('drivers').doc(driverId);
    const driverDoc = await driverRef.get();
    
    if (!driverDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Driver not found');
    }
    
    const driverData = driverDoc.data();
    
    // Reactivate Firebase Auth user
    try {
      await auth.updateUser(driverId, { disabled: false });
    } catch (authError) {
      console.error('Error reactivating auth user:', authError);
    }
    
    // Update driver document
    await driverRef.update({
      isActive: true,
      isAvailable: true,
      terminatedAt: admin.firestore.FieldValue.delete(),
      terminationReason: null,
      terminatedBy: null,
      reactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      reactivatedBy: context.auth.uid,
      reactivationReason: reason || 'Admin reactivation',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update user document
    await db.collection('users').doc(driverId).update({
      isActive: true,
      role: 'driver',
      terminatedAt: admin.firestore.FieldValue.delete(),
      terminationReason: null,
      reactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Log the action
    await db.collection('admin_logs').add({
      action: 'reactivate_driver',
      adminId: context.auth.uid,
      adminEmail: adminDoc.data().email,
      driverId,
      driverName: driverData.name,
      reason: reason || 'Admin reactivation',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Driver has been reactivated successfully',
      driver: {
        id: driverId,
        name: driverData.name,
        status: 'active'
      }
    };
    
  } catch (error) {
    console.error('Error reactivating driver:', error);
    throw new functions.https.HttpsError('internal', 'Failed to reactivate driver: ' + error.message);
  }
});

/**
 * Get list of terminated drivers
 */
exports.getTerminatedDrivers = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Verify admin role
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  const adminRole = adminDoc.data()?.role;
  
  if (adminRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { limit = 50, startAfter } = data;
  
  try {
    let query = db.collection('drivers')
      .where('isActive', '==', false)
      .where('terminatedAt', '!=', null)
      .orderBy('terminatedAt', 'desc')
      .limit(limit);
    
    if (startAfter) {
      const startAfterDoc = await db.collection('drivers').doc(startAfter).get();
      query = query.startAfter(startAfterDoc);
    }
    
    const snapshot = await query.get();
    
    const drivers = [];
    snapshot.forEach(doc => {
      drivers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      drivers,
      lastDocId: drivers.length > 0 ? drivers[drivers.length - 1].id : null,
      hasMore: drivers.length === limit
    };
    
  } catch (error) {
    console.error('Error getting terminated drivers:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get terminated drivers');
  }
});