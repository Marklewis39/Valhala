import { 
  db, auth, collection, getDocs, getDoc, doc, query, where, 
  orderBy, updateDoc, deleteDoc, addDoc, setDoc, 
  Timestamp, increment, writeBatch, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, deleteUser
} from './firebase';

// ==================== USER MANAGEMENT ====================

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', role),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, newRole) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: Timestamp.now(),
      updatedBy: 'admin'
    });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Ban/Unban user
export const toggleUserBan = async (userId, isBanned, reason = null) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isBanned,
      banReason: isBanned ? reason : null,
      bannedAt: isBanned ? Timestamp.now() : null,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error toggling user ban:', error);
    throw error;
  }
};

// Delete user account (admin only)
export const deleteUserAccount = async (userId) => {
  try {
    // First, delete user data from Firestore
    await deleteDoc(doc(db, 'users', userId));
    
    // Note: Deleting Firebase Auth user requires admin SDK
    // This should be done via Cloud Function
    
    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
};

// Get user statistics
export const getUserStatistics = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map(doc => doc.data());
    
    const totalUsers = users.length;
    const customers = users.filter(u => u.role === 'customer').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const drivers = users.filter(u => u.role === 'driver').length;
    const bannedUsers = users.filter(u => u.isBanned).length;
    
    // New users this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsersThisMonth = users.filter(u => {
      const createdAt = u.createdAt?.toDate();
      return createdAt && createdAt >= startOfMonth;
    }).length;
    
    return {
      totalUsers,
      customers,
      admins,
      drivers,
      bannedUsers,
      newUsersThisMonth
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw error;
  }
};

// ==================== SYSTEM SETTINGS ====================

// Get system settings
export const getSystemSettings = async () => {
  try {
    const settingsRef = doc(db, 'settings', 'appSettings');
    const settingsDoc = await getDoc(settingsRef);
    if (settingsDoc.exists()) {
      return settingsDoc.data();
    }
    // Return default settings
    return {
      deliveryFees: {
        baseFee: 100,
        feePerKm: 50,
        maxFee: 500,
        freeDeliveryThreshold: 5000
      },
      businessHours: {
        openTime: '08:00',
        closeTime: '23:00',
        is247: true
      },
      commission: {
        percentage: 15,
        minCommission: 50,
        maxCommission: 500
      },
      notifications: {
        emailAlerts: true,
        smsAlerts: true,
        lowStockAlerts: true,
        orderAlerts: true
      },
      updatedAt: Timestamp.now()
    };
  } catch (error) {
    console.error('Error getting system settings:', error);
    throw error;
  }
};

