const functions = require('firebase-functions');
const { db, admin } = require('./config/firebaseAdmin');

/**
 * Calculate delivery fee based on distance and configuration
 */
const calculateDeliveryFeeByDistance = (distance, config) => {
  const baseFee = config.baseFee || 100;
  const feePerKm = config.feePerKm || 50;
  const maxFee = config.maxFee || 500;
  
  let fee = baseFee + (distance * feePerKm);
  fee = Math.min(fee, maxFee);
  
  return Math.round(fee);
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Find nearest distribution center
 */
const findNearestCenter = async (lat, lng) => {
  try {
    // Get delivery centers from settings
    const settingsDoc = await db.collection('settings').doc('deliveryConfig').get();
    let centers = [];
    
    if (settingsDoc.exists) {
      centers = settingsDoc.data().distributionCenters || [];
    }
    
    // Default centers if none configured
    if (centers.length === 0) {
      centers = [
        { name: 'Valhala Main Depot', lat: -1.2921, lng: 36.8219, address: 'CBD, Nairobi' },
        { name: 'Westlands Hub', lat: -1.2675, lng: 36.8037, address: 'Westlands, Nairobi' },
        { name: 'Eastlands Hub', lat: -1.2833, lng: 36.8333, address: 'Eastlands, Nairobi' }
      ];
    }
    
    let minDistance = Infinity;
    let nearestCenter = null;
    
    centers.forEach(center => {
      const distance = calculateDistance(lat, lng, center.lat, center.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCenter = center;
      }
    });
    
    return {
      center: nearestCenter,
      distance: minDistance
    };
  } catch (error) {
    console.error('Error finding nearest center:', error);
    return {
      center: { name: 'Valhala Main Depot', lat: -1.2921, lng: 36.8219 },
      distance: 5
    };
  }
};

/**
 * Get delivery fee configuration from settings
 */
const getDeliveryConfig = async () => {
  try {
    const settingsDoc = await db.collection('settings').doc('deliveryConfig').get();
    
    if (settingsDoc.exists) {
      return settingsDoc.data();
    }
    
    // Default configuration
    const defaultConfig = {
      baseFee: 100,
      feePerKm: 50,
      maxFee: 500,
      freeDeliveryThreshold: 5000,
      estimatedSpeedKmh: 30,
      preparationTimeMinutes: 15,
      distributionCenters: [
        { name: 'Valhala Main Depot', lat: -1.2921, lng: 36.8219, address: 'CBD, Nairobi' },
        { name: 'Westlands Hub', lat: -1.2675, lng: 36.8037, address: 'Westlands, Nairobi' },
        { name: 'Eastlands Hub', lat: -1.2833, lng: 36.8333, address: 'Eastlands, Nairobi' }
      ],
      peakHours: [
        { start: 8, end: 10, multiplier: 1.5 },
        { start: 17, end: 19, multiplier: 1.5 }
      ],
      nightHours: { start: 22, end: 5, multiplier: 1.3 },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save default config
    await db.collection('settings').doc('deliveryConfig').set(defaultConfig);
    
    return defaultConfig;
  } catch (error) {
    console.error('Error getting delivery config:', error);
    return {
      baseFee: 100,
      feePerKm: 50,
      maxFee: 500,
      freeDeliveryThreshold: 5000,
      estimatedSpeedKmh: 30,
      preparationTimeMinutes: 15
    };
  }
};

/**
 * Calculate delivery fee for an order
 * Called from client or as a standalone function
 */
exports.calculateDeliveryFee = functions.https.onCall(async (data, context) => {
  // Optional authentication - can be called by anyone
  const { lat, lng, subtotal } = data;
  
  if (!lat || !lng) {
    throw new functions.https.HttpsError('invalid-argument', 'Customer location is required');
  }
  
  try {
    // Get delivery configuration
    const config = await getDeliveryConfig();
    
    // Find nearest distribution center
    const { center, distance } = await findNearestCenter(lat, lng);
    
    // Calculate base delivery fee
    let deliveryFee = calculateDeliveryFeeByDistance(distance, config);
    
    // Apply time-based multiplier if applicable
    const currentHour = new Date().getHours();
    
    // Check peak hours
    for (const peak of config.peakHours || []) {
      if (currentHour >= peak.start && currentHour < peak.end) {
        deliveryFee = Math.round(deliveryFee * peak.multiplier);
        break;
      }
    }
    
    // Check night hours
    if (config.nightHours) {
      const { start, end, multiplier } = config.nightHours;
      if (currentHour >= start || currentHour < end) {
        deliveryFee = Math.round(deliveryFee * multiplier);
      }
    }
    
    // Apply free delivery if subtotal meets threshold
    let isFreeDelivery = false;
    if (subtotal && subtotal >= (config.freeDeliveryThreshold || 5000)) {
      deliveryFee = 0;
      isFreeDelivery = true;
    }
    
    // Calculate estimated delivery time
    const travelTimeHours = distance / (config.estimatedSpeedKmh || 30);
    let travelTimeMinutes = Math.ceil(travelTimeHours * 60);
    const totalMinutes = travelTimeMinutes + (config.preparationTimeMinutes || 15);
    
    let etaFormatted;
    if (totalMinutes < 60) {
      etaFormatted = `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      etaFormatted = `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return {
      success: true,
      deliveryFee,
      originalFee: deliveryFee,
      isFreeDelivery,
      distance: distance.toFixed(1),
      center: center?.name || 'Valhala Main Depot',
      eta: totalMinutes,
      etaFormatted,
      config: {
        baseFee: config.baseFee,
        feePerKm: config.feePerKm,
        maxFee: config.maxFee,
        freeDeliveryThreshold: config.freeDeliveryThreshold
      }
    };
    
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    throw new functions.https.HttpsError('internal', 'Failed to calculate delivery fee');
  }
});

/**
 * Get delivery fee for an existing order
 */
exports.getOrderDeliveryFee = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { orderId } = data;
  
  if (!orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'Order ID is required');
  }
  
  try {
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }
    
    const order = orderDoc.data();
    
    // Check permission
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userRole = userDoc.data()?.role;
    
    if (userRole !== 'admin' && order.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You don\'t have permission to view this order');
    }
    
    return {
      success: true,
      deliveryFee: order.deliveryFee,
      distance: order.distance,
      eta: order.estimatedDeliveryTime,
      center: order.deliveryCenter
    };
    
  } catch (error) {
    console.error('Error getting order delivery fee:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get delivery fee');
  }
});

