import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import SalesChart from '../../components/admin/SalesChart';
import ProfitLossCalculator from '../../components/admin/ProfitLossCalculator';
import { db, collection, getDocs, query, where, Timestamp } from '../../services/firebase';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Download, 
  Filter, BarChart3, PieChart, LineChart 
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const SalesAnalytics = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [chartType, setChartType] = useState('revenue');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);

      // Fetch products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
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
    
    return orders.filter(order => {
      const orderDate = order.createdAt?.toDate();
      return orderDate && orderDate >= startDate && order.status === 'delivered';
    });
  };

  const filteredOrders = getFilteredOrders();
  
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const categorySales = {};
  filteredOrders.forEach(order => {
    order.items?.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const category = product?.category || 'other';
      if (!categorySales[category]) {
        categorySales[category] = { revenue: 0, units: 0 };
      }
      categorySales[category].revenue += item.sellingPrice * item.quantity;
      categorySales[category].units += item.quantity;
    });
  });

  const topProducts = {};
  filteredOrders.forEach(order => {
    order.items?.forEach(item => {
      if (!topProducts[item.name]) {
        topProducts[item.name] = { units: 0, revenue: 0 };
      }
      topProducts[item.name].units += item.quantity;
      topProducts[item.name].revenue += item.sellingPrice * item.quantity;
    });
  });

  const sortedTopProducts = Object.entries(topProducts)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10);

  const exportReport = () => {
    const report = {
      period,
      dateGenerated: new Date().toISOString(),
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalProducts: products.length
      },
      categorySales,
      topProducts: sortedTopProducts,
      orders: filteredOrders.map(o => ({
        id: o.id,
        total: o.total,
        date: o.createdAt?.toDate(),
        items: o.items
      }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Sales Analytics</h1>
            <p className="text-gray-400 mt-1">Track performance, analyze trends, and monitor profits</p>
          </div>

          {/* Filters */}
          <div className="bg-valhala-secondary rounded-xl p-4 mb-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex gap-3">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-3 py-2 bg-valhala-primary border border-gray-700 rounded-lg"
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                  <option value="year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
                
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="px-3 py-2 bg-valhala-primary border border-gray-700 rounded-lg"
                >
                  <option value="revenue">Revenue</option>
                  <option value="orders">Orders</option>
                  <option value="profit">Profit</option>
                </select>
              </div>
              
              <button
                onClick={exportReport}
                className="px-4 py-2 bg-valhala-primary rounded-lg flex items-center gap-2 hover:bg-valhala-nordic transition-colors"
              >
                <Download size={18} />
                Export Report
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-valhala-secondary to-valhala-primary rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign size={24} className="text-valhala-gold" />
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-valhala-gold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{filteredOrders.length} orders</p>
            </div>
            
            <div className="bg-gradient-to-br from-valhala-secondary to-valhala-primary rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 size={24} className="text-valhala-accent" />
              </div>
              <p className="text-gray-400 text-sm">Average Order Value</p>
              <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
              <p className="text-xs text-gray-400 mt-1">Per transaction</p>
            </div>
            
            <div className="bg-gradient-to-br from-valhala-secondary to-valhala-primary rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Package size={24} className="text-blue-500" />
              </div>
              <p className="text-gray-400 text-sm">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-gray-400 mt-1">In catalog</p>
            </div>
            
            <div className="bg-gradient-to-br from-valhala-secondary to-valhala-primary rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Calendar size={24} className="text-purple-500" />
              </div>
              <p className="text-gray-400 text-sm">Period</p>
              <p className="text-2xl font-bold capitalize">{period}</p>
              <p className="text-xs text-gray-400 mt-1">Selected range</p>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="mb-8">
            <SalesChart orders={filteredOrders} period={period} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Category Performance */}
            <div className="bg-valhala-secondary rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart size={20} className="text-valhala-accent" />
                Sales by Category
              </h3>
              <div className="space-y-3">
                {Object.entries(categorySales).map(([category, data]) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{category}</span>
                      <span className="font-semibold">{formatCurrency(data.revenue)}</span>
                    </div>
                    <div className="w-full bg-valhala-primary rounded-full h-2">
                      <div 
                        className="bg-valhala-accent h-2 rounded-full"
                        style={{ width: `${(data.revenue / totalRevenue) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{data.units} units sold</p>
                  </div>
                ))}
                {Object.keys(categorySales).length === 0 && (
                  <p className="text-center text-gray-400 py-8">No sales data available</p>
                )}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-valhala-secondary rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-valhala-accent" />
                Top Selling Products
              </h3>
              <div className="space-y-4">
                {sortedTopProducts.map(([name, data], index) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-valhala-primary rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="font-semibold text-sm">{name}</p>
                        <p className="text-sm font-semibold text-valhala-gold">{formatCurrency(data.revenue)}</p>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{data.units} units sold</span>
                        <span>{((data.revenue / totalRevenue) * 100).toFixed(1)}% of revenue</span>
                      </div>
                    </div>
                  </div>
                ))}
                {sortedTopProducts.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No sales data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Profit & Loss Calculator */}
          <ProfitLossCalculator orders={filteredOrders} products={products} />
        </main>
      </div>
    </div>
  );
};

export default SalesAnalytics;