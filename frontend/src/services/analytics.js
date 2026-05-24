import { 
  db, collection, getDocs, query, where, orderBy, 
  Timestamp, doc, getDoc, updateDoc, increment
} from './firebase';

// Get sales analytics for a period
export const getSalesAnalytics = async (period = 'month') => {
  try {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate = new Date(0);
    }
    
    const startTimestamp = Timestamp.fromDate(startDate);
    
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', startTimestamp),
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
    
    const chartData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
      averageOrderValue: data.revenue / data.orders
    }));
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      chartData: chartData.sort((a, b) => a.date.localeCompare(b.date))
    };
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    throw error;
  }
};

// Get product performance
export const getProductPerformance = async (period = 'month') => {
  try {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate = new Date(0);
    }
    
    const startTimestamp = Timestamp.fromDate(startDate);
    
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', startTimestamp),
      where('status', '==', 'delivered')
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => doc.data());
    
    const productStats = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            name: item.name,
            unitsSold: 0,
            revenue: 0,
            profit: 0
          };
        }
        productStats[item.productId].unitsSold += item.quantity;
        productStats[item.productId].revenue += item.sellingPrice * item.quantity;
        productStats[item.productId].profit += (item.sellingPrice - (item.buyPrice || 0)) * item.quantity;
      });
    });
    
    const products = Object.values(productStats);
    products.sort((a, b) => b.revenue - a.revenue);
    
    return {
      topSelling: products.slice(0, 10),
      totalProducts: products.length,
      totalUnitsSold: products.reduce((sum, p) => sum + p.unitsSold, 0)
    };
  } catch (error) {
    console.error('Error getting product performance:', error);
    throw error;
  }
};

// Get profit/loss report
export const getProfitLossReport = async (period = 'month') => {
  try {
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate = new Date(0);
    }
    
    const startTimestamp = Timestamp.fromDate(startDate);
    
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', startTimestamp),
      where('status', '==', 'delivered')
    );
    
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => doc.data());
    
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    
    orders.forEach(order => {
      totalRevenue += order.total || 0;
      
      order.items?.forEach(item => {
        const cost = (item.buyPrice || 0) * item.quantity;
        totalCost += cost;
        totalProfit += (item.sellingPrice - (item.buyPrice || 0)) * item.quantity;
      });
    });
    
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      orderCount: orders.length,
      period
    };
  } catch (error) {
    console.error('Error getting profit/loss report:', error);
    throw error;
  }
};

// Get customer analytics
export const getCustomerAnalytics = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.filter(doc => doc.data().role === 'customer').map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => doc.data());
    
    // Count orders per customer
    const customerOrders = {};
    orders.forEach(order => {
      if (order.userId) {
        customerOrders[order.userId] = (customerOrders[order.userId] || 0) + 1;
      }
    });
    
    const customersWithOrders = Object.keys(customerOrders).length;
    const totalCustomers = users.length;
    const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    
    return {
      totalCustomers,
      customersWithOrders,
      repeatCustomers,
      repeatRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
      averageOrdersPerCustomer: customersWithOrders > 0 ? orders.length / customersWithOrders : 0
    };
  } catch (error) {
    console.error('Error getting customer analytics:', error);
    throw error;
  }
};

// Track product view (analytics)
export const trackProductView = async (productId, userId = null) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      views: increment(1)
    });
    
    // Optional: Log to analytics collection
    await addDoc(collection(db, 'product_views'), {
      productId,
      userId,
      viewedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking product view:', error);
    return false;
  }
};

// Track cart addition
export const trackCartAddition = async (productId, userId = null, quantity = 1) => {
  try {
    await addDoc(collection(db, 'cart_events'), {
      productId,
      userId,
      quantity,
      action: 'add_to_cart',
      timestamp: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error tracking cart addition:', error);
    return false;
  }
};

// Get dashboard metrics
export const getDashboardMetrics = async () => {
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
    
    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      activeDrivers,
      pendingIssues,
      lowStockProducts,
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };
  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    throw error;
  }
};