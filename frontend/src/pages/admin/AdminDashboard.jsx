import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import StatsCard from '../../components/admin/StatsCard';
import SalesChart from '../../components/admin/SalesChart';
import StockAlert from '../../components/admin/StockAlert';
import ManageAdmins from '../../components/admin/ManageAdmins';
import { 
  DollarSign, ShoppingBag, Users, Truck, Package, 
  TrendingUp, Clock, AlertCircle, Eye, ArrowRight, ShieldCheck
} from 'lucide-react';
import { db, collection, getDocs, query, orderBy, limit, where, Timestamp } from '../../services/firebase';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalAdmins: 0,
    activeDrivers: 0,
    pendingIssues: 0,
    lowStockItems: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
      
      // Calculate revenue
      const deliveredOrders = ordersData.filter(o => o.status === 'delivered');
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      // Fetch customers
      const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'customer')));
      const totalCustomers = usersSnapshot.size;
      
      // Fetch admins
      const adminsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      const adminsData = adminsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(adminsData);
      const totalAdmins = adminsData.length;
      
      // Fetch drivers
      const driversSnapshot = await getDocs(collection(db, 'drivers'));
      const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const activeDrivers = drivers.filter(d => d.isActive && d.isAvailable).length;
      
      // Fetch issues
      const issuesSnapshot = await getDocs(query(collection(db, 'issues'), where('status', '==', 'open')));
      const pendingIssues = issuesSnapshot.size;
      
      // Fetch products for stock alerts
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      const lowStockItems = productsData.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length;
      
      // Get recent orders
      const recentOrdersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
      const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
      const recentOrdersData = recentOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentOrders(recentOrdersData);
      
      // Get recent issues
      const recentIssuesQuery = query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(5));
      const recentIssuesSnapshot = await getDocs(recentIssuesQuery);
      const recentIssuesData = recentIssuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentIssues(recentIssuesData);
      
      setStats({
        totalRevenue,
        totalOrders: ordersData.length,
        totalCustomers,
        totalAdmins,
        activeDrivers,
        pendingIssues,
        lowStockItems
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-500/20 text-yellow-500',
      awaiting_driver: 'bg-purple-500/20 text-purple-500',
      en_route: 'bg-blue-500/20 text-blue-500',
      delivered: 'bg-green-500/20 text-green-500',
      cancelled: 'bg-red-500/20 text-red-500'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-valhala-dark">
        <AdminSidebar />
        <div className="flex-1 ml-64">
          <AdminHeader />
          <div className="p-6 flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-valhala-accent border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-valhala-dark">
      <AdminSidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <AdminHeader />
        
        <main className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Welcome back, {userData?.name || 'Admin'}!</h1>
            <p className="text-gray-400 mt-1">Here's what's happening with your store today.</p>
          </div>

          {/* Stock Alerts */}
          <StockAlert products={products} />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(stats.totalRevenue)}
              icon={DollarSign}
              change={12}
              color="valhala-gold"
            />
            <StatsCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingBag}
              change={8}
              color="valhala-accent"
            />
            <StatsCard
              title="Customers"
              value={stats.totalCustomers}
              icon={Users}
              change={15}
              color="blue-500"
            />
            <StatsCard
              title="Admins"
              value={stats.totalAdmins}
              icon={ShieldCheck}
              change={0}
              color="purple-500"
            />
            <StatsCard
              title="Active Drivers"
              value={stats.activeDrivers}
              icon={Truck}
              change={-2}
              color="green-500"
            />
            <StatsCard
              title="Pending Issues"
              value={stats.pendingIssues}
              icon={AlertCircle}
              color="red-500"
            />
            <StatsCard
              title="Low Stock Items"
              value={stats.lowStockItems}
              icon={Package}
              color="yellow-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Chart */}
            <SalesChart orders={orders} period="week" />
            
            {/* Recent Orders */}
            <div className="bg-valhala-secondary rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
                <Link to="/admin/orders" className="text-valhala-accent hover:text-valhala-gold text-sm flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {recentOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-center p-3 bg-valhala-primary rounded-lg cursor-pointer hover:bg-valhala-nordic transition-colors"
                    onClick={() => navigate(`/admin/orders`)}
                  >
                    <div>
                      <p className="font-mono text-sm">#{order.id?.slice(-8)}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-valhala-gold">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No orders yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Issues */}
            <div className="bg-valhala-secondary rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Issues</h3>
                <Link to="/admin/issues" className="text-valhala-accent hover:text-valhala-gold text-sm flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {recentIssues.map((issue, index) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex justify-between items-center p-3 bg-valhala-primary rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-semibold capitalize">{issue.type?.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{issue.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      issue.status === 'open' ? 'bg-red-500/20 text-red-500' :
                      issue.status === 'in_review' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-green-500/20 text-green-500'
                    }`}>
                      {issue.status}
                    </span>
                  </motion.div>
                ))}
                {recentIssues.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No issues reported</p>
                )}
              </div>
            </div>

            {/* Manage Admins Section */}
            <div className="bg-valhala-secondary rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Admin Management</h3>
                <Link to="/admin/settings" className="text-valhala-accent hover:text-valhala-gold text-sm flex items-center gap-1">
                  Manage All <ArrowRight size={14} />
                </Link>
              </div>
              <ManageAdmins admins={admins} onAdminAdded={fetchDashboardData} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-valhala-secondary rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/admin/inventory')}
                className="p-4 bg-valhala-primary rounded-lg text-center hover:bg-valhala-nordic transition-colors group"
              >
                <Package size={24} className="mx-auto mb-2 text-valhala-accent group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold">Add Product</p>
                <p className="text-xs text-gray-400">Add new items to inventory</p>
              </button>
              <button
                onClick={() => navigate('/admin/drivers')}
                className="p-4 bg-valhala-primary rounded-lg text-center hover:bg-valhala-nordic transition-colors group"
              >
                <Truck size={24} className="mx-auto mb-2 text-valhala-accent group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold">Add Driver</p>
                <p className="text-xs text-gray-400">Register new delivery rider</p>
              </button>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="p-4 bg-valhala-primary rounded-lg text-center hover:bg-valhala-nordic transition-colors group"
              >
                <TrendingUp size={24} className="mx-auto mb-2 text-valhala-accent group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold">View Reports</p>
                <p className="text-xs text-gray-400">Sales and profit analysis</p>
              </button>
              <button
                onClick={() => navigate('/admin/issues')}
                className="p-4 bg-valhala-primary rounded-lg text-center hover:bg-valhala-nordic transition-colors group"
              >
                <AlertCircle size={24} className="mx-auto mb-2 text-valhala-accent group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold">View Issues</p>
                <p className="text-xs text-gray-400">Customer support tickets</p>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;