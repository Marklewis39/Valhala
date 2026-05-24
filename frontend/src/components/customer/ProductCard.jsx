import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = async () => {
    if (!product.isAvailable) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    
    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} items available`);
      return;
    }

    setIsAdding(true);
    await addToCart(product, quantity);
    setIsAdding(false);
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1);
    } else {
      toast.error(`Only ${product.stock} items available`);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="card group"
    >
      <div className="relative overflow-hidden">
        {/* Product Image */}
        <div className="h-48 overflow-hidden bg-gradient-to-br from-valhala-primary to-valhala-secondary">
          <img 
            src={product.imageUrl || '/assets/images/product-placeholder.svg'} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        
        {/* Stock Badge */}
        {product.stock < 10 && product.stock > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            Only {product.stock} left
          </div>
        )}
        
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-bold px-3 py-1 bg-red-500 rounded-full">Out of Stock</span>
          </div>
        )}
        
        {/* Category Icon */}
        <div className="absolute top-2 left-2 bg-valhala-primary/80 backdrop-blur-sm rounded-full p-2">
          <img src={`/assets/icons/${product.category}.svg`} alt={product.category} className="w-5 h-5" />
        </div>
      </div>
      
      <div className="p-4">
        {/* Brand & Category */}
        <div className="flex justify-between items-start mb-2">
          {product.brand && (
            <span className="text-xs text-valhala-gold font-semibold">{product.brand}</span>
          )}
          <span className="text-xs text-gray-400 capitalize">{product.category}</span>
        </div>
        
        {/* Product Name */}
        <h3 className="font-bold text-lg mb-2 line-clamp-1">{product.name}</h3>
        
        {/* Description */}
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        {/* Details */}
        <div className="flex justify-between text-xs text-gray-500 mb-3">
          <span>{product.volume}ml</span>
          <span>{product.alcoholPercentage}% ABV</span>
        </div>
        
        {/* Price & Actions */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-2xl font-bold text-valhala-gold">
              {formatCurrency(product.sellingPrice)}
            </span>
            {product.buyPrice && (
              <span className="text-xs text-gray-500 line-through ml-2 hidden">
                {formatCurrency(product.buyPrice)}
              </span>
            )}
          </div>
          
          {product.isAvailable ? (
            <div className="flex items-center gap-2">
              {/* Quantity Selector */}
              <div className="flex items-center gap-1 bg-valhala-primary rounded-lg">
                <button
                  onClick={decrementQuantity}
                  className="p-1 hover:bg-valhala-accent rounded-lg transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  className="p-1 hover:bg-valhala-accent rounded-lg transition-colors"
                  disabled={quantity >= product.stock}
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {/* Add to Cart Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={isAdding || !product.isAvailable}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  showSuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-valhala-accent text-white hover:bg-opacity-90'
                }`}
              >
                {showSuccess ? <Check size={20} /> : <ShoppingCart size={20} />}
              </motion.button>
            </div>
          ) : (
            <button
              disabled
              className="px-3 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed text-sm"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;