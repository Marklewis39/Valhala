import { DELIVERY_CONFIG } from './constants';

// Haversine formula to calculate distance between two coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Find nearest distribution center
export const findNearestCenter = (customerLat, customerLng) => {
  let minDistance = Infinity;
  let nearestCenter = null;
  
  DELIVERY_CONFIG.DISTRIBUTION_CENTERS.forEach(center => {
    const distance = getDistanceFromLatLonInKm(
      customerLat, customerLng, center.lat, center.lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestCenter = center;
    }
  });
  
  return { center: nearestCenter, distance: minDistance };
};

// Calculate delivery fee based on distance
export const calculateDeliveryFee = (customerLat, customerLng) => {
  const { center, distance } = findNearestCenter(customerLat, customerLng);
  
  // Calculate fee
  let fee = DELIVERY_CONFIG.BASE_FEE + (distance * DELIVERY_CONFIG.FEE_PER_KM);
  fee = Math.min(fee, DELIVERY_CONFIG.MAX_FEE);
  
  return {
    fee: Math.round(fee),
    distance: distance.toFixed(1),
    center: center.name
  };
};

// Estimate delivery time based on distance
export const estimateDeliveryTime = (distance) => {
  // Assume average speed of 30 km/h in city
  const travelTimeHours = distance / 30;
  const travelTimeMinutes = Math.ceil(travelTimeHours * 60);
  
  // Add preparation time (15 minutes)
  const totalMinutes = travelTimeMinutes + 15;
  
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
  }
};

// Validate address coordinates
export const isValidCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Get user's current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    }
  });
};