/**
 * Update delivery fee configuration (Admin only)
 */
exports.updateDeliveryConfig = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Verify admin role
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;
  
  if (userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { config } = data;
  
  if (!config) {
    throw new functions.https.HttpsError('invalid-argument', 'Configuration data is required');
  }
  
  try {
    const configRef = db.collection('settings').doc('deliveryConfig');
    
    // Validate config values
    if (config.baseFee !== undefined && (config.baseFee < 0 || config.baseFee > 1000)) {
      throw new functions.https.HttpsError('invalid-argument', 'Base fee must be between 0 and 1000');
    }
    
    if (config.feePerKm !== undefined && (config.feePerKm < 0 || config.feePerKm > 200)) {
      throw new functions.https.HttpsError('invalid-argument', 'Fee per KM must be between 0 and 200');
    }
    
    if (config.maxFee !== undefined && (config.maxFee < 0 || config.maxFee > 2000)) {
      throw new functions.https.HttpsError('invalid-argument', 'Maximum fee must be between 0 and 2000');
    }
    
    if (config.freeDeliveryThreshold !== undefined && config.freeDeliveryThreshold < 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Free delivery threshold must be positive');
    }
    
    const updateData = {
      ...config,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    };
    
    await configRef.set(updateData, { merge: true });
    
    // Log the update
    await db.collection('admin_logs').add({
      action: 'update_delivery_config',
      adminId: context.auth.uid,
      adminEmail: userDoc.data().email,
      changes: config,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Delivery fee configuration updated successfully',
      config: updateData
    };
    
  } catch (error) {
    console.error('Error updating delivery config:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update delivery configuration');
  }
});

/**
 * Get delivery fee configuration (Admin only)
 */
exports.getDeliveryConfig = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Verify admin role
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;
  
  if (userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  try {
    const config = await getDeliveryConfig();
    
    return {
      success: true,
      config
    };
    
  } catch (error) {
    console.error('Error getting delivery config:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get delivery configuration');
  }
});

/**
 * Bulk calculate delivery fees for multiple locations
 */
