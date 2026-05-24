import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('valhala_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('valhala_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      if (existing) {
        // Check stock limit
        if (existing.quantity + quantity > product.stock) {
          toast.error(`Only ${product.stock} ${product.name} available`);
          return prev;
        }
        
        toast.success(`Added ${quantity} more ${product.name} to cart`);
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        if (quantity > product.stock) {
          toast.error(`Only ${product.stock} ${product.name} available`);
          return prev;
        }
        
        toast.success(`${product.name} added to cart`);
        return [...prev, { ...product, quantity }];
      }
    });
    setIsOpen(true);
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => {
      const product = prev.find(item => item.id === productId);
      if (product) {
        toast.success(`Removed ${product.name} from cart`);
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === productId) {
          // Check stock limit
          if (quantity > item.stock) {
            toast.error(`Only ${item.stock} ${item.name} available`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getItemCount = () => {
    return cartItems.length;
  };

  const value = {
    cartItems,
    isOpen,
    setIsOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotalItems,
    getItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};