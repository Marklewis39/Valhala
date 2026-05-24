import { useState, useEffect } from 'react';
import { calculateDeliveryFee, estimateDeliveryTime } from '../utils/deliveryFeeCalculator';

export const useDeliveryFee = (customerLocation) => {
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customerLocation || !customerLocation.lat || !customerLocation.lng) {
      setDeliveryInfo(null);
      return;
    }

    setLoading(true);
    try {
      const { fee, distance, center } = calculateDeliveryFee(
        customerLocation.lat,
        customerLocation.lng
      );
      const eta = estimateDeliveryTime(parseFloat(distance));
      
      setDeliveryInfo({
        fee,
        distance,
        center,
        eta,
        formattedFee: `KSh ${fee}`,
        formattedDistance: `${distance} km`,
        formattedEta: eta
      });
      setError(null);
    } catch (err) {
      console.error('Delivery fee calculation error:', err);
      setError(err.message);
      setDeliveryInfo(null);
    } finally {
      setLoading(false);
    }
  }, [customerLocation]);

  return { deliveryInfo, loading, error };
};