// Update system settings (admin only)
export const updateSystemSettings = async (settings) => {
  try {
    const settingsRef = doc(db, 'settings', 'appSettings');
    await setDoc(settingsRef, {
      ...settings,
      updatedAt: Timestamp.now(),
      updatedBy: 'admin'
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

// Update delivery fee settings
export const updateDeliveryFees = async (deliveryFees) => {
  try {
    const settingsRef = doc(db, 'settings', 'appSettings');
    await updateDoc(settingsRef, {
      deliveryFees,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating delivery fees:', error);
    throw error;
  }
};

// Update business hours
export const updateBusinessHours = async (businessHours) => {
  try {
    const settingsRef = doc(db, 'settings', 'appSettings');
    await updateDoc(settingsRef, {
      businessHours,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating business hours:', error);
    throw error;
  }
};

// ==================== ADMIN DASHBOARD ====================

// Get dashboard data
export const getDashboardData = async () => {
  try {
    const [
      ordersSnapshot,
      usersSnapshot,
      driversSnapshot,
      productsSnapshot,
      issuesSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(query(collection(db, 'users'), where('role', '==', 'customer'))),
      getDocs(collection(db, 'drivers')),
      getDocs(collection(db, 'products')),
      getDocs(query(collection(db, 'issues'), where('status', '==', 'open')))
    ]);
    
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = usersSnapshot.size;
    const activeDrivers = driversSnapshot.docs.filter(d => d.data().isActive && d.data().isAvailable).length;
    const pendingIssues = issuesSnapshot.size;
    const lowStockProducts = productsSnapshot.docs.filter(p => p.data().stock <= p.data().lowStockThreshold && p.data().stock > 0).length;
    
    // Today's orders
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      const orderDate = o.createdAt?.toDate().toISOString().split('T')[0];
      return orderDate === today;
    });
    
    // This week's revenue
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekOrders = orders.filter(o => {
      const orderDate = o.createdAt?.toDate();
      return orderDate && orderDate >= startOfWeek && o.status === 'delivered';
    });
    const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Chart data for last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(o => {
        const orderDate = o.createdAt?.toDate().toISOString().split('T')[0];
        return orderDate === dateStr && o.status === 'delivered';
      });
      
      chartData.push({
        date: dateStr,
        revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        orders: dayOrders.length
      });
    }
    
    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      activeDrivers,
      pendingIssues,
      lowStockProducts,
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      weekRevenue,
      chartData
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
};

// Get recent activity
export const getRecentActivity = async (limitCount = 10) => {
  try {
    const [ordersSnapshot, issuesSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(limitCount))),
      getDocs(query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(limitCount)))
    ]);
    
    const recentOrders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'order',
      ...doc.data()
    }));
    
    const recentIssues = issuesSnapshot.docs.map(doc => ({
      id: doc.id,
      type: 'issue',
      ...doc.data()
    }));
    
    const activity = [...recentOrders, ...recentIssues];
    activity.sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return dateB - dateA;
    });
    
    return activity.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    throw error;
  }
};

// ==================== REPORTS ====================

// Generate sales report
export const generateSalesReport = async (startDate, endDate) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<=', endTimestamp),
      where('status', '==', 'delivered'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Group by day
    const dailyData = {};
    orders.forEach(order => {
      const date = order.createdAt?.toDate().toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0 };
      }
      dailyData[date].revenue += order.total || 0;
      dailyData[date].orders += 1;
    });
    
    return {
      startDate,
      endDate,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      dailyData,
      orders
    };
  } catch (error) {
    console.error('Error generating sales report:', error);
    throw error;
  }
};

// Generate product report
export const generateProductReport = async () => {
  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const ordersSnapshot = await getDocs(query(
      collection(db, 'orders'),
      where('status', '==', 'delivered')
    ));
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    // Calculate sales per product
    const productSales = {};
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            unitsSold: 0,
            revenue: 0,
            profit: 0
          };
        }
        productSales[item.productId].unitsSold += item.quantity;
        productSales[item.productId].revenue += item.sellingPrice * item.quantity;
        productSales[item.productId].profit += (item.sellingPrice - (item.buyPrice || 0)) * item.quantity;
      });
    });
    
    const productReport = products.map(product => ({
      ...product,
      ...(productSales[product.id] || { unitsSold: 0, revenue: 0, profit: 0 }),
      profitMargin: productSales[product.id]?.revenue > 0 
        ? (productSales[product.id].profit / productSales[product.id].revenue) * 100 
        : 0
    }));
    
    productReport.sort((a, b) => b.revenue - a.revenue);
    
    const totalRevenue = productReport.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = productReport.reduce((sum, p) => sum + p.profit, 0);
    
    return {
      products: productReport,
      summary: {
        totalProducts: products.length,
        totalRevenue,
        totalProfit,
        overallMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      }
    };
  } catch (error) {
    console.error('Error generating product report:', error);
    throw error;
  }
};

