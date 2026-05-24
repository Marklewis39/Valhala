// frontend/src/components/admin/DriverMapView.jsx (UPDATED)
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Truck, MapPin, Users, RefreshCw, Search } from 'lucide-react';
import { formatDistance, formatRelativeTime } from '../../utils/formatters';
import { realtimeDb, ref, onValue } from '../../services/firebase';
import { db, collection, getDocs, onSnapshot } from '../../services/firebase';

// Fix for Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DriverMapView = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [driverLocations, setDriverLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [mapCenter] = useState([-1.2921, 36.8219]);
  const [mapZoom] = useState(12);
  const [showDriverList, setShowDriverList] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch driver profiles from Firestore (real-time)
  useEffect(() => {
    const driversRef = collection(db, 'drivers');
    
    const unsubscribe = onSnapshot(driversRef, (snapshot) => {
      const driversList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrivers(driversList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching drivers:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to real-time locations from Realtime Database
  useEffect(() => {
    const locationsRef = ref(realtimeDb, 'driverLocations');
    
    const unsubscribe = onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDriverLocations(data);
      }
    });

    return () => unsubscribe();
  }, []);

  // Merge driver profiles with real-time locations
  const mergedDrivers = drivers.map(driver => {
    const location = driverLocations[driver.id];
    const isOnline = location && location.status !== 'offline';
    const isOnDelivery = location && location.orderId != null;
    
    return {
      ...driver,
      currentLocation: location && location.lat ? {
        lat: location.lat,
        lng: location.lng,
        updatedAt: location.lastUpdate
      } : null,
      isActive: driver.isActive && isOnline,
      isAvailable: isOnline && !isOnDelivery
    };
  });

  // Initialize map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(mapCenter, mapZoom);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when drivers change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};

    // Filter drivers
    let filteredDrivers = mergedDrivers;
    if (filterStatus !== 'all') {
      filteredDrivers = mergedDrivers.filter(driver => {
        if (filterStatus === 'active') return driver.isActive && driver.isAvailable;
        if (filterStatus === 'on_delivery') return driver.isActive && !driver.isAvailable;
        if (filterStatus === 'inactive') return !driver.isActive;
        return true;
      });
    }
    if (searchTerm) {
      filteredDrivers = filteredDrivers.filter(driver =>
        driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Add markers for each driver
    filteredDrivers.forEach(driver => {
      if (driver.currentLocation && driver.currentLocation.lat && driver.currentLocation.lng) {
        const isActive = driver.isActive && driver.isAvailable;
        const isOnDelivery = driver.isActive && !driver.isAvailable;
        
        const iconColor = isActive ? '#10b981' : (isOnDelivery ? '#f59e0b' : '#6b7280');
        const iconHtml = `
          <div class="relative">
            <div class="w-8 h-8 rounded-full flex items-center justify-center animate-pulse" 
                 style="background-color: ${iconColor}; box-shadow: 0 0 10px ${iconColor}">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
              </svg>
            </div>
            <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 
                        border-l-4 border-r-4 border-t-4 border-transparent"
                 style="border-top-color: ${iconColor}"></div>
          </div>
        `;
        
        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-div-icon',
          iconSize: [32, 32],
          popupAnchor: [0, -16]
        });
        
        const marker = L.marker([driver.currentLocation.lat, driver.currentLocation.lng], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2 min-w-[200px]">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 bg-valhala-accent rounded-full flex items-center justify-center">
                  <span class="text-white font-bold">${driver.name?.charAt(0) || 'D'}</span>
                </div>
                <div>
                  <p class="font-semibold">${driver.name || 'Unknown'}</p>
                  <p class="text-xs text-gray-500">${driver.vehicleNumber || 'No vehicle'}</p>
                </div>
              </div>
              <div class="space-y-1 text-sm">
                <p>📱 ${driver.phoneNumber || 'N/A'}</p>
                <p>🚗 ${driver.vehicleType?.toUpperCase() || 'N/A'}</p>
                <p>📦 Deliveries: ${driver.totalDeliveries || 0}</p>
                <p>⭐ Rating: ${driver.rating || 5.0}</p>
                <p class="text-xs text-gray-500">
                  Last update: ${formatRelativeTime(driver.currentLocation.updatedAt)}
                </p>
              </div>
            </div>
          `);
        
        marker.on('click', () => {
          setSelectedDriver(driver);
        });
        
        markersRef.current[driver.id] = marker;
      }
    });

    // Fit bounds to show all markers
    const markersList = Object.values(markersRef.current);
    if (markersList.length > 0) {
      const group = L.featureGroup(markersList);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [mergedDrivers, filterStatus, searchTerm]);

  const handleRefresh = () => {
    setIsLoading(true);
    // Force refresh by re-triggering the listeners
    setTimeout(() => setIsLoading(false), 1000);
  };

  const centerOnDriver = (driver) => {
    if (driver.currentLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([driver.currentLocation.lat, driver.currentLocation.lng], 15);
      setSelectedDriver(driver);
      
      const marker = markersRef.current[driver.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const filteredDrivers = mergedDrivers.filter(driver => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') return driver.isActive && driver.isAvailable;
      if (filterStatus === 'on_delivery') return driver.isActive && !driver.isAvailable;
      if (filterStatus === 'inactive') return !driver.isActive;
    }
    if (searchTerm) {
      return driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             driver.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const stats = {
    total: mergedDrivers.length,
    active: mergedDrivers.filter(d => d.isActive && d.isAvailable).length,
    onDelivery: mergedDrivers.filter(d => d.isActive && !d.isAvailable).length,
    inactive: mergedDrivers.filter(d => !d.isActive).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-valhala-accent"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Driver List Panel */}
      <div className={`lg:col-span-1 ${!showDriverList && 'hidden lg:block'}`}>
        <div className="bg-valhala-secondary rounded-xl overflow-hidden sticky top-24">
          {/* Header */}
          <div className="p-4 border-b border-valhala-nordic">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-valhala-accent" />
                <h3 className="font-semibold">Drivers ({filteredDrivers.length})</h3>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 hover:bg-valhala-primary rounded-lg transition-colors"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 bg-valhala-primary rounded-lg">
                <p className="text-lg font-bold text-green-500">{stats.active}</p>
                <p className="text-xs text-gray-400">Available</p>
              </div>
              <div className="text-center p-2 bg-valhala-primary rounded-lg">
                <p className="text-lg font-bold text-yellow-500">{stats.onDelivery}</p>
                <p className="text-xs text-gray-400">On Delivery</p>
              </div>
              <div className="text-center p-2 bg-valhala-primary rounded-lg">
                <p className="text-lg font-bold text-gray-500">{stats.inactive}</p>
                <p className="text-xs text-gray-400">Inactive</p>
              </div>
            </div>
            
            {/* Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-valhala-primary border border-gray-700 rounded-lg text-sm"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-valhala-primary border border-gray-700 rounded-lg text-sm"
              >
                <option value="all">All Drivers</option>
                <option value="active">Available</option>
                <option value="on_delivery">On Delivery</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          {/* Driver List */}
          <div className="max-h-[500px] overflow-y-auto">
            {filteredDrivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => centerOnDriver(driver)}
                className={`p-4 border-b border-valhala-nordic cursor-pointer transition-colors hover:bg-valhala-primary ${
                  selectedDriver?.id === driver.id ? 'bg-valhala-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    driver.isActive && driver.isAvailable ? 'bg-green-500/20' :
                    driver.isActive ? 'bg-yellow-500/20' : 'bg-gray-500/20'
                  }`}>
                    <Truck size={20} className={
                      driver.isActive && driver.isAvailable ? 'text-green-500' :
                      driver.isActive ? 'text-yellow-500' : 'text-gray-500'
                    } />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{driver.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{driver.vehicleNumber || 'No vehicle'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          driver.isActive && driver.isAvailable ? 'bg-green-500' :
                          driver.isActive ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">{driver.phoneNumber || 'No phone'}</p>
                      {driver.currentLocation && (
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(driver.currentLocation.updatedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredDrivers.length === 0 && (
              <div className="text-center py-8">
                <Truck size={40} className="mx-auto text-gray-600 mb-2" />
                <p className="text-gray-400">No drivers found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Panel */}
      <div className={`lg:col-span-2 ${showDriverList ? '' : 'lg:col-span-3'}`}>
        <div className="bg-valhala-secondary rounded-xl overflow-hidden">
          <div className="p-3 border-b border-valhala-nordic flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-valhala-accent" />
              <span className="text-sm">Live Driver Locations</span>
              <span className="text-xs text-gray-400">
                ({Object.keys(markersRef.current).length} drivers on map)
              </span>
            </div>
            <button
              onClick={() => setShowDriverList(!showDriverList)}
              className="lg:hidden p-2 hover:bg-valhala-primary rounded-lg"
            >
              {showDriverList ? 'Hide List' : 'Show List'}
            </button>
          </div>
          <div ref={mapRef} className="w-full h-[600px]" />
        </div>
      </div>
    </div>
  );
};

export default DriverMapView;