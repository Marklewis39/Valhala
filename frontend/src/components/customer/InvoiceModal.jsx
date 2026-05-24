import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import { X, Check, Truck, Clock, MapPin, Receipt } from 'lucide-react';

const InvoiceModal = ({ isOpen, onClose, onConfirm, orderSummary, cartItems, deliveryInfo }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    await onConfirm();
    setIsConfirming(false);
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
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-valhala-secondary rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-valhala-secondary border-b border-valhala-nordic p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Receipt className="text-valhala-gold" size={24} />
                  <h2 className="text-xl font-bold">Order Invoice</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-valhala-primary rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3 text-valhala-gold">Order Items</h3>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-2 border-b border-valhala-nordic">
                        <div>
                          <span className="font-semibold">{item.quantity}x</span> {item.name}
                          {item.brand && <span className="text-gray-400 text-xs ml-2">({item.brand})</span>}
                        </div>
                        <div className="text-right">
                          <div>{formatCurrency(item.sellingPrice * item.quantity)}</div>
                          <div className="text-xs text-gray-400">{formatCurrency(item.sellingPrice)} each</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Delivery Information */}
                {deliveryInfo && (
                  <div className="bg-valhala-primary rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold mb-2">Delivery Information</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Truck size={16} className="text-valhala-accent" />
                      <span className="text-gray-400">Distance:</span>
                      <span>{deliveryInfo.distance} km from {deliveryInfo.center}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-valhala-accent" />
                      <span className="text-gray-400">Est. Delivery Time:</span>
                      <span>{deliveryInfo.eta}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-valhala-accent" />
                      <span className="text-gray-400">Delivery Fee:</span>
                      <span>{formatCurrency(deliveryInfo.fee)}</span>
                    </div>
                  </div>
                )}
                
                {/* Payment Breakdown */}
                <div className="border-t border-valhala-nordic pt-4">
                  <h3 className="font-semibold mb-3">Payment Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subtotal:</span>
                      <span>{formatCurrency(orderSummary.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Delivery Fee:</span>
                      <span>{formatCurrency(orderSummary.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-valhala-nordic">
                      <span>Total Amount:</span>
                      <span className="text-valhala-gold">{formatCurrency(orderSummary.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-gray-400">Pay Now (50%):</span>
                      <span className="text-valhala-accent font-semibold">{formatCurrency(orderSummary.upfrontPayment)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Pay on Delivery (50%):</span>
                      <span>{formatCurrency(orderSummary.remainingPayment)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Terms */}
                <div className="bg-valhala-primary/50 rounded-lg p-3 text-xs text-gray-400">
                  <p>• By confirming this order, you agree to pay 50% upfront via M-Pesa</p>
                  <p>• The remaining 50% will be paid upon delivery before receiving your order</p>
                  <p>• Orders can be cancelled within 5 minutes of placement</p>
                  <p>• Delivery times are estimates and may vary based on traffic</p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-valhala-primary transition-colors">
                    Edit Order
                  </button>
                  <button 
                    onClick={handleConfirm} 
                    disabled={isConfirming}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {isConfirming ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check size={18} />
                        Confirm & Pay
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InvoiceModal;