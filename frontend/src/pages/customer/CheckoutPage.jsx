import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDeliveryFee } from '../../hooks/useDeliveryFee';
import { formatCurrency, calculateOrderSummary } from '../../utils/formatters';
import { getCurrentLocation } from '../../utils/deliveryFeeCalculator';
import { createOrder } from '../../services/orders';
import CheckoutForm from '../../components/customer/CheckoutForm';
import InvoiceModal from '../../components/customer/InvoiceModal';
import PaymentModal from '../../components/customer/PaymentModal';
import { ArrowLeft, MapPin, Clock, Truck, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const { cartItems, getSubtotal, clearCart } = useCart();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [customerLocation, setCustomerLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: userData?.address || '',
    city: 'Nairobi',
    details: ''
  });

  const { deliveryInfo, loading: feeLoading } = useDeliveryFee(customerLocation);
  const subtotal = getSubtotal();
  const orderSummary = calculateOrderSummary(cartItems, deliveryInfo?.fee || 150);

  useEffect(() => {
    // Get user's location
    const getLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setCustomerLocation(location);
      } catch (error) {
        console.error('Location error:', error);
        toast.error('Please enable location to calculate delivery fee');
        // Set default location (Nairobi CBD)
        setCustomerLocation({ lat: -1.2921, lng: 36.8219 });
      } finally {
        setIsLoadingLocation(false);
      }
    };
    getLocation();
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/products');
      toast.error('Your cart is empty');
    }
  }, [cartItems, navigate]);

  const handleProceedToInvoice = () => {
    setShowInvoice(true);
  };

  const handleConfirmOrder = async (addressData) => {
    const order = {
      userId: user.uid,
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        buyPrice: item.buyPrice,
        subtotal: item.sellingPrice * item.quantity
      })),
      subtotal: orderSummary.subtotal,
      deliveryFee: orderSummary.deliveryFee,
      total: orderSummary.total,
      paidUpfront: orderSummary.upfrontPayment,
      remainingDue: orderSummary.remainingPayment,
      deliveryAddress: {
        ...addressData,
        ...customerLocation
      },
      distance: deliveryInfo?.distance,
      estimatedDeliveryTime: deliveryInfo?.eta
    };
    
    setOrderData(order);
    setShowInvoice(false);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    if (!orderData) return;
    
    try {
      const newOrder = await createOrder(orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/tracking/${newOrder.id}`);
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error('Failed to create order');
    }
  };

  if (isLoadingLocation || feeLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-valhala-accent border-t-transparent"></div>
        <p className="mt-4 text-gray-400">Calculating delivery fee...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/cart')}
        className="mb-6 text-gray-400 hover:text-white inline-flex items-center gap-2"
      >
        <ArrowLeft size={20} />
        Back to Cart
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <CheckoutForm 
            onSubmit={handleProceedToInvoice}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
            customerLocation={customerLocation}
          />
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-valhala-secondary rounded-xl p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            {/* Items */}
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatCurrency(item.sellingPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            {/* Delivery Info */}
            {deliveryInfo && (
              <div className="bg-valhala-primary rounded-lg p-3 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-valhala-accent" />
                  <span className="text-gray-400">Distance:</span>
                  <span>{deliveryInfo.distance} km</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck size={16} className="text-valhala-accent" />
                  <span className="text-gray-400">Delivery Fee:</span>
                  <span>{formatCurrency(deliveryInfo.fee)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-valhala-accent" />
                  <span className="text-gray-400">Est. Delivery:</span>
                  <span>{deliveryInfo.eta}</span>
                </div>
              </div>
            )}
            
            {/* Totals */}
            <div className="space-y-2 pt-4 border-t border-valhala-nordic">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>{formatCurrency(orderSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery Fee</span>
                <span>{formatCurrency(orderSummary.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-valhala-nordic">
                <span>Total</span>
                <span className="text-valhala-gold">{formatCurrency(orderSummary.total)}</span>
              </div>
            </div>
            
            {/* Payment Breakdown */}
            <div className="mt-4 p-3 bg-valhala-primary rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Pay Now (50%)</span>
                <span className="text-valhala-accent font-bold">{formatCurrency(orderSummary.upfrontPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pay on Delivery (50%)</span>
                <span>{formatCurrency(orderSummary.remainingPayment)}</span>
              </div>
            </div>
            
            <button
              onClick={handleProceedToInvoice}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        onConfirm={handleConfirmOrder}
        orderSummary={orderSummary}
        cartItems={cartItems}
        deliveryInfo={deliveryInfo}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        amount={orderSummary.upfrontPayment}
        orderData={orderData}
      />
    </div>
  );
};

export default CheckoutPage;