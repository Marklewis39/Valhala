import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, signOut, collection, query, where, getDocs, onSnapshot } from '../../services/firebase';
import DriverLocationTracker from '../../components/driver/DriverLocationTracker';
import { LogOut, Package, CheckCircle, Clock, DollarSign, Star, MapPin, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DriverDashboard = () => {
  const [driver, setDriver] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    weeklyEarnings: 0,
    rating: 5.0,
    completionRate: 100
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get current driver info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setDriver(user);
        
        // Fetch driver profile from Firestore
        const driversRef = collection(db, 'drivers');
        const q = query(driversRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const driverData = querySnapshot.docs[0].data();
          setDriverProfile({ id: querySnapshot.docs[0].id, ...driverData });
        }
        setLoading(false);
      } else {
        navigate('/driver/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch assigned orders
  useEffect(() => {
    if (!driverProfile?.id) return;

    // Current active order
    const ordersRef = collection(db, 'orders');
    const currentQuery = query(
      ordersRef, 
      where('driverId', '==', driverProfile.id),
      where('status', 'in', ['awaiting_driver', 'picked_up', 'en_route'])
    );
    
    const unsubscribeCurrent = onSnapshot(currentQuery, (snapshot) => {
      if (!snapshot.empty) {
        const order = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setCurrentOrder(order);
      } else {
        setCurrentOrder(null);
      }
    });

    // Completed orders
    const completedQuery = query(
      ordersRef,
      where('driverId', '==', driverProfile.id),
      where('status', '==', 'delivered')
    );
    
    const unsubscribeCompleted = onSnapshot(completedQuery, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompletedOrders(orders);
      setStats(prev => ({
        ...prev,
        todayDeliveries: orders.filter(o => {
          const today = new Date().toDateString();
          return o.deliveredAt?.toDate().toDateString() === today;
        }).length
      }));
    });

    return () => {
      unsubscribeCurrent();
      unsubscribeCompleted();
    };
  }, [driverProfile]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/driver/login');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    // This would update the order status in Firestore
    toast.success(`Order status updated to ${newStatus}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-valhala-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-valhala-primary to-valhala-nordic text-white sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-valhala-accent rounded-full flex items-center justify-center">
                <Package size={20} />
              </div>
              <div>
                <h1 className="font-bold text-lg">Valhala Driver</h1>
                <p className="text-xs text-gray-300">Welcome back, {driverProfile?.name || driver?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Today's Deliveries</p>
                <p className="text-2xl font-bold text-valhala-primary">{stats.todayDeliveries}</p>
              </div>
              <CheckCircle className="text-green-500" size={28} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Weekly Earnings</p>
                <p className="text-2xl font-bold text-green-600">KSh {stats.weeklyEarnings}</p>
              </div>
              <DollarSign className="text-yellow-500" size={28} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Rating</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.rating}</p>
              </div>
              <Star className="text-yellow-500 fill-current" size={28} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-blue-500">{stats.completionRate}%</p>
              </div>
              <Clock className="text-blue-500" size={28} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Tracker */}
          <div>
            <DriverLocationTracker 
              orderId={currentOrder?.id}
              orderDetails={currentOrder}
              onLocationUpdate={(loc) => console.log('Location updated:', loc)}
              onTrackingStatusChange={(isActive) => console.log('Tracking active:', isActive)}
            />
          </div>

          {/* Current Order */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-valhala-primary p-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Package size={20} />
                Current Delivery
              </h3>
            </div>
            
            <div className="p-4">
              {currentOrder ? (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-mono font-semibold">#{currentOrder.id?.slice(-8)}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <p className="text-sm">{currentOrder.deliveryAddress?.street}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Items</p>
                    <div className="space-y-1 mt-1">
                      {currentOrder.items?.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleOrderStatusUpdate(currentOrder.id, 'picked_up')}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                    >
                      Mark as Picked Up
                    </button>
                    <button
                      onClick={() => handleOrderStatusUpdate(currentOrder.id, 'delivered')}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                    >
                      Complete Delivery
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No active deliveries</p>
                  <p className="text-sm text-gray-400">Wait for new orders</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-valhala-primary p-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Clock size={20} />
              Recent Deliveries
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {completedOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">#{order.id?.slice(-8)}</td>
                    <td className="px-4 py-3 text-sm">{order.items?.length} items</td>
                    <td className="px-4 py-3 text-sm font-medium">KSh {order.total}</td>
                    <td className="px-4 py-3 text-sm text-green-600">
                      {order.deliveredAt?.toDate().toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {completedOrders.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No completed deliveries yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;