import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../contexts/OrderContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Package, Eye, Clock, CheckCircle, XCircle, Truck, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderHistory = () => {
  const { orders, loading, getOrderStatusColor, getOrderStatusText } = useOrders();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Filter orders based on status and date range
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filter !== 'all' && order.status !== filter) return false;
    
    // Date range filter
    if (dateRange.start) {
      const orderDate = order.createdAt?.toDate();
      const startDate = new Date(dateRange.start);
      if (orderDate < startDate) return false;
    }
    if (dateRange.end) {
      const orderDate = order.createdAt?.toDate();
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      if (orderDate > endDate) return false;
    }
    
    return true;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'cancelled':
        return <XCircle className="text-red-500" size={20} />;
      case 'en_route':
      case 'picked_up':
        return <Truck className="text-blue-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case 'delivered':
        return `${baseClass} bg-green-500/20 text-green-500`;
      case 'cancelled':
        return `${baseClass} bg-red-500/20 text-red-500`;
      case 'en_route':
      case 'picked_up':
        return `${baseClass} bg-blue-500/20 text-blue-500`;
      case 'awaiting_driver':
        return `${baseClass} bg-purple-500/20 text-purple-500`;
      default:
        return `${baseClass} bg-yellow-500/20 text-yellow-500`;
    }
  };

  const toggleExpand = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  const clearFilters = () => {
    setFilter('all');
    setDateRange({ start: '', end: '' });
  };

  // Statistics
  const stats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + (order.total || 0), 0),
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    cancelledOrders: orders.filter(o => o.status === 'cancelled').length
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-valhala-accent border-t-transparent"></div>
        <p className="mt-4 text-gray-400">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-valhala-secondary rounded-xl">
        <Package size={64} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
        <p className="text-gray-400 mb-6">You haven't placed any orders</p>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-valhala-secondary rounded-xl p-4 text-center">
          <Package className="mx-auto mb-2 text-valhala-accent" size={24} />
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          <p className="text-xs text-gray-400">Total Orders</p>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4 text-center">
          <Clock className="mx-auto mb-2 text-valhala-gold" size={24} />
          <p className="text-2xl font-bold">{stats.completedOrders}</p>
          <p className="text-xs text-gray-400">Completed</p>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4 text-center">
          <XCircle className="mx-auto mb-2 text-red-500" size={24} />
          <p className="text-2xl font-bold">{stats.cancelledOrders}</p>
          <p className="text-xs text-gray-400">Cancelled</p>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4 text-center">
          <Package className="mx-auto mb-2 text-green-500" size={24} />
          <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
          <p className="text-xs text-gray-400">Total Spent</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-valhala-secondary rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all' ? 'bg-valhala-accent text-white' : 'bg-valhala-primary text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending_payment')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'pending_payment' ? 'bg-valhala-accent text-white' : 'bg-valhala-primary text-gray-400 hover:text-white'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('awaiting_driver')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'awaiting_driver' ? 'bg-valhala-accent text-white' : 'bg-valhala-primary text-gray-400 hover:text-white'
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => setFilter('en_route')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'en_route' ? 'bg-valhala-accent text-white' : 'bg-valhala-primary text-gray-400 hover:text-white'
              }`}
            >
              In Transit
            </button>
            <button
              onClick={() => setFilter('delivered')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'delivered' ? 'bg-valhala-accent text-white' : 'bg-valhala-primary text-gray-400 hover:text-white'
              }`}
            >
              Delivered
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'cancelled' ? 'bg-valhala-accent text-white' : 'bg-valhala-primary text-gray-400 hover:text-white'
              }`}
            >
              Cancelled
            </button>
          </div>
          
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-2 py-1 bg-valhala-primary rounded-lg text-sm text-gray-300"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-2 py-1 bg-valhala-primary rounded-lg text-sm text-gray-300"
            />
            {(filter !== 'all' || dateRange.start || dateRange.end) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 bg-valhala-primary rounded-lg text-sm text-valhala-accent hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-valhala-secondary rounded-xl"
            >
              <Filter size={48} className="mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No orders match your filters</p>
            </motion.div>
          ) : (
            filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-valhala-secondary rounded-xl overflow-hidden"
              >
                {/* Order Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-valhala-primary/50 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">#{order.id?.slice(-8)}</span>
                          <span className={getStatusBadgeClass(order.status)}>
                            {getOrderStatusText(order.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-valhala-gold">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {expandedOrder === order.id ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-valhala-nordic overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        {/* Items */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Order Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <div>
                                  <span className="font-semibold">{item.quantity}x</span> {item.name}
                                </div>
                                <div>{formatCurrency(item.sellingPrice * item.quantity)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Delivery Address */}
                        {order.deliveryAddress && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Delivery Address</h4>
                            <p className="text-sm text-gray-400">
                              {order.deliveryAddress.street}<br />
                              {order.deliveryAddress.city}
                              {order.deliveryAddress.instructions && (
                                <span className="block text-xs mt-1">
                                  Note: {order.deliveryAddress.instructions}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        
                        {/* Payment Breakdown */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Payment Summary</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Subtotal</span>
                              <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Delivery Fee</span>
                              <span>{formatCurrency(order.deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-1 border-t border-valhala-nordic">
                              <span>Total</span>
                              <span className="text-valhala-gold">{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Paid Upfront</span>
                              <span className="text-green-500">{formatCurrency(order.paidUpfront)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Remaining</span>
                              <span className={order.remainingDue > 0 ? 'text-valhala-accent' : 'text-green-500'}>
                                {formatCurrency(order.remainingDue)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Timeline */}
                        {order.createdAt && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Order Timeline</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Order Placed</span>
                                <span>{formatDate(order.createdAt)}</span>
                              </div>
                              {order.assignedAt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Driver Assigned</span>
                                  <span>{formatDate(order.assignedAt)}</span>
                                </div>
                              )}
                              {order.deliveredAt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Delivered</span>
                                  <span>{formatDate(order.deliveredAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => navigate(`/tracking/${order.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-valhala-primary rounded-lg hover:bg-valhala-nordic transition-colors"
                          >
                            <Eye size={16} />
                            Track Order
                          </button>
                          
                          {order.status === 'delivered' && order.paymentStatus?.remaining === 'pending' && (
                            <button className="flex-1 btn-primary text-sm">
                              Pay Remaining
                            </button>
                          )}
                          
                          {(order.status === 'pending_payment' || order.status === 'awaiting_driver') && (
                            <button className="flex-1 text-red-400 border border-red-400 rounded-lg hover:bg-red-400/10 transition-colors text-sm">
                              Cancel Order
                            </button>
                          )}
                          
                          {order.status === 'delivered' && (
                            <button className="flex-1 text-valhala-accent border border-valhala-accent rounded-lg hover:bg-valhala-accent/10 transition-colors text-sm">
                              Reorder
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderHistory;