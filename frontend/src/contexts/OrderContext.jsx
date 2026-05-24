import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  db, collection, query, where, orderBy, onSnapshot, 
  updateDoc, doc, getDoc, Timestamp
} from '../services/firebase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const OrderContext = createContext();

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  // Fetch user's orders in real-time
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setRecentOrders(ordersData.slice(0, 5));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Get single order by ID
  const getOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const order = { id: orderSnap.id, ...orderSnap.data() };
        setCurrentOrder(order);
        return order;
      }
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      toast.error('Failed to load order');
      return null;
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      toast.success('Order cancelled successfully');
      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
      return false;
    }
  };

  // Track order in real-time
  const trackOrder = (orderId, callback) => {
    const orderRef = doc(db, 'orders', orderId);
    return onSnapshot(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      }
    });
  };

  // Get order status badge color
  const getOrderStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-500',
      awaiting_driver: 'bg-blue-500',
      picked_up: 'bg-purple-500',
      en_route: 'bg-orange-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // Get order status text
  const getOrderStatusText = (status) => {
    const texts = {
      pending_payment: 'Pending Payment',
      awaiting_driver: 'Awaiting Driver',
      picked_up: 'Picked Up',
      en_route: 'En Route',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  const value = {
    orders,
    currentOrder,
    recentOrders,
    loading,
    getOrder,
    cancelOrder,
    trackOrder,
    getOrderStatusColor,
    getOrderStatusText
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};