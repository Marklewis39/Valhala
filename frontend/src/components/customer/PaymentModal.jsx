import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';
import { X, CreditCard, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, onSuccess, amount, orderData }) => {
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handleMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    // Simulate M-Pesa STK Push (Mock for prototype)
    setTimeout(() => {
      setPaymentStatus('success');
      setTimeout(() => {
        setIsProcessing(false);
        toast.success('Payment successful!');
        onSuccess();
      }, 1500);
    }, 2000);
  };

  const handleCardPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');
    
    // Simulate card payment (Mock for prototype)
    setTimeout(() => {
      setPaymentStatus('success');
      setTimeout(() => {
        setIsProcessing(false);
        toast.success('Payment successful!');
        onSuccess();
      }, 1500);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'mpesa') {
      handleMpesaPayment();
    } else {
      handleCardPayment();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-valhala-secondary rounded-xl max-w-md w-full">
              {/* Header */}
              <div className="border-b border-valhala-nordic p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Complete Payment</h2>
                <button onClick={onClose} className="p-2 hover:bg-valhala-primary rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                {/* Amount */}
                <div className="text-center mb-6">
                  <p className="text-gray-400 text-sm">Amount to Pay (50% Deposit)</p>
                  <p className="text-3xl font-bold text-valhala-gold">{formatCurrency(amount)}</p>
                </div>
                
                {/* Payment Status */}
                {paymentStatus === 'processing' && (
                  <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-yellow-500 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-yellow-500">Processing payment...</p>
                    <p className="text-xs text-gray-400 mt-1">Please check your phone for M-Pesa prompt</p>
                  </div>
                )}
                
                {paymentStatus === 'success' && (
                  <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-4 text-center">
                    <CheckCircle className="mx-auto mb-2 text-green-500" size={32} />
                    <p className="text-green-500 font-semibold">Payment Successful!</p>
                    <p className="text-xs text-gray-400 mt-1">Redirecting...</p>
                  </div>
                )}
                
                {!paymentStatus && (
                  <form onSubmit={handleSubmit}>
                    {/* Payment Methods */}
                    <div className="space-y-3 mb-6">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mpesa')}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          paymentMethod === 'mpesa' 
                            ? 'border-valhala-accent bg-valhala-accent/10' 
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        <Smartphone size={24} className="text-valhala-accent" />
                        <div className="text-left">
                          <p className="font-semibold">M-Pesa</p>
                          <p className="text-xs text-gray-400">Pay with M-Pesa STK Push</p>
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          paymentMethod === 'card' 
                            ? 'border-valhala-accent bg-valhala-accent/10' 
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                      >
                        <CreditCard size={24} className="text-valhala-accent" />
                        <div className="text-left">
                          <p className="font-semibold">Card Payment</p>
                          <p className="text-xs text-gray-400">Visa, Mastercard, Amex</p>
                        </div>
                      </button>
                    </div>
                    
                    {/* M-Pesa Phone Number */}
                    {paymentMethod === 'mpesa' && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          M-Pesa Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="0712345678"
                          className="input-primary"
                          required
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          You will receive an STK push on this number
                        </p>
                      </div>
                    )}
                    
                    {/* Card Payment Form (Simplified for prototype) */}
                    {paymentMethod === 'card' && (
                      <div className="space-y-3 mb-6">
                        <input
                          type="text"
                          placeholder="Card Number"
                          className="input-primary"
                          defaultValue="4242 4242 4242 4242"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" placeholder="MM/YY" className="input-primary" defaultValue="12/25" />
                          <input type="text" placeholder="CVC" className="input-primary" defaultValue="123" />
                        </div>
                        <p className="text-xs text-gray-400">Test mode: Use 4242 4242 4242 4242</p>
                      </div>
                    )}
                    
                    {/* Security Notice */}
                    <div className="flex items-start gap-2 mb-6 p-3 bg-valhala-primary rounded-lg">
                      <AlertCircle size={16} className="text-valhala-accent flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-400">
                        Your payment is secure and encrypted. You will only be charged the 50% deposit now. 
                        The remaining 50% will be paid upon delivery.
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      className="btn-primary w-full py-3"
                    >
                      Pay {formatCurrency(amount)}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;