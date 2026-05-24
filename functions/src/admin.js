const functions = require('firebase-functions');
const { db, admin, auth } = require('./config/firebaseAdmin');

// ============================================
// DRIVER MANAGEMENT
// ============================================

// Create new driver account (admin only)
exports.createDriver = functions.https.onCall(async (data, context) => {
  // Check admin authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { email, password, name, phone, vehicleType, vehicleNumber, licenseNumber, idNumber } = data;
  
  try {
    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });
    
    // Create driver profile in Firestore
    await db.collection('drivers').doc(userRecord.uid).set({
      userId: userRecord.uid,
      name,
      email,
      phoneNumber: phone,
      vehicleType,
      vehicleNumber,
      licenseNumber: licenseNumber || '',
      idNumber: idNumber || '',
      isActive: true,
      isAvailable: true,
      totalDeliveries: 0,
      rating: 5.0,
      ratingCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid
    });
    
    // Create user document
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      phone,
      role: 'driver',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      userId: userRecord.uid,
      message: 'Driver created successfully',
      driver: {
        id: userRecord.uid,
        name,
        email,
        phone,
        vehicleType,
        vehicleNumber
      }
    };
  } catch (error) {
    console.error('Create driver error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create driver: ' + error.message);
  }
});

// Fire/disable driver (admin only)
exports.fireDriver = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { driverId, reason } = data;
  
  try {
    // Update driver status in Firestore
    await db.collection('drivers').doc(driverId).update({
      isActive: false,
      isAvailable: false,
      firedAt: admin.firestore.FieldValue.serverTimestamp(),
      fireReason: reason || 'No reason provided',
      firedBy: context.auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Disable Firebase Auth user
    await auth.updateUser(driverId, { disabled: true });
    
    // Log the action
    await db.collection('adminLogs').add({
      action: 'fire_driver',
      driverId,
      reason: reason || 'No reason provided',
      performedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { 
      success: true, 
      message: 'Driver has been fired and disabled',
      driverId
    };
  } catch (error) {
    console.error('Fire driver error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fire driver: ' + error.message);
  }
});

// Activate driver (admin only)
exports.activateDriver = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { driverId } = data;
  
  try {
    await db.collection('drivers').doc(driverId).update({
      isActive: true,
      isAvailable: true,
      firedAt: null,
      fireReason: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Enable Firebase Auth user
    await auth.updateUser(driverId, { disabled: false });
    
    return { 
      success: true, 
      message: 'Driver has been activated',
      driverId
    };
  } catch (error) {
    console.error('Activate driver error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to activate driver: ' + error.message);
  }
});

// Get all drivers (admin only)
exports.getAllDrivers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  try {
    const driversSnapshot = await db.collection('drivers').get();
    const drivers = driversSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null
    }));
    
    return { success: true, drivers };
  } catch (error) {
    console.error('Get drivers error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get drivers');
  }
});

// ============================================
// INVENTORY MANAGEMENT
// ============================================

// Add new product (admin only)
exports.addProduct = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { name, brand, category, description, buyPrice, sellingPrice, stock, lowStockThreshold, alcoholPercentage, volume, imageUrl } = data;
  
  try {
    const productRef = db.collection('products').doc();
    await productRef.set({
      id: productRef.id,
      name,
      brand: brand || '',
      category,
      description: description || '',
      buyPrice,
      sellingPrice,
      stock: stock || 0,
      lowStockThreshold: lowStockThreshold || 10,
      alcoholPercentage: alcoholPercentage || 0,
      volume: volume || 0,
      imageUrl: imageUrl || '',
      isAvailable: (stock || 0) > 0,
      totalSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid
    });
    
    return {
      success: true,
      productId: productRef.id,
      message: 'Product added successfully'
    };
  } catch (error) {
    console.error('Add product error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add product');
  }
});