// Generate driver performance report
export const generateDriverReport = async () => {
  try {
    const driversSnapshot = await getDocs(collection(db, 'drivers'));
    const drivers = driversSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const ordersSnapshot = await getDocs(query(
      collection(db, 'orders'),
      where('status', '==', 'delivered')
    ));
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    // Calculate deliveries per driver
    const driverDeliveries = {};
    orders.forEach(order => {
      if (order.driverId) {
        if (!driverDeliveries[order.driverId]) {
          driverDeliveries[order.driverId] = {
            deliveries: 0,
            totalRevenue: 0,
            averageRating: 0
          };
        }
        driverDeliveries[order.driverId].deliveries += 1;
        driverDeliveries[order.driverId].totalRevenue += order.total || 0;
      }
    });
    
    const driverReport = drivers.map(driver => ({
      ...driver,
      ...(driverDeliveries[driver.id] || { deliveries: 0, totalRevenue: 0 }),
      averageRating: driver.rating || 5
    }));
    
    driverReport.sort((a, b) => b.deliveries - a.deliveries);
    
    const totalDeliveries = driverReport.reduce((sum, d) => sum + d.deliveries, 0);
    const activeDrivers = driverReport.filter(d => d.isActive).length;
    
    return {
      drivers: driverReport,
      summary: {
        totalDrivers: drivers.length,
        activeDrivers,
        totalDeliveries,
        averageDeliveriesPerDriver: activeDrivers > 0 ? totalDeliveries / activeDrivers : 0
      }
    };
  } catch (error) {
    console.error('Error generating driver report:', error);
    throw error;
  }
};

// ==================== NOTIFICATIONS ====================

// Send notification to user (admin only)
export const sendNotification = async (userId, title, message, type = 'general') => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: Timestamp.now(),
      sentBy: 'admin'
    });
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send bulk notification to users
export const sendBulkNotification = async (userIds, title, message, type = 'general') => {
  const batch = writeBatch(db);
  
  userIds.forEach(userId => {
    const notificationRef = doc(collection(db, 'notifications'));
    batch.set(notificationRef, {
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: Timestamp.now(),
      sentBy: 'admin'
    });
  });
  
  await batch.commit();
  return true;
};

// Get all notifications for a user
export const getUserNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// ==================== BACKUP & MAINTENANCE ====================

// Export all data (admin only)
export const exportAllData = async () => {
  try {
    const collections = ['users', 'orders', 'products', 'drivers', 'issues', 'payments'];
    const exportData = {};
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      exportData[collectionName] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    return exportData;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// Get system health status
export const getSystemHealth = async () => {
  try {
    const startTime = Date.now();
    
    // Test Firestore connection
    await getDocs(query(collection(db, 'users'), limit(1)));
    const firestoreLatency = Date.now() - startTime;
    
    // Get counts
    const [
      usersCount,
      ordersCount,
      productsCount
    ] = await Promise.all([
      getDocs(collection(db, 'users')).then(s => s.size),
      getDocs(collection(db, 'orders')).then(s => s.size),
      getDocs(collection(db, 'products')).then(s => s.size)
    ]);
    
    return {
      status: 'healthy',
      firestoreLatency: `${firestoreLatency}ms`,
      timestamp: new Date().toISOString(),
      counts: {
        users: usersCount,
        orders: ordersCount,
        products: productsCount
      }
    };
  } catch (error) {
    console.error('Error checking system health:', error);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ==================== PERMISSION CHECKS ====================

// Check if user is admin
export const isUserAdmin = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Check if user is banned
export const isUserBanned = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().isBanned || false;
    }
    return false;
  } catch (error) {
    console.error('Error checking ban status:', error);
    return false;
  }
};

export default {
  // User Management
  getAllUsers,
  getUsersByRole,
  getUserById,
  updateUserRole,
  toggleUserBan,
  deleteUserAccount,
  getUserStatistics,
  
  // System Settings
  getSystemSettings,
  updateSystemSettings,
  updateDeliveryFees,
  updateBusinessHours,
  
  // Dashboard
  getDashboardData,
  getRecentActivity,
  
  // Reports
  generateSalesReport,
  generateProductReport,
  generateDriverReport,
  
  // Notifications
  sendNotification,
  sendBulkNotification,
  getUserNotifications,
  markNotificationAsRead,
  
  // Backup & Maintenance
  exportAllData,
  getSystemHealth,
  
  // Permission Checks
  isUserAdmin,
  isUserBanned
};