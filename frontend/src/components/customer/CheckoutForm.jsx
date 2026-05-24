import React, { useState } from 'react';
import { MapPin, Home, Phone, User, Navigation } from 'lucide-react';

const CheckoutForm = ({ onSubmit, deliveryAddress, setDeliveryAddress, customerLocation }) => {
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!deliveryAddress.street) newErrors.street = 'Street address is required';
    if (!deliveryAddress.city) newErrors.city = 'City is required';
    if (!deliveryAddress.phone) newErrors.phone = 'Phone number is required';
    if (!deliveryAddress.recipientName) newErrors.recipientName = 'Recipient name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(deliveryAddress);
    }
  };

  const useCurrentLocation = () => {
    if (customerLocation) {
      setDeliveryAddress({
        ...deliveryAddress,
        lat: customerLocation.lat,
        lng: customerLocation.lng
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-valhala-secondary rounded-xl p-6">
      <h2 className="text-xl font-bold mb-6">Delivery Information</h2>
      
      <div className="space-y-4">
        {/* Recipient Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recipient Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={deliveryAddress.recipientName || ''}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, recipientName: e.target.value})}
              className={`input-primary pl-10 ${errors.recipientName ? 'border-red-500' : ''}`}
              placeholder="Full name"
            />
          </div>
          {errors.recipientName && <p className="text-red-500 text-xs mt-1">{errors.recipientName}</p>}
        </div>
        
        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="tel"
              value={deliveryAddress.phone || ''}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
              className={`input-primary pl-10 ${errors.phone ? 'border-red-500' : ''}`}
              placeholder="+254 700 123 456"
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
        
        {/* Street Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Street Address
          </label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={deliveryAddress.street}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
              className={`input-primary pl-10 ${errors.street ? 'border-red-500' : ''}`}
              placeholder="House number and street name"
            />
          </div>
          {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
        </div>
        
        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            City
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={deliveryAddress.city}
              onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
              className={`input-primary pl-10 ${errors.city ? 'border-red-500' : ''}`}
            >
              <option value="Nairobi">Nairobi</option>
              <option value="Kiambu">Kiambu</option>
              <option value="Kajiado">Kajiado</option>
              <option value="Machakos">Machakos</option>
            </select>
          </div>
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>
        
        {/* Delivery Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Delivery Instructions (Optional)
          </label>
          <textarea
            value={deliveryAddress.instructions || ''}
            onChange={(e) => setDeliveryAddress({...deliveryAddress, instructions: e.target.value})}
            className="input-primary"
            rows="3"
            placeholder="Gate code, landmark, etc."
          />
        </div>
        
        {/* Use Current Location Button */}
        <button
          type="button"
          onClick={useCurrentLocation}
          className="w-full flex items-center justify-center gap-2 py-2 border border-valhala-accent text-valhala-accent rounded-lg hover:bg-valhala-accent/10 transition-colors"
        >
          <Navigation size={18} />
          Use Current Location
        </button>
      </div>
      
      <button type="submit" className="btn-primary w-full mt-6">
        Review Order
      </button>
    </form>
  );
};

export default CheckoutForm;