// Update product (admin only)
exports.updateProduct = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { productId, ...updates } = data;
  
  try {
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updates.isAvailable = updates.stock !== undefined ? updates.stock > 0 : undefined;
    
    await db.collection('products').doc(productId).update(updates);
    
    return {
      success: true,
      message: 'Product updated successfully'
    };
  } catch (error) {
    console.error('Update product error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update product');
  }
});

// Update stock (admin only)
exports.updateStock = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { productId, quantity, reason } = data;
  
  try {
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      throw new Error('Product not found');
    }
    
    const currentStock = productDoc.data().stock || 0;
    const newStock = currentStock + quantity;
    
    await productRef.update({
      stock: newStock,
      isAvailable: newStock > 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Log inventory change
    await db.collection('inventory_logs').add({
      productId,
      previousStock: currentStock,
      newStock,
      changeAmount: quantity,
      reason: reason || 'admin_update',
      performedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      newStock,
      message: 'Stock updated successfully'
    };
  } catch (error) {
    console.error('Update stock error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update stock');
  }
});

// ============================================
// ORDER MANAGEMENT
// ============================================

// Update order status (admin only)
exports.updateOrderStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { orderId, status, driverId } = data;
  
  try {
    const updates = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (driverId) {
      updates.driverId = driverId;
      updates.assignedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    if (status === 'delivered') {
      updates.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
      
      // Update driver stats
      if (driverId) {
        const driverRef = db.collection('drivers').doc(driverId);
        const driverDoc = await driverRef.get();
        if (driverDoc.exists) {
          await driverRef.update({
            totalDeliveries: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }
    
    await db.collection('orders').doc(orderId).update(updates);
    
    return {
      success: true,
      message: 'Order status updated successfully'
    };
  } catch (error) {
    console.error('Update order error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update order');
  }
});

// Assign driver to order (admin only)
exports.assignDriver = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { orderId, driverId } = data;
  
  try {
    // Check if driver is available
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists || !driverDoc.data().isActive || !driverDoc.data().isAvailable) {
      throw new Error('Driver is not available');
    }
    
    await db.collection('orders').doc(orderId).update({
      driverId,
      status: 'awaiting_driver',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Mark driver as unavailable
    await db.collection('drivers').doc(driverId).update({
      isAvailable: false,
      currentOrderId: orderId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Driver assigned successfully'
    };
  } catch (error) {
    console.error('Assign driver error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to assign driver');
  }
});

// ============================================
// ISSUE MANAGEMENT
// ============================================

// Resolve issue (admin only)
exports.resolveIssue = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { issueId, response } = data;
  
  try {
    await db.collection('issues').doc(issueId).update({
      status: 'resolved',
      adminResponse: response || 'Issue has been resolved',
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedBy: context.auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Issue resolved successfully'
    };
  } catch (error) {
    console.error('Resolve issue error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to resolve issue');
  }
});

// ============================================
// ANALYTICS & REPORTS
// ============================================

// Get system analytics (admin only)
exports.getAnalytics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { period = 'month' } = data;
  
  try {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (period === 'quarter') startDate.setMonth(now.getMonth() - 3);
    else if (period === 'year') startDate.setFullYear(now.getFullYear() - 1);
    else startDate = new Date(0);
    
    const startTimestamp = admin.firestore.Timestamp.fromDate(startDate);
    
    // Get orders in period
    const ordersSnapshot = await db.collection('orders')
      .where('createdAt', '>=', startTimestamp)
      .get();
    
    const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
    
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = allOrders.length;
    const completedOrders = deliveredOrders.length;
    
    // Get user statistics
    const usersSnapshot = await db.collection('users').get();
    const totalCustomers = usersSnapshot.docs.filter(doc => doc.data().role === 'customer').length;
    const totalAdmins = usersSnapshot.docs.filter(doc => doc.data().role === 'admin').length;
    
    // Get driver statistics
    const driversSnapshot = await db.collection('drivers').get();
    const totalDrivers = driversSnapshot.size;
    const activeDrivers = driversSnapshot.docs.filter(doc => doc.data().isActive && doc.data().isAvailable).length;
    const inactiveDrivers = driversSnapshot.docs.filter(doc => !doc.data().isActive).length;
    
    // Get issue statistics
    const issuesSnapshot = await db.collection('issues').get();
    const pendingIssues = issuesSnapshot.docs.filter(doc => doc.data().status === 'open').length;
    const resolvedIssues = issuesSnapshot.docs.filter(doc => doc.data().status === 'resolved').length;
    
    // Get product statistics
    const productsSnapshot = await db.collection('products').get();
    const totalProducts = productsSnapshot.size;
    const lowStockProducts = productsSnapshot.docs.filter(p => {
      const data = p.data();
      return data.stock <= data.lowStockThreshold && data.stock > 0;
    }).length;
    const outOfStockProducts = productsSnapshot.docs.filter(p => p.data().stock === 0).length;
    
    // Calculate profit and loss
    let totalCost = 0;
    let totalProfit = 0;
    
    productsSnapshot.docs.forEach(doc => {
      const product = doc.data();
      const sold = product.totalSold || 0;
      const profitPerUnit = (product.sellingPrice || 0) - (product.buyPrice || 0);
      totalProfit += profitPerUnit * sold;
      totalCost += (product.buyPrice || 0) * sold;
    });
    
    // Daily chart data
    const dailyData = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { revenue: 0, orders: 0, profit: 0 };
    }
    
    deliveredOrders.forEach(order => {
      const dateStr = order.createdAt.toDate().toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].revenue += order.total || 0;
        dailyData[dateStr].orders += 1;
      }
    });
    
    const chartData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
      profit: data.profit
    }));
    
    return {
      success: true,
      summary: {
        totalRevenue,
        totalOrders,
        completedOrders,
        totalCustomers,
        totalAdmins,
        totalDrivers,
        activeDrivers,
        inactiveDrivers,
        pendingIssues,
        resolvedIssues,
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalProfit,
        totalCost,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      },
      chartData,
      period
    };
  } catch (error) {
    console.error('Get analytics error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get analytics');
  }
});

