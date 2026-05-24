import React, { useEffect, useState, useRef } from 'react';
import { realtimeDb, ref, set, onValue } from '../../services/firebase';
import { auth } from '../../services/firebase';
import { Navigation, MapPin, Truck, AlertCircle, CheckCircle, Power, PowerOff } from 'lucide-react';

const DriverLocationTracker = ({ orderId, orderDetails, onLocationUpdate, onTrackingStatusChange }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Not tracking');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const driverId = auth.currentUser?.uid;
  const intervalRef = useRef(null);

  // Check if browser supports geolocation
  const isGeolocationSupported = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return false;
    }
    return true;
  };

  // Get battery info if available
  const getBatteryInfo = async () => {
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      } catch (err) {
        console.log('Battery API not available');
      }
    }
  };

  const startTracking = async () => {
    if (!driverId) {
      setError('No driver logged in');
      return;
    }

    if (!isGeolocationSupported()) return;

    setError(null);
    setLocationStatus('Requesting location permission...');

    // Request permission first
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        startWatching();
      } else if (result.state === 'prompt') {
        startWatching();
      } else {
        setError('Location permission denied. Please enable location access.');
      }
    }).catch(() => {
      startWatching(); // Try anyway
    });
  };

  const startWatching = () => {
    if (!isGeolocationSupported()) return;

    const watch = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = Date.now();
        
        setCurrentLocation({ 
          lat: latitude, 
          lng: longitude, 
          accuracy, 
          speed, 
          heading,
          timestamp 
        });
        setLastUpdateTime(timestamp);
        setLocationStatus(`📍 Active - Updating every 10 seconds`);
        setError(null);
        
        try {
          const locationRef = ref(realtimeDb, `driverLocations/${driverId}`);
          await set(locationRef, {
            lat: latitude,
            lng: longitude,
            accuracy: accuracy || null,
            speed: speed || null,
            heading: heading || null,
            lastUpdate: timestamp,
            orderId: orderId || null,
            status: orderId ? 'en_route' : 'available',
            batteryLevel: batteryLevel
          });
          
          if (onLocationUpdate) {
            onLocationUpdate({ 
              lat: latitude, 
              lng: longitude, 
              accuracy, 
              speed, 
              heading,
              timestamp 
            });
          }
        } catch (err) {
          console.error('Failed to save location:', err);
          setLocationStatus('⚠️ Failed to save location');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        switch(err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission denied. Please enable location access.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable. Check GPS signal.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Check your connection.');
            break;
          default:
            setError('An unknown error occurred.');
        }
        setLocationStatus('❌ GPS Error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000
      }
    );

    setWatchId(watch);
    setIsTracking(true);
    if (onTrackingStatusChange) onTrackingStatusChange(true);

    // Also set up an interval to ensure location is sent even if watchPosition is slow
    intervalRef.current = setInterval(() => {
      if (currentLocation) {
        const locationRef = ref(realtimeDb, `driverLocations/${driverId}`);
        set(locationRef, {
          ...currentLocation,
          lastUpdate: Date.now(),
          orderId: orderId || null,
          status: orderId ? 'en_route' : 'available',
          batteryLevel: batteryLevel
        }).catch(err => console.error('Interval update failed:', err));
      }
    }, 10000);
  };

  const stopTracking = async () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsTracking(false);
    setLocationStatus('Tracking stopped');
    
    if (driverId) {
      const locationRef = ref(realtimeDb, `driverLocations/${driverId}`);
      await set(locationRef, { 
        status: 'offline', 
        lastUpdate: Date.now(),
        orderId: null
      });
    }
    
    if (onTrackingStatusChange) onTrackingStatusChange(false);
  };

  // Get battery info on mount
  useEffect(() => {
    getBatteryInfo();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [watchId]);

  // Update status when order changes
  useEffect(() => {
    if (isTracking && driverId) {
      const locationRef = ref(realtimeDb, `driverLocations/${driverId}`);
      set(locationRef, {
        ...currentLocation,
        lastUpdate: Date.now(),
        orderId: orderId || null,
        status: orderId ? 'en_route' : 'available',
        batteryLevel: batteryLevel
      }).catch(err => console.error('Order update failed:', err));
    }
  }, [orderId, isTracking, driverId]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-valhala-primary to-valhala-nordic p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-valhala-accent rounded-full flex items-center justify-center">
              <Navigation className="text-white" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white">Live Location Tracking</h3>
              <p className="text-xs text-gray-300">
                {isTracking ? 'Active - Sharing location' : 'Inactive'}
              </p>
            </div>
          </div>
          {batteryLevel !== null && (
            <div className="text-right">
              <p className="text-xs text-gray-300">Battery</p>
              <p className="text-sm font-semibold text-white">{batteryLevel}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Section */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isTracking ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-600">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-sm font-medium text-gray-500">Offline</span>
              </div>
            )}
          </div>
          {lastUpdateTime && (
            <p className="text-xs text-gray-500">
              Last update: {new Date(lastUpdateTime).toLocaleTimeString()}
            </p>
          )}
        </div>

        {currentLocation && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Latitude</p>
                <p className="font-mono text-sm">{currentLocation.lat?.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Longitude</p>
                <p className="font-mono text-sm">{currentLocation.lng?.toFixed(6)}</p>
              </div>
              {currentLocation.accuracy && (
                <div>
                  <p className="text-xs text-gray-500">Accuracy</p>
                  <p className="text-sm">{Math.round(currentLocation.accuracy)}m</p>
                </div>
              )}
              {currentLocation.speed !== null && currentLocation.speed !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">Speed</p>
                  <p className="text-sm">{Math.round(currentLocation.speed * 3.6)} km/h</p>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={16} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {locationStatus && !error && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-500" size={16} />
              <p className="text-sm text-blue-700">{locationStatus}</p>
            </div>
          </div>
        )}

        {orderDetails && (
          <div className="mt-3 bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="text-yellow-600" size={16} />
              <p className="text-sm font-medium text-yellow-800">Current Delivery</p>
            </div>
            <p className="text-xs text-yellow-700">Order #{orderId?.slice(-6)}</p>
            <p className="text-xs text-yellow-700">
              Delivery to: {orderDetails?.deliveryAddress?.street || 'Address not set'}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4">
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Power size={18} />
            Start Location Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <PowerOff size={18} />
            Stop Tracking
          </button>
        )}
      </div>

      {/* Info Note */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-400 text-center">
          Location updates every 10 seconds for accurate tracking
        </p>
      </div>
    </div>
  );
};

export default DriverLocationTracker;