import { useState, useEffect } from 'react';
import { realtimeDb, dbRef, onValue } from '../services/firebase';

export const useRealtimeLocation = (driverId) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!driverId) {
      setLocation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const locationRef = dbRef(realtimeDb, `driverLocations/${driverId}`);
    
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLocation({
          lat: data.lat,
          lng: data.lng,
          lastUpdate: data.lastUpdate,
          eta: data.eta,
          orderId: data.orderId
        });
      } else {
        setLocation(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Location tracking error:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [driverId]);

  return { location, loading, error };
};