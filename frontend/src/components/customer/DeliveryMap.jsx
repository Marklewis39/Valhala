import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Fix for Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DeliveryMap = ({ driverLocation, customerLocation, orderId }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeRef = useRef(null);

  useEffect(() => {
    // Initialize map
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([-1.2921, 36.8219], 13);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }

    // Add customer marker
    if (customerLocation && mapInstanceRef.current) {
      if (customerMarkerRef.current) {
        customerMarkerRef.current.remove();
      }
      
      customerMarkerRef.current = L.marker([customerLocation.lat, customerLocation.lng], {
        icon: L.divIcon({
          html: `<div class="relative">
                   <div class="w-6 h-6 bg-valhala-accent rounded-full flex items-center justify-center animate-pulse">
                     <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                     </svg>
                   </div>
                   <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-valhala-accent rounded-full"></div>
                 </div>`,
          className: 'custom-div-icon',
          iconSize: [24, 24],
          popupAnchor: [0, -12]
        })
      }).addTo(mapInstanceRef.current)
        .bindPopup('Your Location')
        .openPopup();
    }

    // Add driver marker
    if (driverLocation && mapInstanceRef.current) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
      }
      
      driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], {
        icon: L.divIcon({
          html: `<div class="relative">
                   <div class="w-8 h-8 bg-valhala-gold rounded-full flex items-center justify-center animate-bounce">
                     <svg class="w-5 h-5 text-valhala-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                     </svg>
                   </div>
                   <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-valhala-gold"></div>
                 </div>`,
          className: 'custom-div-icon',
          iconSize: [32, 32],
          popupAnchor: [0, -16]
        })
      }).addTo(mapInstanceRef.current)
        .bindPopup('Your Driver')
        .openPopup();
      
      // Draw route between driver and customer
      if (customerLocation && routeRef.current) {
        routeRef.current.remove();
      }
      
      if (customerLocation) {
        routeRef.current = L.polyline(
          [[driverLocation.lat, driverLocation.lng], [customerLocation.lat, customerLocation.lng]],
          { color: '#e94560', weight: 3, opacity: 0.7, dashArray: '5, 10' }
        ).addTo(mapInstanceRef.current);
      }
      
      // Fit bounds to show both markers
      const bounds = L.latLngBounds(
        [driverLocation.lat, driverLocation.lng],
        [customerLocation.lat, customerLocation.lng]
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [driverLocation, customerLocation]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg overflow-hidden" />
      
      {/* Info Overlay */}
      {driverLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-valhala-primary/95 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-valhala-gold animate-pulse" />
              <span className="text-gray-300">Driver is on the way</span>
            </div>
            {driverLocation.eta && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-valhala-accent" />
                <span className="font-semibold">ETA: {driverLocation.eta}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;