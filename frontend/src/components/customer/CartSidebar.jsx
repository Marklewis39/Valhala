import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CartSidebar = () => {
  const { cartItems, isOpen, setIsOpen, getSubtotal, clearCart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const subtotal = getSubtotal();
  const deliveryFee = 150;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 z-50"
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-valhala-secondary shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-valhala-nordic">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag size={24} />
                Your Cart ({cartItems.length})
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-valhala-primary rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={64} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-valhala-primary p-3 rounded-lg">
                      <img 
                        src={item.imageUrl || '/assets/images/product-placeholder.svg'} 
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-valhala-gold font-bold">{formatCurrency(item.sellingPrice)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-2 bg-valhala-secondary rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-valhala-accent rounded-lg transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-valhala-accent rounded-lg transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(item.sellingPrice * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-valhala-nordic p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Delivery Fee</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-valhala-nordic">
                    <span>Total</span>
                    <span className="text-valhala-gold">{formatCurrency(total)}</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={clearCart}
                    className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    Checkout <ArrowRight size={18} />
                  </button>
                </div>
                
                <p className="text-xs text-center text-gray-400">
                  *Pay 50% upfront, remaining on delivery
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;