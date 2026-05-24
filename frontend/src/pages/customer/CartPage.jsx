import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import CartItem from '../../components/customer/CartItem';
import { formatCurrency } from '../../utils/formatters';
import { 
  ShoppingCart, Trash2, ArrowRight, ArrowLeft, 
  Tag, Clock, Truck, AlertCircle, CreditCard,
  Shield, Gift, X, Save, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { 
    cartItems, 
    getSubtotal, 
    clearCart, 
    updateQuantity, 
    removeFromCart,
    savedItems,
    saveForLater,
    moveToCart
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [showSavedItems, setShowSavedItems] = useState(false);
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);

  const subtotal = getSubtotal();
  const deliveryFee = subtotal > 5000 ? 0 : 150; // Free delivery on orders over 5000
  const promoDiscountAmount = (subtotal * promoDiscount) / 100;
  const total = subtotal + deliveryFee - promoDiscountAmount;
  const upfrontPayment = total * 0.5;
  const remainingPayment = total - upfrontPayment;

  // Check if cart qualifies for free delivery
  const qualifiesForFreeDelivery = subtotal > 5000;
  
  // Check if cart qualifies for any offers
  const qualifiesForOffer = subtotal > 3000;
  const offerMessage = qualifiesForOffer ? "You qualify for free delivery!" : `Add ${formatCurrency(5000 - subtotal)} more for free delivery`;

  // Get delivery estimate based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) {
      setDeliveryEstimate("45-60 minutes (late night delivery)");
    } else if (hour >= 18 && hour < 22) {
      setDeliveryEstimate("35-50 minutes (peak hours)");
    } else {
      setDeliveryEstimate("25-35 minutes");
    }
  }, []);

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    
    setApplyingPromo(true);
    
    // Simulate promo code validation
    setTimeout(() => {
      const validPromos = {
        'WELCOME10': 10,
        'VALHALA20': 20,
        'FREEDEL': 0
      };
      
      if (validPromos[promoCode.toUpperCase()]) {
        const discount = validPromos[promoCode.toUpperCase()];
        if (discount > 0) {
          setPromoDiscount(discount);
          toast.success(`${discount}% discount applied!`);
        } else {
          toast.success('Free delivery applied!');
          // Handle free delivery promo separately
        }
        setShowPromoInput(false);
      } else {
        toast.error('Invalid promo code');
      }
      setApplyingPromo(false);
    }, 1000);
  };

  const removePromo = () => {
    setPromoDiscount(0);
    setPromoCode('');
    toast.success('Promo code removed');
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Check if any item is out of stock
    const outOfStockItems = cartItems.filter(item => !item.isAvailable || item.stock < item.quantity);
    if (outOfStockItems.length > 0) {
      toast.error(`${outOfStockItems[0].name} is out of stock. Please remove it to continue.`);
      return;
    }
    
    navigate('/checkout');
  };

  if (cartItems.length === 0 && (!savedItems || savedItems.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ShoppingCart size={80} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-6">Looks like you haven't added any items yet</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              Browse Products <ArrowRight size={20} />
            </Link>
            {user && (
              <Link to="/my-orders" className="btn-secondary inline-flex items-center gap-2">
                View Your Orders
              </Link>
            )}
          </div>
          
          {/* Recommended Products */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4">You might also like</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-valhala-secondary rounded-lg p-3 text-center">
                  <div className="w-full h-24 bg-valhala-primary rounded-lg mb-2 animate-pulse"></div>
                  <div className="h-4 bg-valhala-primary rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 bg-valhala-primary rounded w-1/2 mx-auto animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          {cartItems.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-red-400 hover:text-red-300 inline-flex items-center gap-2 transition-colors"
            >
              <Trash2 size={18} />
              Clear All
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-valhala-secondary rounded-xl overflow-hidden">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-valhala-primary border-b border-valhala-nordic text-gray-400 text-sm">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              
              {/* Items */}
              <AnimatePresence>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <CartItem 
                      item={item} 
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                      onSaveForLater={saveForLater}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between mt-4">
              <button 
                onClick={() => navigate('/products')}
                className="text-gray-400 hover:text-white inline-flex items-center gap-2 transition-colors"
              >
                <ArrowLeft size={20} />
                Continue Shopping
              </button>
              
              {savedItems && savedItems.length > 0 && (
                <button 
                  onClick={() => setShowSavedItems(!showSavedItems)}
                  className="text-valhala-accent hover:text-valhala-gold inline-flex items-center gap-2 transition-colors"
                >
                  <Heart size={18} />
                  Saved Items ({savedItems.length})
                </button>
              )}
            </div>
            
            {/* Saved Items Section */}
            {showSavedItems && savedItems && savedItems.length > 0 && (
              <div className="mt-6 bg-valhala-secondary rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Save size={18} className="text-valhala-accent" />
                    Saved for Later
                  </h3>
                  <button onClick={() => setShowSavedItems(false)}>
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>
                <div className="space-y-3">
                  {savedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-valhala-primary rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.imageUrl || '/assets/images/product-placeholder.svg'} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-valhala-gold text-sm">{formatCurrency(item.sellingPrice)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => moveToCart(item.id)}
                        className="px-3 py-1 bg-valhala-accent text-white rounded-lg text-sm hover:bg-opacity-90 transition-colors"
                      >
                        Move to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-valhala-secondary rounded-xl p-6 sticky top-24 space-y-4">
              <h2 className="text-xl font-bold">Order Summary</h2>
              
              {/* Delivery Estimate */}
              {deliveryEstimate && (
                <div className="flex items-center gap-2 text-sm text-gray-400 p-2 bg-valhala-primary rounded-lg">
                  <Clock size={16} className="text-valhala-accent" />
                  <span>Est. delivery: {deliveryEstimate}</span>
                </div>
              )}
              
              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Delivery Fee</span>
                  <div className="text-right">
                    {qualifiesForFreeDelivery ? (
                      <span className="text-green-500 flex items-center gap-1">
                        Free <Tag size={12} />
                      </span>
                    ) : (
                      <span>{formatCurrency(deliveryFee)}</span>
                    )}
                  </div>
                </div>
                
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Discount ({promoDiscount}% off)</span>
                    <span>-{formatCurrency(promoDiscountAmount)}</span>
                  </div>
                )}
                
                <div className="border-t border-valhala-nordic pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-valhala-gold">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Breakdown */}
              <div className="bg-valhala-primary rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Pay Now (50%)</span>
                  <span className="text-valhala-accent font-semibold">{formatCurrency(upfrontPayment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Pay on Delivery (50%)</span>
                  <span>{formatCurrency(remainingPayment)}</span>
                </div>
              </div>
              
              {/* Promo Code Section */}
              {!showPromoInput ? (
                <button
                  onClick={() => setShowPromoInput(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-600 rounded-lg text-sm text-gray-400 hover:text-valhala-accent hover:border-valhala-accent transition-colors"
                >
                  <Tag size={16} />
                  Add Promo Code
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-3 py-2 bg-valhala-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-valhala-accent text-sm"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={applyingPromo}
                    className="px-3 py-2 bg-valhala-accent text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                  >
                    {applyingPromo ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Apply'
                    )}
                  </button>
                  <button
                    onClick={() => setShowPromoInput(false)}
                    className="px-3 py-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              {/* Applied Promo Display */}
              {promoDiscount > 0 && (
                <div className="flex items-center justify-between bg-green-500/10 rounded-lg p-2 text-sm">
                  <span className="text-green-500 flex items-center gap-1">
                    <Tag size={14} />
                    {promoDiscount}% OFF applied
                  </span>
                  <button onClick={removePromo} className="text-gray-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              )}
              
              {/* Free Delivery Offer */}
              {!qualifiesForFreeDelivery && subtotal > 0 && (
                <div className="flex items-start gap-2 p-3 bg-valhala-accent/10 rounded-lg">
                  <Truck size={16} className="text-valhala-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400">{offerMessage}</p>
                </div>
              )}
              
              {/* Secure Payment Note */}
              <div className="flex items-start gap-2 p-3 bg-valhala-primary rounded-lg">
                <Shield size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Secure payment encrypted. You only pay 50% now. The remaining 50% is paid upon delivery before receiving your order.
                </p>
              </div>
              
              {/* Checkout Button */}
              <button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard size={18} />
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              
              {/* Continue Shopping Link */}
              <p className="text-center text-xs text-gray-500">
                By placing an order, you agree to our 
                <Link to="/terms" className="text-valhala-accent hover:underline ml-1">Terms of Service</Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CartPage;