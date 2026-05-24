import { DELIVERY_CONFIG } from './constants';

// Check if geolocation is supported
export const isGeolocationSupported = () => {
  return 'geolocation' in navigator;
};

// Get current user location
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Watch user position continuously
export const watchPosition = (onSuccess, onError, options = {}) => {
  if (!isGeolocationSupported()) {
    onError?.(new Error('Geolocation not supported'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    onSuccess,
    onError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    }
  );

  return watchId;
};

// Stop watching position
export const clearWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2));
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Find nearest distribution center
export const findNearestCenter = (lat, lng) => {
  let minDistance = Infinity;
  let nearestCenter = null;

  DELIVERY_CONFIG.DISTRIBUTION_CENTERS.forEach(center => {
    const distance = calculateDistance(lat, lng, center.lat, center.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCenter = center;
    }
  });

  return {
    center: nearestCenter,
    distance: minDistance
  };
};

// Calculate delivery fee based on distance
export const calculateDeliveryFee = (lat, lng) => {
  const { center, distance } = findNearestCenter(lat, lng);
  
  let fee = DELIVERY_CONFIG.BASE_FEE + (distance * DELIVERY_CONFIG.FEE_PER_KM);
  fee = Math.min(fee, DELIVERY_CONFIG.MAX_FEE);
  
  // Free delivery for orders above threshold (handled separately)
  
  return {
    fee: Math.round(fee),
    distance: distance.toFixed(1),
    center: center?.name,
    rawDistance: distance
  };
};

// Estimate delivery time based on distance and traffic
export const estimateDeliveryTime = (distance, timeOfDay = null) => {
  const baseSpeed = 30; // km/h in normal traffic
  let speedMultiplier = 1;
  
  if (timeOfDay) {
    const hour = typeof timeOfDay === 'number' ? timeOfDay : new Date().getHours();
    
    // Peak hours (8-10 AM, 5-7 PM)
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
      speedMultiplier = 0.6; // 40% slower
    }
    // Late night (11 PM - 5 AM)
    else if (hour >= 23 || hour <= 5) {
      speedMultiplier = 1.3; // 30% faster
    }
  }
  
  const travelTimeHours = distance / (baseSpeed * speedMultiplier);
  let travelTimeMinutes = Math.ceil(travelTimeHours * 60);
  
  // Add preparation time (15 minutes)
  travelTimeMinutes += 15;
  
  return {
    minutes: travelTimeMinutes,
    formatted: formatDeliveryTime(travelTimeMinutes)
  };
};

// Format delivery time for display
export const formatDeliveryTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours}h ${mins}m`;
};

// Validate coordinates
export const isValidCoordinates = (lat, lng) => {
  return typeof lat === 'number' && 
         typeof lng === 'number' && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// Get address from coordinates (reverse geocoding)
export const reverseGeocode = async (lat, lng) => {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Valhala Delivery App'
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data.address) {
      const address = {
        street: data.address.road || data.address.pedestrian || '',
        city: data.address.city || data.address.town || data.address.village || '',
        state: data.address.state || '',
        country: data.address.country || '',
        postalCode: data.address.postcode || '',
        fullAddress: data.display_name || ''
      };
      return address;
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

// Get coordinates from address (forward geocoding)
export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Valhala Delivery App'
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Get distance matrix between multiple points
export const getDistanceMatrix = async (origins, destinations) => {
  // This would typically use Google Maps Distance Matrix API
  // For prototype, calculate straight-line distances
  const matrix = [];
  
  for (const origin of origins) {
    const row = [];
    for (const destination of destinations) {
      const distance = calculateDistance(
        origin.lat, origin.lng,
        destination.lat, destination.lng
      );
      row.push({
        distance: distance,
        duration: estimateDeliveryTime(distance).minutes
      });
    }
    matrix.push(row);
  }
  
  return matrix;
};

// Get user's city from coordinates
export const getCityFromCoordinates = async (lat, lng) => {
  const address = await reverseGeocode(lat, lng);
  return address?.city || 'Nairobi';
};

// Check if coordinates are within delivery zone
export const isInDeliveryZone = async (lat, lng) => {
  const { distance } = findNearestCenter(lat, lng);
  // Allow delivery up to 30km from nearest center
  return distance <= 30;
};