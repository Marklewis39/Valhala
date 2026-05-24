import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import OrdersTable from '../../components/admin/OrdersTable';
import { db, collection, getDocs, doc, updateDoc, Timestamp } from '../../services/firebase';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Eye, X, Truck, CheckCircle, Clock, MapPin, Package, User, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
  }, []);

  const fetchOrders = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'drivers'));
      const driversData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrivers(driversData.filter(d => d.isActive));
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status, additionalData = {}) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        ...additionalData,
        updatedAt: Timestamp.now()
      });
      await fetchOrders();
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const handleAssignDriver = async (orderId, driverId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        driverId,
        status: 'awaiting_driver',
        assignedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchOrders();
      toast.success('Driver assigned successfully');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { id: 'pending_payment', label: 'Pending Payment', icon: Clock },
      { id: 'awaiting_driver', label: 'Awaiting Driver', icon: Truck },
      { id: 'picked_up', label: 'Picked Up', icon: Package },
      { id: 'en_route', label: 'En Route', icon: Truck },
      { id: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];
    
    const currentIndex = steps.findIndex(s => s.id === currentStatus);
    return steps.map((step, index) => ({
      ...step,
      status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending'
    }));
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
            <h1 className="text-2xl font-bold">Orders Management</h1>
            <p className="text-gray-400 mt-1">View and manage all customer orders</p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-valhala-secondary rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
            <div className="bg-valhala-secondary rounded-xl p-4">
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">
                {orders.filter(o => o.status === 'pending_payment' || o.status === 'awaiting_driver').length}
              </p>
            </div>
            <div className="bg-valhala-secondary rounded-xl p-4">
              <p className="text-gray-400 text-sm">In Transit</p>
              <p className="text-2xl font-bold text-blue-500">
                {orders.filter(o => o.status === 'en_route' || o.status === 'picked_up').length}
              </p>
            </div>
            <div className="bg-valhala-secondary rounded-xl p-4">
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-500">
                {orders.filter(o => o.status === 'delivered').length}
              </p>
            </div>
          </div>

          {/* Orders Table */}
          <OrdersTable
            orders={orders}
            onViewDetails={(order) => {
              setSelectedOrder(order);
              setShowDetailsModal(true);
            }}
          />

          {/* Order Details Modal */}
          <AnimatePresence>
            {showDetailsModal && selectedOrder && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDetailsModal(false)}
                  className="fixed inset-0 bg-black/80 z-50"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                  <div className="bg-valhala-secondary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-valhala-secondary border-b border-valhala-nordic p-4 flex justify-between items-center">
                      <h2 className="text-xl font-bold">Order Details</h2>
                      <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-valhala-primary rounded-lg">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Order Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Order ID</p>
                          <p className="font-mono font-semibold">#{selectedOrder.id?.slice(-8)}</p>
                        </div>
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Date Placed</p>
                          <p className="font-semibold">{formatDate(selectedOrder.createdAt)}</p>
                        </div>
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Total Amount</p>
                          <p className="text-2xl font-bold text-valhala-gold">{formatCurrency(selectedOrder.total)}</p>
                        </div>
                      </div>

                      {/* Order Status Timeline */}
                      <div>
                        <h3 className="font-semibold mb-4">Order Status</h3>
                        <div className="relative">
                          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-700">
                            <div className="h-full bg-valhala-accent transition-all duration-500" 
                                 style={{ width: `${(getStatusSteps(selectedOrder.status).findIndex(s => s.id === selectedOrder.status) / 4) * 100}%` }} />
                          </div>
                          <div className="relative flex justify-between">
                            {getStatusSteps(selectedOrder.status).map((step, index) => {
                              const Icon = step.icon;
                              return (
                                <div key={step.id} className="text-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                                    step.status === 'completed' ? 'bg-green-500' :
                                    step.status === 'current' ? 'bg-valhala-accent ring-4 ring-valhala-accent/30' :
                                    'bg-gray-700'
                                  }`}>
                                    <Icon size={20} className="text-white" />
                                  </div>
                                  <p className={`text-xs ${step.status === 'current' ? 'text-valhala-accent font-semibold' : 'text-gray-400'}`}>
                                    {step.label}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <User size={18} className="text-valhala-accent" />
                            Customer Information
                          </h3>
                          <p><span className="text-gray-400">Name:</span> {selectedOrder.userName || 'N/A'}</p>
                          <p><span className="text-gray-400">Email:</span> {selectedOrder.userEmail || 'N/A'}</p>
                          <p><span className="text-gray-400">Phone:</span> {selectedOrder.userPhone || 'N/A'}</p>
                        </div>
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <MapPin size={18} className="text-valhala-accent" />
                            Delivery Address
                          </h3>
                          <p>{selectedOrder.deliveryAddress?.street}</p>
                          <p>{selectedOrder.deliveryAddress?.city}</p>
                          {selectedOrder.deliveryAddress?.instructions && (
                            <p className="text-sm text-gray-400 mt-1">
                              Note: {selectedOrder.deliveryAddress.instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-valhala-primary rounded-lg p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Package size={18} className="text-valhala-accent" />
                          Order Items
                        </h3>
                        <div className="space-y-2">
                          {selectedOrder.items?.map((item, index) => (
                            <div key={index} className="flex justify-between py-2 border-b border-valhala-nordic last:border-0">
                              <div>
                                <span className="font-semibold">{item.quantity}x</span> {item.name}
                              </div>
                              <div>{formatCurrency(item.sellingPrice * item.quantity)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="bg-valhala-primary rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Payment Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Subtotal</span>
                            <span>{formatCurrency(selectedOrder.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Delivery Fee</span>
                            <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                          </div>
                          <div className="flex justify-between font-bold pt-2 border-t border-valhala-nordic">
                            <span>Total</span>
                            <span className="text-valhala-gold">{formatCurrency(selectedOrder.total)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Paid Upfront</span>
                            <span className="text-green-500">{formatCurrency(selectedOrder.paidUpfront)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Remaining</span>
                            <span>{formatCurrency(selectedOrder.remainingDue)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4">
                        {selectedOrder.status === 'pending_payment' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'awaiting_driver')}
                            className="flex-1 bg-green-500/20 text-green-500 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            Confirm Payment
                          </button>
                        )}
                        
                        {selectedOrder.status === 'awaiting_driver' && (
                          <select
                            onChange={(e) => handleAssignDriver(selectedOrder.id, e.target.value)}
                            className="flex-1 px-4 py-2 bg-valhala-primary border border-gray-700 rounded-lg"
                            defaultValue=""
                          >
                            <option value="" disabled>Assign Driver</option>
                            {drivers.map(driver => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name} - {driver.vehicleNumber}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {selectedOrder.status === 'picked_up' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'en_route')}
                            className="flex-1 bg-blue-500/20 text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            Mark as En Route
                          </button>
                        )}
                        
                        {selectedOrder.status === 'en_route' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered', { deliveredAt: Timestamp.now() })}
                            className="flex-1 bg-green-500/20 text-green-500 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            Mark as Delivered
                          </button>
                        )}
                        
                        {(selectedOrder.status === 'pending_payment' || selectedOrder.status === 'awaiting_driver') && (
                          <button
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled')}
                            className="flex-1 bg-red-500/20 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default OrdersManagement;