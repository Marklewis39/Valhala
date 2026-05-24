import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Package, TrendingDown, X, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const StockAlert = ({ products, onUpdateStock }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [dismissed, setDismissed] = useState([]);
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    const low = products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0);
    const out = products.filter(p => p.stock === 0 && p.isAvailable);
    setLowStockItems(low);
    setOutOfStockItems(out);
  }, [products]);

  const handleDismiss = (productId) => {
    setDismissed([...dismissed, productId]);
  };

  const handleRestock = async (productId, currentStock) => {
    await onUpdateStock(productId, currentStock + 20);
    handleDismiss(productId);
  };

  const visibleLowStock = lowStockItems.filter(p => !dismissed.includes(p.id));
  const visibleOutOfStock = outOfStockItems.filter(p => !dismissed.includes(p.id));

  if ((visibleLowStock.length === 0 && visibleOutOfStock.length === 0) || !showAlert) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-4 mb-6"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-yellow-500" size={20} />
            <h3 className="font-semibold">Stock Alerts</h3>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Out of Stock Items */}
          {visibleOutOfStock.map(item => (
            <div key={item.id} className="bg-red-500/10 border border-red-500 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-red-500" />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-400">Out of Stock</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestock(item.id, item.stock)}
                    className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                  >
                    Restock
                  </button>
                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Low Stock Items */}
          {visibleLowStock.map(item => (
            <div key={item.id} className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <TrendingDown size={20} className="text-yellow-500" />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      Only {item.stock} left (Threshold: {item.lowStockThreshold})
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRestock(item.id, item.stock)}
                    className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg text-sm"
                  >
                    Restock
                  </button>
                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StockAlert;