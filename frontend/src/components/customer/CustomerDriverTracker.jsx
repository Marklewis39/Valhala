import React, { useState, useEffect } from 'react';
import { realtimeDb, ref, onValue } from '../../services/firebase';
import { Truck, MapPin, Clock, Navigation, Phone, Star, AlertCircle, CheckCircle } from 'lucide-react';

const CustomerDriverTracker = ({ driverId, orderId, orderDetails, onDriverUpdate }) => {
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [deliveryProgress, setDeliveryProgress] = useState(null);

  // Calculate distance and ETA between two points
  const calculateDistanceAndETA = (driverLat, driverLng, customerLat, customerLng) => {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (customerLat - driverLat) * Math.PI / 180;
    const dLng = (customerLng - driverLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(driverLat * Math.PI / 180) * Math.cos(customerLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    
    // Assume average speed of 30 km/h in city
    const estimatedMinutes = Math.ceil(distanceKm / 30 * 60);
    
    return { distance: distanceKm.toFixed(1), eta: estimatedMinutes };
  };

  useEffect(() => {
    if (!driverId) {
      setError('Waiting for driver assignment...');
      return;
    }

    setError(null);
    
    // Listen to driver location
    const driverLocationRef = ref(realtimeDb, `driverLocations/${driverId}`);
    
    const unsubscribeLocation = onValue(driverLocationRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data && data.status !== 'offline' && data.lat && data.lng) {
        setDriverLocation({ lat: data.lat, lng: data.lng });
        setIsOnline(true);
        setLastUpdate(data.lastUpdate);
        setError(null);
        
        // Calculate ETA if customer location is available
        if (orderDetails?.deliveryAddress?.lat && orderDetails?.deliveryAddress?.lng) {
          const { distance: dist, eta: etaMinutes } = calculateDistanceAndETA(
            data.lat, data.lng,
            orderDetails.deliveryAddress.lat,
            orderDetails.deliveryAddress.lng
          );
          setDistance(dist);
          setEta(etaMinutes);
        }
        
        // Get driver info from Firestore would be ideal, but for now use placeholder
        setDriverInfo({
          name: data.driverName || 'Your Driver',
          phone: data.driverPhone || 'Loading...',
          rating: 4.8,
          vehicleNumber: data.vehicleNumber || 'Unknown'
        });
        
        if (onDriverUpdate) onDriverUpdate(data);
      } else if (data && data.status === 'offline') {
        setIsOnline(false);
        setError('Driver is currently offline');
      } else {
        setIsOnline(false);
        setError('Waiting for driver location...');
      }
    }, (err) => {
      console.error('Error fetching driver location:', err);
      setError('Unable to track driver location');
    });

    // Listen to delivery progress
    const progressRef = ref(realtimeDb, `deliveryProgress/${orderId}`);
    const unsubscribeProgress = onValue(progressRef, (snapshot) => {
      const progress = snapshot.val();
      if (progress) {
        setDeliveryProgress(progress);
        if (progress.eta) setEta(progress.eta);
      }
    });

    return () => {
      unsubscribeLocation();
      unsubscribeProgress();
    };
  }, [driverId, orderId, orderDetails, onDriverUpdate]);

  // Get status color and message
  const getStatusInfo = () => {
    if (!isOnline) return { color: 'bg-gray-100', textColor: 'text-gray-600', icon: Clock, message: 'Driver is offline' };
    if (!driverLocation) return { color: 'bg-yellow-50', textColor: 'text-yellow-800', icon: Clock, message: 'Waiting for location...' };
    if (eta <= 5) return { color: 'bg-green-50', textColor: 'text-green-800', icon: CheckCircle, message: 'Arriving soon!' };
    return { color: 'bg-blue-50', textColor: 'text-blue-800', icon: Navigation, message: 'Driver is on the way' };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={24} />
          <div>
            <p className="font-medium text-yellow-800">Driver Status</p>
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!driverId) {
    return (
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Clock className="text-gray-500" size={24} />
          <div>
            <p className="font-medium text-gray-700">Finding a driver...</p>
            <p className="text-sm text-gray-500">We're assigning a driver to your order</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-valhala-primary to-valhala-nordic p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-valhala-accent rounded-full flex items-center justify-center">
              <Truck className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Your Driver</h3>
              <p className="text-xs text-gray-300">Order #{orderId?.slice(-6)}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.textColor}`}>
            {isOnline && driverLocation ? 'Active' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Driver Info */}
      {driverInfo && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 bg-valhala-accent/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-valhala-accent">
                {driverInfo.name?.charAt(0) || 'D'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{driverInfo.name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{driverInfo.vehicleNumber}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500 fill-current" />
                  <span>{driverInfo.rating}</span>
                </div>
              </div>
            </div>
            <a href={`tel:${driverInfo.phone}`} className="p-2 bg-valhala-accent text-white rounded-lg hover:bg-opacity-90">
              <Phone size={18} />
            </a>
          </div>
        </div>
      )}

      {/* Location & ETA */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Distance</p>
            <p className="text-2xl font-bold text-valhala-primary">
              {distance ? `${distance} km` : '--'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Estimated Arrival</p>
            <p className="text-2xl font-bold text-green-600">
              {eta ? `${eta} min` : '--'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {deliveryProgress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Order Prepared</span>
              <span>Picked Up</span>
              <span>En Route</span>
              <span>Delivered</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-valhala-accent rounded-full transition-all duration-500"
                style={{ width: `${deliveryProgress.progress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Message */}
        <div className={`${statusInfo.color} rounded-lg p-3`}>
          <div className="flex items-center gap-2">
            <StatusIcon size={18} className={statusInfo.textColor} />
            <p className={`text-sm font-medium ${statusInfo.textColor}`}>
              {statusInfo.message}
            </p>
          </div>
        </div>
      </div>

      {/* Live Location Map Placeholder */}
      <div className="p-4">
        <div className="bg-gray-100 rounded-lg h-64 relative overflow-hidden">
          {driverLocation ? (
            <div className="relative w-full h-full">
              {/* Map background simulation */}
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <Truck size={48} className="text-valhala-accent mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-gray-600 font-medium">Driver is on the move!</p>
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
                  </p>
                  {eta && (
                    <p className="text-xs text-green-600 mt-2">
                      🚗 ETA: {eta} minutes
                    </p>
                  )}
                </div>
              </div>
              {/* Live location indicator */}
              <div className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-valhala-accent mx-auto mb-3" />
                <p className="text-gray-500">Loading driver location...</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          Last updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Waiting for data...'}
        </p>
      </div>
    </div>
  );
};

export default CustomerDriverTracker;