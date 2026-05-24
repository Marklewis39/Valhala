// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate delivery fee
const calculateDeliveryFee = (distance, config) => {
  const baseFee = config.baseFee || 100;
  const feePerKm = config.feePerKm || 50;
  const maxFee = config.maxFee || 500;
  
  let fee = baseFee + (distance * feePerKm);
  fee = Math.min(fee, maxFee);
  
  return Math.round(fee);
};

// Calculate ETA based on distance and traffic
const calculateETA = (distance, timeOfDay = null) => {
  const baseSpeed = 30; // km/h
  let speedMultiplier = 1;
  
  if (timeOfDay) {
    const hour = typeof timeOfDay === 'number' ? timeOfDay : new Date().getHours();
    
    // Peak hours (8-10 AM, 5-7 PM)
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
      speedMultiplier = 0.6;
    }
    // Late night (11 PM - 5 AM)
    else if (hour >= 23 || hour <= 5) {
      speedMultiplier = 1.3;
    }
  }
  
  const travelTimeHours = distance / (baseSpeed * speedMultiplier);
  let travelTimeMinutes = Math.ceil(travelTimeHours * 60);
  
  // Add preparation time (15 minutes)
  travelTimeMinutes += 15;
  
  return {
    minutes: travelTimeMinutes,
    formatted: travelTimeMinutes < 60 ? `${travelTimeMinutes} min` : `${Math.floor(travelTimeMinutes / 60)}h ${travelTimeMinutes % 60}min`
  };
};

// Calculate profit margin
const calculateProfitMargin = (sellingPrice, buyPrice) => {
  if (sellingPrice <= 0) return 0;
  const profit = sellingPrice - buyPrice;
  return (profit / sellingPrice) * 100;
};

// Calculate order totals
const calculateOrderTotals = (items, deliveryFee = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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

// Calculate sales statistics
const calculateSalesStats = (orders) => {
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Group by date
  const dailyStats = {};
  orders.forEach(order => {
    const date = order.createdAt.toDate().toISOString().split('T')[0];
    if (!dailyStats[date]) {
      dailyStats[date] = { revenue: 0, orders: 0 };
    }
    dailyStats[date].revenue += order.total || 0;
    dailyStats[date].orders += 1;
  });
  
  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    dailyStats
  };
};

module.exports = {
  calculateDistance,
  calculateDeliveryFee,
  calculateETA,
  calculateProfitMargin,
  calculateOrderTotals,
  calculateSalesStats
};