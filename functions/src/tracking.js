const functions = require('firebase-functions');
const { db, admin } = require('./config/firebaseAdmin');

// Calculate ETA using Google Distance Matrix (or mock for prototype)
const calculateETA = async (originLat, originLng, destLat, destLng) => {
  // For prototype, use simple distance calculation
  const R = 6371; // Earth's radius in km
  const dLat = (destLat - originLat) * Math.PI / 180;
  const dLon = (destLng - originLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(originLat * Math.PI/180) * Math.cos(destLat * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Assume average speed of 30 km/h
  const etaMinutes = Math.ceil((distance / 30) * 60);
  
  return {
    distance: distance.toFixed(1),
    eta: etaMinutes,
    etaFormatted: etaMinutes < 60 ? `${etaMinutes} min` : `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}min`
  };
};

// Update driver location (called by driver app)
exports.updateDriverLocation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Check if user is a driver
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (userDoc.data()?.role !== 'driver') {
    throw new functions.https.HttpsError('permission-denied', 'Driver access required');
  }
  
  const { lat, lng, orderId } = data;
  const driverId = context.auth.uid;
  
  try {
    // Update driver's current location in Firestore
    await db.collection('drivers').doc(driverId).update({
      currentLocation: {
        lat,
        lng,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    });
    
    // Update realtime database for live tracking
    const realtimeDb = admin.database();
    await realtimeDb.ref(`driverLocations/${driverId}`).set({
      lat,
      lng,
      lastUpdate: Date.now(),
      orderId
    });
    
    // If driver has an active order, update ETA
    if (orderId) {
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (orderDoc.exists) {
        const order = orderDoc.data();
        const { lat: customerLat, lng: customerLng } = order.deliveryAddress || {};
        
        if (customerLat && customerLng) {
          const eta = await calculateETA(lat, lng, customerLat, customerLng);
          
          await db.collection('orders').doc(orderId).update({
            estimatedDeliveryTime: eta.etaFormatted,
            driverDistance: eta.distance,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Update realtime database with ETA
          await realtimeDb.ref(`driverLocations/${driverId}/eta`).set(eta.etaFormatted);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Update location error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update location');
  }
});

// Get driver location for customer
exports.getDriverLocation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { orderId } = data;
  
  try {
    // Get order to find assigned driver
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }
    
    const order = orderDoc.data();
    const driverId = order.driverId;
    
    if (!driverId) {
      return { driverLocation: null, message: 'Driver not assigned yet' };
    }
    
    // Get driver location from realtime database
    const realtimeDb = admin.database();
    const snapshot = await realtimeDb.ref(`driverLocations/${driverId}`).once('value');
    const driverLocation = snapshot.val();
    
    return {
      driverLocation,
      eta: order.estimatedDeliveryTime,
      status: order.status
    };
  } catch (error) {
    console.error('Get driver location error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get driver location');
  }
});