// Get profit and loss report (admin only)
exports.getProfitLoss = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => {
      const product = doc.data();
      const sold = product.totalSold || 0;
      const revenue = product.sellingPrice * sold;
      const cost = product.buyPrice * sold;
      const profit = revenue - cost;
      
      return {
        id: doc.id,
        name: product.name,
        buyPrice: product.buyPrice,
        sellingPrice: product.sellingPrice,
        unitsSold: sold,
        totalRevenue: revenue,
        totalCost: cost,
        totalProfit: profit,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0
      };
    });
    
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalCost = products.reduce((sum, p) => sum + p.totalCost, 0);
    const totalProfit = products.reduce((sum, p) => sum + p.totalProfit, 0);
    
    return {
      success: true,
      products,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      }
    };
  } catch (error) {
    console.error('Get profit loss error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get profit/loss data');
  }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get dashboard stats (admin only)
exports.getDashboardStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();
  if (adminDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
    
    // Today's orders
    const todayOrdersSnapshot = await db.collection('orders')
      .where('createdAt', '>=', todayTimestamp)
      .get();
    
    const todayOrders = todayOrdersSnapshot.docs.map(doc => doc.data());
    const todayRevenue = todayOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Recent orders (last 10)
    const recentOrdersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const recentOrders = recentOrdersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null
    }));
    
    // Low stock alerts
    const productsSnapshot = await db.collection('products').get();
    const lowStockAlerts = productsSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.stock <= data.lowStockThreshold && data.stock > 0;
      })
      .map(doc => ({
        id: doc.id,
        name: doc.data().name,
        stock: doc.data().stock,
        threshold: doc.data().lowStockThreshold
      }));
    
    return {
      success: true,
      stats: {
        todayRevenue,
        todayOrders: todayOrders.length,
        activeDrivers: 0, // This would need real-time data
        pendingIssues: 0 // This would need real-time data
      },
      recentOrders,
      lowStockAlerts
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get dashboard stats');
  }
});