import { 
  db, collection, addDoc, getDocs, getDoc, doc, query, 
  where, orderBy, updateDoc, onSnapshot, Timestamp,
  limit, writeBatch
} from './firebase';

const COLLECTION = 'orders';

// Create new order
export const createOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...orderData,
      status: 'pending_payment',
      paymentStatus: {
        upfront: 'pending',
        remaining: 'pending'
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...orderData };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const docRef = doc(db, COLLECTION, orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

// Get user orders
export const getUserOrders = async (userId) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

// Get all orders (admin only)
export const getAllOrders = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all orders:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
  try {
    const orderRef = doc(db, COLLECTION, orderId);
    await updateDoc(orderRef, {
      status,
      ...additionalData,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Update payment status
export const updatePaymentStatus = async (orderId, paymentType, status, transactionId = null) => {
  try {
    const orderRef = doc(db, COLLECTION, orderId);
    const updateData = {
      [`paymentStatus.${paymentType}`]: status,
      updatedAt: Timestamp.now()
    };
    
    if (transactionId) {
      updateData[`${paymentType}TransactionId`] = transactionId;
      updateData[`${paymentType}PaidAt`] = Timestamp.now();
    }
    
    await updateDoc(orderRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Assign driver to order
export const assignDriverToOrder = async (orderId, driverId) => {
  try {
    const orderRef = doc(db, COLLECTION, orderId);
    await updateDoc(orderRef, {
      driverId,
      status: 'awaiting_driver',
      assignedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error assigning driver:', error);
    throw error;
  }
};

// Cancel order
export const cancelOrder = async (orderId, reason = null) => {
  try {
    const orderRef = doc(db, COLLECTION, orderId);
    await updateDoc(orderRef, {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
};

// Get orders by status
export const getOrdersByStatus = async (status) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting orders by status:', error);
    throw error;
  }
};

// Get recent orders
export const getRecentOrders = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting recent orders:', error);
    throw error;
  }
};

// Get orders by date range
export const getOrdersByDateRange = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting orders by date range:', error);
    throw error;
  }
};

// Real-time order listener
export const listenToOrder = (orderId, callback) => {
  const orderRef = doc(db, COLLECTION, orderId);
  return onSnapshot(orderRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to order:', error);
  });
};

// Get order statistics
export const getOrderStatistics = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const orders = snapshot.docs.map(doc => doc.data());
    
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const pendingOrders = orders.filter(o => o.status === 'pending_payment' || o.status === 'awaiting_driver').length;
    const totalRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    
    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders,
      totalRevenue
    };
  } catch (error) {
    console.error('Error getting order statistics:', error);
    throw error;
  }
};

// Bulk update orders status
export const bulkUpdateOrdersStatus = async (orderIds, status) => {
  const batch = writeBatch(db);
  
  orderIds.forEach(orderId => {
    const orderRef = doc(db, COLLECTION, orderId);
    batch.update(orderRef, {
      status,
      updatedAt: Timestamp.now()
    });
  });
  
  await batch.commit();
  return true;
};