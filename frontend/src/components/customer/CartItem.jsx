import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Trash2, Plus, Minus } from 'lucide-react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const total = item.sellingPrice * item.quantity;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b border-valhala-nordic items-center">
      {/* Product Info */}
      <div className="md:col-span-6 flex items-center gap-4">
        <img 
          src={item.imageUrl || '/assets/images/product-placeholder.svg'} 
          alt={item.name}
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div>
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-sm text-gray-400 capitalize">{item.category}</p>
          {item.brand && <p className="text-xs text-valhala-gold">{item.brand}</p>}
        </div>
      </div>
      
      {/* Price */}
      <div className="md:col-span-2 text-center">
        <span className="md:hidden text-gray-400 text-sm mr-2">Price:</span>
        <span className="font-semibold">{formatCurrency(item.sellingPrice)}</span>
      </div>
      
      {/* Quantity */}
      <div className="md:col-span-2">
        <div className="flex items-center justify-center gap-2">
          <span className="md:hidden text-gray-400 text-sm mr-2">Qty:</span>
          <div className="flex items-center gap-2 bg-valhala-primary rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="p-1 hover:bg-valhala-accent rounded-lg transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center font-semibold">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="p-1 hover:bg-valhala-accent rounded-lg transition-colors"
              disabled={item.quantity >= item.stock}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Total */}
      <div className="md:col-span-1 text-center">
        <span className="md:hidden text-gray-400 text-sm mr-2">Total:</span>
        <span className="font-bold text-valhala-gold">{formatCurrency(total)}</span>
      </div>
      
      {/* Remove Button */}
      <div className="md:col-span-1 text-right">
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;