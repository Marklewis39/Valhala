// src/utils/formatters.js

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
export const formatDate = (timestamp, format = 'PPp') => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
  return `${Math.floor(diffMinutes / 1440)} days ago`;
};

// Format distance (km or meters) - FIXED: Added this missing function
export const formatDistance = (distanceInKm) => {
  if (!distanceInKm && distanceInKm !== 0) return 'N/A';
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)}m`;
  }
  return `${distanceInKm.toFixed(1)}km`;
};

// Format duration (minutes to readable string)
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return 'N/A';
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr ${remainingMinutes} min`;
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return cleaned.replace(/(254)(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
  }
  return phone;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Capitalize first letter of each word
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

// Calculate order summary
export const calculateOrderSummary = (cartItems, deliveryFee) => {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const total = subtotal + deliveryFee;
  const upfrontPayment = total * 0.5;
  const remainingPayment = total - upfrontPayment;
  
  return {
    subtotal,
    deliveryFee,
    total,
    upfrontPayment,
    remainingPayment
  };
};

// Format order status with proper display text and colors
export const formatOrderStatus = (status) => {
  const statusMap = {
    'pending_payment': { text: 'Pending Payment', color: 'bg-yellow-500', icon: '💰' },
    'awaiting_driver': { text: 'Awaiting Driver', color: 'bg-blue-500', icon: '🕐' },
    'picked_up': { text: 'Picked Up', color: 'bg-purple-500', icon: '📦' },
    'en_route': { text: 'En Route', color: 'bg-orange-500', icon: '🚗' },
    'delivered': { text: 'Delivered', color: 'bg-green-500', icon: '✅' },
    'cancelled': { text: 'Cancelled', color: 'bg-red-500', icon: '❌' }
  };
  
  return statusMap[status] || { text: status, color: 'bg-gray-500', icon: '📋' };
};

// Format payment status
export const formatPaymentStatus = (upfrontStatus, remainingStatus) => {
  if (upfrontStatus === 'paid' && remainingStatus === 'paid_on_delivery') {
    return { text: 'Fully Paid', color: 'text-green-600', icon: '✅' };
  }
  if (upfrontStatus === 'paid' && remainingStatus === 'pending') {
    return { text: '50% Paid (Balance on Delivery)', color: 'text-yellow-600', icon: '💰' };
  }
  if (upfrontStatus === 'pending') {
    return { text: 'Awaiting Payment', color: 'text-red-600', icon: '⚠️' };
  }
  return { text: 'Unknown', color: 'text-gray-600', icon: '❓' };
};

// Format product category with icon
export const formatCategory = (category) => {
  const categories = {
    'whiskey': { name: 'Whiskey', icon: '🥃' },
    'beer': { name: 'Beer', icon: '🍺' },
    'wine': { name: 'Wine', icon: '🍷' },
    'gin': { name: 'Gin', icon: '🍸' },
    'vodka': { name: 'Vodka', icon: '🍸' },
    'scotch': { name: 'Scotch', icon: '🥃' },
    'cognac': { name: 'Cognac', icon: '🥃' },
    'rum': { name: 'Rum', icon: '🍹' }
  };
  
  return categories[category?.toLowerCase()] || { name: category || 'Other', icon: '🍾' };
};

// Format delivery estimate
export const formatDeliveryEstimate = (estimatedTime) => {
  if (!estimatedTime) return 'Calculating...';
  
  const date = estimatedTime.toDate ? estimatedTime.toDate() : new Date(estimatedTime);
  const now = new Date();
  const diffMinutes = Math.floor((date - now) / 60000);
  
  if (diffMinutes <= 0) return 'Arriving any moment';
  if (diffMinutes < 60) return `${diffMinutes} minutes`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours}h ${minutes}m`;
};

// Format stock status
export const formatStockStatus = (stock, lowStockThreshold = 10) => {
  if (stock <= 0) {
    return { text: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' };
  }
  if (stock <= lowStockThreshold) {
    return { text: `Low Stock (${stock} left)`, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  }
  return { text: `In Stock (${stock})`, color: 'text-green-600', bgColor: 'bg-green-100' };
};

// Format number with K/M suffix (for large numbers)
export const formatCompactNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format percentage
export const formatPercentage = (value, total) => {
  if (!total || total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
};