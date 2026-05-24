const functions = require('firebase-functions');
const { admin } = require('../config/firebaseAdmin');

// Trigger when driver location is updated in Realtime Database
exports.onDriverLocationUpdate = functions.database
  .ref('/driverLocations/{driverId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();
    const driverId = context.params.driverId;
    
    // Only process significant movements (avoid spam)
    if (before && after) {
      const latDiff = Math.abs(before.lat - after.lat);
      const lngDiff = Math.abs(before.lng - after.lng);
      if (latDiff < 0.001 && lngDiff < 0.001) {
        return; // Ignore tiny movements
      }
    }
    
    try {
      const orderId = after.orderId;
      if (!orderId) return;
      
      // Get order details
      const orderRef = admin.firestore().collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();
      
      if (!orderDoc.exists) return;
      
      const order = orderDoc.data();
      const { lat: customerLat, lng: customerLng } = order.deliveryAddress || {};
      
      if (customerLat && customerLng) {
        // Calculate ETA using simple distance formula
        const R = 6371;
        const dLat = (customerLat - after.lat) * Math.PI / 180;
        const dLon = (customerLng - after.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(after.lat * Math.PI/180) * Math.cos(customerLat * Math.PI/180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Assume average speed of 30 km/h
        const etaMinutes = Math.ceil((distance / 30) * 60);
        const etaFormatted = etaMinutes < 60 ? `${etaMinutes} min` : `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}min`;
        
        // Update order with new ETA
        await orderRef.update({
          estimatedDeliveryTime: etaFormatted,
          driverDistance: distance.toFixed(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update ETA in Realtime Database for live tracking
        await change.after.ref.child('eta').set(etaFormatted);
        
        // Send notification when driver is close (within 1km)
        if (distance <= 1 && (!before || before.distance > 1)) {
          const userRef = admin.firestore().collection('users').doc(order.userId);
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          
          // Send push notification to customer
          console.log(`Driver is near! Sending notification to ${userData?.email}`);
        }
      }
      
    } catch (error) {
      console.error('Error in onDriverLocationUpdate trigger:', error);
    }
  });