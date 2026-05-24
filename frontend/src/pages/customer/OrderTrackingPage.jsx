import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../../contexts/OrderContext';
import { useRealtimeLocation } from '../../hooks/useRealtimeLocation';
import DeliveryMap from '../../components/customer/DeliveryMap';
import OrderTracker from '../../components/customer/OrderTracker';
import IssueReportForm from '../../components/customer/IssueReportForm';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ArrowLeft, CheckCircle, Package, Truck, MapPin, Clock, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getOrder, getOrderStatusColor, getOrderStatusText } = useOrders();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const { location: driverLocation } = useRealtimeLocation(order?.driverId);

  useEffect(() => {
    const fetchOrder = async () => {
      const orderData = await getOrder(orderId);
      setOrder(orderData);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  const handleRemainingPayment = () => {
    // Simulate remaining payment on delivery
    toast.success('Payment completed!');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-valhala-accent border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Order not found</p>
        <button onClick={() => navigate('/my-orders')} className="btn-primary mt-4">
          View My Orders
        </button>
      </div>
    );
  }

  const isDelivered = order.status === 'delivered';
  const isEnRoute = order.status === 'en_route' || order.status === 'picked_up';
  const canPayRemaining = isDelivered && order.paymentStatus?.remaining === 'pending';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <button
        onClick={() => navigate('/my-orders')}
        className="mb-6 text-gray-400 hover:text-white inline-flex items-center gap-2"
      >
        <ArrowLeft size={20} />
        Back to Orders
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Tracker */}
          <div className="bg-valhala-secondary rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Order Status</h2>
            <OrderTracker currentStatus={order.status} />
            
            {/* Status Message */}
            <div className="mt-4 p-3 bg-valhala-primary rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getOrderStatusColor(order.status)} animate-pulse`}></div>
                <span className="font-semibold">Status: {getOrderStatusText(order.status)}</span>
              </div>
              {order.estimatedDeliveryTime && (
                <p className="text-sm text-gray-400 mt-2">
                  Estimated delivery: {order.estimatedDeliveryTime}
                </p>
              )}
            </div>
          </div>

          {/* Delivery Map */}
          {isEnRoute && order.driverId && (
            <div className="bg-valhala-secondary rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Live Tracking</h2>
              <DeliveryMap 
                driverLocation={driverLocation}
                customerLocation={order.deliveryAddress}
                orderId={orderId}
              />
            </div>
          )}

          {/* Order Details */}
          <div className="bg-valhala-secondary rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            
            {/* Items */}
            <div className="space-y-3 mb-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-valhala-nordic">
                  <div>
                    <span className="font-semibold">{item.quantity}x</span> {item.name}
                  </div>
                  <div>{formatCurrency(item.sellingPrice * item.quantity)}</div>
                </div>
              ))}
            </div>
            
            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-valhala-nordic">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Delivery Fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-valhala-gold">{formatCurrency(order.total)}</span>
              </div>
            </div>
            
            {/* Payment Breakdown */}
            <div className="mt-4 p-3 bg-valhala-primary rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Paid Upfront (50%)</span>
                <span className="text-green-500">{formatCurrency(order.paidUpfront)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Remaining (Pay on Delivery)</span>
                <span className={canPayRemaining ? 'text-valhala-accent' : 'text-gray-400'}>
                  {formatCurrency(order.remainingDue)}
                </span>
              </div>
            </div>
            
            {/* Pay Remaining Button */}
            {canPayRemaining && (
              <button
                onClick={handleRemainingPayment}
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Pay Remaining {formatCurrency(order.remainingDue)}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Delivery Address */}
          <div className="bg-valhala-secondary rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-valhala-accent" />
              Delivery Address
            </h3>
            <p className="text-gray-300">{order.deliveryAddress?.street}</p>
            <p className="text-gray-400 text-sm mt-1">{order.deliveryAddress?.city}</p>
            {order.deliveryAddress?.instructions && (
              <p className="text-sm text-gray-400 mt-2">
                <span className="font-semibold">Instructions:</span> {order.deliveryAddress.instructions}
              </p>
            )}
          </div>

          {/* Order Info */}
          <div className="bg-valhala-secondary rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package size={18} className="text-valhala-accent" />
              Order Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="font-mono text-xs">{order.id?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Placed on:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              {order.driverId && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Driver assigned:</span>
                  <span>Yes</span>
                </div>
              )}
            </div>
          </div>

          {/* Report Issue Button */}
          {!isDelivered && order.status !== 'cancelled' && (
            <button
              onClick={() => setShowIssueForm(true)}
              className="w-full py-2 border border-yellow-500 text-yellow-500 rounded-lg hover:bg-yellow-500/10 transition-colors"
            >
              Report an Issue
            </button>
          )}
        </div>
      </div>

      {/* Issue Report Modal */}
      <IssueReportForm
        isOpen={showIssueForm}
        onClose={() => setShowIssueForm(false)}
        orderId={orderId}
      />
    </div>
  );
};

export default OrderTrackingPage;