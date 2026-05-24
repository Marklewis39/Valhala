const functions = require('firebase-functions');
const { db, admin, auth } = require('../config/firebaseAdmin');

/**
 * Create a new driver account
 * Admin only function
 */
exports.createDriver = functions.https.onCall(async (data, context) => {
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
  
  // Extract driver data
  const {
    email,
    password,
    name,
    phoneNumber,
    vehicleType,
    vehicleNumber,
    licenseNumber,
    idNumber,
    emergencyContact,
    emergencyPhone
  } = data;
  
  // Validation
  if (!email || !email.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid email is required');
  }
  
  if (!password || password.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters');
  }
  
  if (!name || name.trim() === '') {
    throw new functions.https.HttpsError('invalid-argument', 'Driver name is required');
  }
  
  if (!phoneNumber) {
    throw new functions.https.HttpsError('invalid-argument', 'Phone number is required');
  }
  
  if (!vehicleNumber) {
    throw new functions.https.HttpsError('invalid-argument', 'Vehicle number is required');
  }
  
  if (!licenseNumber) {
    throw new functions.https.HttpsError('invalid-argument', 'Driver\'s license number is required');
  }
  
  try {
    // Check if email already exists
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        throw new functions.https.HttpsError('already-exists', 'Email already registered');
      }
    } catch (error) {
      // Email doesn't exist, continue
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }
    
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false
    });
    
    // Generate a temporary access code for the driver
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create driver profile in Firestore
    const driverData = {
      userId: userRecord.uid,
      name: name.trim(),
      email,
      phoneNumber,
      vehicleType: vehicleType || 'motorcycle',
      vehicleNumber: vehicleNumber.toUpperCase(),
      licenseNumber,
      idNumber: idNumber || '',
      emergencyContact: emergencyContact || '',
      emergencyPhone: emergencyPhone || '',
      isActive: true,
      isAvailable: true,
      totalDeliveries: 0,
      rating: 5.0,
      ratingCount: 0,
      totalEarnings: 0,
      currentOrderId: null,
      accessCode,
      currentLocation: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid
    };
    
    await db.collection('drivers').doc(userRecord.uid).set(driverData);
    
    // Create user document in users collection
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name: name.trim(),
      phone: phoneNumber,
      role: 'driver',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Log the action
    await db.collection('admin_logs').add({
      action: 'create_driver',
      adminId: context.auth.uid,
      adminEmail: adminDoc.data().email,
      driverId: userRecord.uid,
      driverName: name,
      driverEmail: email,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send welcome email with credentials
    const emailService = require('../utils/emailService');
    await emailService.sendDriverWelcomeEmail(email, name, password, accessCode);
    
    return {
      success: true,
      message: 'Driver account created successfully',
      driver: {
        uid: userRecord.uid,
        name,
        email,
        phoneNumber,
        vehicleNumber,
        accessCode
      }
    };
    
  } catch (error) {
    console.error('Error creating driver:', error);
    
    // Clean up - if auth user was created but Firestore failed, delete the auth user
    if (error.code !== 'auth/email-already-exists') {
      // Attempt to clean up
      try {
        const userRecord = await auth.getUserByEmail(email);
        if (userRecord) {
          await auth.deleteUser(userRecord.uid);
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create driver: ' + error.message);
  }
});

/**
 * Get driver details
 */
exports.getDriverDetails = functions.https.onCall(async (data, context) => {
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
  
  const { driverId } = data;
  
  if (!driverId) {
    throw new functions.https.HttpsError('invalid-argument', 'Driver ID is required');
  }
  
  try {
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    
    if (!driverDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Driver not found');
    }
    
    // Get driver's order history
    const ordersSnapshot = await db.collection('orders')
      .where('driverId', '==', driverId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
    
    const orderHistory = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      driver: {
        id: driverDoc.id,
        ...driverDoc.data()
      },
      orderHistory
    };
    
  } catch (error) {
    console.error('Error getting driver details:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get driver details');
  }
});