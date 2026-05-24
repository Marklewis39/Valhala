import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../contexts/OrderContext';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Package, Eye, Clock, CheckCircle, XCircle, Truck, 
  Filter, ChevronDown, ChevronUp, Calendar, DollarSign,
  ShoppingBag, RefreshCw, AlertCircle, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MyOrdersPage = () => {
  const { orders, loading, getOrderStatusColor, getOrderStatusText, cancelOrder } = useOrders();
  const { addToCart, cartItems } = useCart();
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [reordering, setReordering] = useState(null);
  const navigate = useNavigate();

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

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setCancellingOrder(orderId);
      const success = await cancelOrder(orderId);
      setCancellingOrder(null);
      if (success) {
        toast.success('Order cancelled successfully');
      }
    }
  };

  const handleReorder = async (order) => {
    setReordering(order.id);
    
    // Add all items from the order to cart
    for (const item of order.items) {
      const product = {
        id: item.productId,
        name: item.name,
        sellingPrice: item.sellingPrice,
        category: item.category,
        imageUrl: item.imageUrl,
        stock: item.stock || 999
      };
      await addToCart(product, item.quantity);
    }
    
    setReordering(null);
    toast.success('Items added to cart!');
    navigate('/cart');
  };

  const handlePayRemaining = (order) => {
    navigate(`/tracking/${order.id}`, { state: { showPayment: true } });
  };

  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + (order.total || 0), 0),
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
    pendingOrders: orders.filter(o => o.status === 'pending_payment' || o.status === 'awaiting_driver').length
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-valhala-accent border-t-transparent"></div>
        <p className="mt-4 text-gray-400">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <p className="text-gray-400 mt-1">View and track all your orders</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-valhala-secondary rounded-xl p-4 text-center">
          <ShoppingBag className="mx-auto mb-2 text-valhala-accent" size={24} />
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          <p className="text-xs text-gray-400">Total Orders</p>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4 text-center">
          <DollarSign className="mx-auto mb-2 text-valhala-gold" size={24} />
          <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
          <p className="text-xs text-gray-400">Total Spent</p>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4 text-center">
          <CheckCircle className="mx-auto mb-2 text-green-500" size={24} />
          <p className="text-2xl font-bold">{stats.completedOrders}</p>
          <p className="text-xs text-gray-400">Completed</p>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4 text-center">
          <Clock className="mx-auto mb-2 text-yellow-500" size={24} />
          <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          <p className="text-xs text-gray-400">Pending</p>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4 text-center">
          <XCircle className="mx-auto mb-2 text-red-500" size={24} />
          <p className="text-2xl font-bold">{stats.cancelledOrders}</p>
          <p className="text-xs text-gray-400">Cancelled</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-valhala-secondary rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all' ? 'bg-valhala-accent text-white' : 'bg-valhala-primary text-gray-400 hover:text-white'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilter('pending_payment')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'pending_payment' ? 'bg-valhala-accent text-white' : 'bg-valhala-primary text-gray-400 hover:text-white'
              }`}
            >
              Pending Payment
            </button>
            <button
              onClick={() => setFilter('awaiting_driver')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'awaiting_driver' ? 'bg-valhala-accent text-white' : 'bg-valhala-primary text-gray-400 hover:text-white'
              }`}
            >
              Awaiting Driver
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
          
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
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
            </div>
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
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-valhala-secondary rounded-xl">
          <Package size={64} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-gray-400 mb-6">
            {orders.length === 0 
              ? "You haven't placed any orders yet" 
              : "No orders match your filters"}
          </p>
          {orders.length === 0 ? (
            <button onClick={() => navigate('/products')} className="btn-primary">
              Start Shopping
            </button>
          ) : (
            <button onClick={clearFilters} className="btn-primary">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-valhala-secondary rounded-xl overflow-hidden"
              >
                {/* Order Header - Click to expand */}
                <div 
                  className="p-6 cursor-pointer hover:bg-valhala-primary/50 transition-colors"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(order.status)}
                        <span className={getStatusBadgeClass(order.status)}>
                          {getOrderStatusText(order.status)}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          #{order.id?.slice(-8)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">
                        Placed on {formatDate(order.createdAt)}
                      </p>
                      
                      <div className="space-y-1">
                        {order.items.slice(0, 2).map((item, i) => (
                          <p key={i} className="text-sm">
                            <span className="font-semibold">{item.quantity}x</span> {item.name}
                          </p>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-gray-400">
                            +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Order Total */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-valhala-gold">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Paid: {formatCurrency(order.paidUpfront)}
                      </p>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <p className="text-xs text-valhala-accent">
                          Due: {formatCurrency(order.remainingDue)}
                        </p>
                      )}
                      {expandedOrder === order.id ? (
                        <ChevronUp size={20} className="text-gray-400 mt-2" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400 mt-2" />
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
                      <div className="p-6 space-y-4 bg-valhala-primary/30">
                        {/* All Items */}
                        <div>
                          <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                            <Package size={16} className="text-valhala-accent" />
                            Order Items
                          </h4>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm py-2 border-b border-valhala-nordic/50">
                                <div>
                                  <span className="font-semibold">{item.quantity}x</span> {item.name}
                                  {item.brand && <span className="text-xs text-gray-500 ml-2">({item.brand})</span>}
                                </div>
                                <div className="text-right">
                                  <div>{formatCurrency(item.sellingPrice * item.quantity)}</div>
                                  <div className="text-xs text-gray-500">{formatCurrency(item.sellingPrice)} each</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Delivery Address */}
                        {order.deliveryAddress && (
                          <div>
                            <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                              <Truck size={16} className="text-valhala-accent" />
                              Delivery Address
                            </h4>
                            <div className="bg-valhala-secondary rounded-lg p-3">
                              <p className="text-sm text-gray-300">
                                {order.deliveryAddress.street}
                              </p>
                              <p className="text-sm text-gray-400">
                                {order.deliveryAddress.city}
                              </p>
                              {order.deliveryAddress.instructions && (
                                <p className="text-xs text-gray-500 mt-2">
                                  <span className="font-semibold">Note:</span> {order.deliveryAddress.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Payment Breakdown */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                            <CreditCard size={16} className="text-valhala-accent" />
                            Payment Summary
                          </h4>
                          <div className="bg-valhala-secondary rounded-lg p-3 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Subtotal</span>
                              <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Delivery Fee</span>
                              <span>{formatCurrency(order.deliveryFee)}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t border-valhala-nordic">
                              <span>Total</span>
                              <span className="text-valhala-gold">{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2">
                              <span className="text-gray-400">Paid Upfront (50%)</span>
                              <span className="text-green-500">{formatCurrency(order.paidUpfront)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Remaining (on delivery)</span>
                              <span className={order.remainingDue > 0 ? 'text-valhala-accent' : 'text-green-500'}>
                                {formatCurrency(order.remainingDue)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Timeline */}
                        <div>
                          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                            <Clock size={16} className="text-valhala-accent" />
                            Order Timeline
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Order Placed</span>
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                            {order.paidUpfrontAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Payment Confirmed</span>
                                <span>{formatDate(order.paidUpfrontAt)}</span>
                              </div>
                            )}
                            {order.assignedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Driver Assigned</span>
                                <span>{formatDate(order.assignedAt)}</span>
                              </div>
                            )}
                            {order.pickedUpAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Order Picked Up</span>
                                <span>{formatDate(order.pickedUpAt)}</span>
                              </div>
                            )}
                            {order.deliveredAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Delivered</span>
                                <span>{formatDate(order.deliveredAt)}</span>
                              </div>
                            )}
                            {order.cancelledAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Cancelled</span>
                                <span>{formatDate(order.cancelledAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Driver Info */}
                        {order.driverName && (
                          <div className="bg-valhala-secondary rounded-lg p-3">
                            <p className="text-sm">
                              <span className="text-gray-400">Driver:</span> {order.driverName}
                            </p>
                            {order.driverPhone && (
                              <p className="text-sm mt-1">
                                <span className="text-gray-400">Contact:</span> {order.driverPhone}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => navigate(`/tracking/${order.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-valhala-primary rounded-lg hover:bg-valhala-nordic transition-colors"
                          >
                            <Eye size={18} />
                            Track Order
                          </button>
                          
                          {/* Reorder Button - Available for delivered orders */}
                          {order.status === 'delivered' && (
                            <button
                              onClick={() => handleReorder(order)}
                              disabled={reordering === order.id}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-valhala-accent/20 text-valhala-accent rounded-lg hover:bg-valhala-accent/30 transition-colors"
                            >
                              {reordering === order.id ? (
                                <div className="w-4 h-4 border-2 border-valhala-accent border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <RefreshCw size={16} />
                                  Reorder
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* Pay Remaining Button */}
                          {order.status === 'delivered' && order.paymentStatus?.remaining === 'pending' && (
                            <button
                              onClick={() => handlePayRemaining(order)}
                              className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                              <CreditCard size={16} />
                              Pay Remaining
                            </button>
                          )}
                          
                          {/* Cancel Order Button */}
                          {(order.status === 'pending_payment' || order.status === 'awaiting_driver') && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={cancellingOrder === order.id}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-400 border border-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                            >
                              {cancellingOrder === order.id ? (
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <XCircle size={16} />
                                  Cancel Order
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        
                        {/* Note for pending orders */}
                        {order.status === 'pending_payment' && (
                          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg text-xs text-yellow-500">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                            <p>Complete your payment to confirm the order and start delivery.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;