exports.bulkCalculateDeliveryFees = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const { locations } = data;
  
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Locations array is required');
  }
  
  try {
    const config = await getDeliveryConfig();
    const results = [];
    
    for (const location of locations) {
      const { lat, lng, subtotal } = location;
      
      if (!lat || !lng) {
        results.push({
          location,
          error: 'Missing coordinates',
          deliveryFee: null
        });
        continue;
      }
      
      const { center, distance } = await findNearestCenter(lat, lng);
      let deliveryFee = calculateDeliveryFeeByDistance(distance, config);
      
      // Apply free delivery if applicable
      let isFreeDelivery = false;
      if (subtotal && subtotal >= (config.freeDeliveryThreshold || 5000)) {
        deliveryFee = 0;
        isFreeDelivery = true;
      }
      
      results.push({
        location,
        deliveryFee,
        isFreeDelivery,
        distance: distance.toFixed(1),
        center: center?.name
      });
    }
    
    return {
      success: true,
      results
    };
    
  } catch (error) {
    console.error('Error bulk calculating delivery fees:', error);
    throw new functions.https.HttpsError('internal', 'Failed to calculate delivery fees');
  }
});

/**
 * Webhook to recalculate delivery fees for pending orders (scheduled function)
 * This would run every hour via Cloud Scheduler
 */
exports.recalculatePendingOrderFees = functions.pubsub.schedule('0 * * * *').onRun(async (context) => {
  try {
    // Get pending orders from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const pendingOrders = await db.collection('orders')
      .where('status', 'in', ['pending_payment', 'awaiting_driver'])
      .where('createdAt', '>=', yesterday)
      .get();
    
    const config = await getDeliveryConfig();
    let updatedCount = 0;
    
    for (const orderDoc of pendingOrders.docs) {
      const order = orderDoc.data();
      const { lat, lng } = order.deliveryAddress || {};
      
      if (lat && lng) {
        const { distance } = await findNearestCenter(lat, lng);
        let newDeliveryFee = calculateDeliveryFeeByDistance(distance, config);
        
        // Apply free delivery if applicable
        if (order.subtotal >= (config.freeDeliveryThreshold || 5000)) {
          newDeliveryFee = 0;
        }
        
        // Update if fee changed
        if (newDeliveryFee !== order.deliveryFee) {
          await orderDoc.ref.update({
            deliveryFee: newDeliveryFee,
            total: order.subtotal + newDeliveryFee,
            paidUpfront: (order.subtotal + newDeliveryFee) * 0.5,
            remainingDue: (order.subtotal + newDeliveryFee) * 0.5,
            feeRecalculatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          updatedCount++;
        }
      }
    }
    
    console.log(`Recalculated fees for ${updatedCount} orders`);
    return { success: true, updatedCount };
    
  } catch (error) {
    console.error('Error recalculating pending order fees:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Estimate delivery time based on distance and current traffic
 */
exports.estimateDeliveryTime = functions.https.onCall(async (data, context) => {
  const { lat, lng } = data;
  
  if (!lat || !lng) {
    throw new functions.https.HttpsError('invalid-argument', 'Customer location is required');
  }
  
  try {
    const config = await getDeliveryConfig();
    const { distance } = await findNearestCenter(lat, lng);
    
    // Calculate travel time
    const travelTimeHours = distance / (config.estimatedSpeedKmh || 30);
    let travelTimeMinutes = Math.ceil(travelTimeHours * 60);
    
    // Add preparation time
    const totalMinutes = travelTimeMinutes + (config.preparationTimeMinutes || 15);
    
    // Apply time-based multiplier
    const currentHour = new Date().getHours();
    let multiplier = 1;
    
    for (const peak of config.peakHours || []) {
      if (currentHour >= peak.start && currentHour < peak.end) {
        multiplier = peak.multiplier;
        break;
      }
    }
    
    const adjustedMinutes = Math.ceil(totalMinutes * multiplier);
    
    let formattedTime;
    if (adjustedMinutes < 60) {
      formattedTime = `${adjustedMinutes} minutes`;
    } else {
      const hours = Math.floor(adjustedMinutes / 60);
      const minutes = adjustedMinutes % 60;
      formattedTime = `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    return {
      success: true,
      minutes: adjustedMinutes,
      formatted: formattedTime,
      distance: distance.toFixed(1),
      baseTime: totalMinutes,
      multiplier
    };
    
  } catch (error) {
    console.error('Error estimating delivery time:', error);
    throw new functions.https.HttpsError('internal', 'Failed to estimate delivery time');
  }
});