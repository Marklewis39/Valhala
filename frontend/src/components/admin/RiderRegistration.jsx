import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Truck, Phone, Mail, Car, X, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { auth, db, createUserWithEmailAndPassword, collection, addDoc } from '../../services/firebase';
import toast from 'react-hot-toast';

const RiderRegistration = ({ onDriverAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleType: 'motorcycle',
    vehicleNumber: '',
    licenseNumber: '',
    idNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
    toast.success('Password generated! Make sure to save it.');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Driver name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.vehicleNumber.trim()) {
      setError('Vehicle number is required');
      return false;
    }
    if (!formData.licenseNumber.trim()) {
      setError("Driver's license number is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Save driver data to Firestore drivers collection
      await addDoc(collection(db, 'drivers'), {
        userId: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phone,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
        licenseNumber: formData.licenseNumber,
        idNumber: formData.idNumber,
        isActive: true,
        isAvailable: true,
        totalDeliveries: 0,
        rating: 5.0,
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid
      });
      
      // Also create an entry in users collection with role 'driver'
      await addDoc(collection(db, 'users'), {
        uid: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        role: 'driver',
        createdAt: new Date()
      });
      
      toast.success(`Driver ${formData.name} registered successfully!`);
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        vehicleType: 'motorcycle',
        vehicleNumber: '',
        licenseNumber: '',
        idNumber: ''
      });
      setIsOpen(false);
      
      // Refresh the drivers list
      if (onDriverAdded) {
        onDriverAdded();
      }
      
    } catch (err) {
      console.error('Driver registration error:', err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Use at least 6 characters');
          break;
        default:
          setError('Failed to register driver. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:from-green-700 hover:to-green-800 transition-all"
      >
        <UserPlus size={18} />
        Register New Rider
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-valhala-secondary rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-valhala-secondary border-b border-valhala-nordic p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck size={20} className="text-valhala-accent" />
                <h2 className="text-xl font-bold">Register New Rider</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-valhala-primary rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
                    placeholder="driver@valhala.com"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
                    placeholder="+254 700 123 456"
                    required
                  />
                </div>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  National ID Number *
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
                  placeholder="12345678"
                  required
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vehicle Type *
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="car">Car</option>
                </select>
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vehicle Number *
                </label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
                    placeholder="KCD 123A"
                    required
                  />
                </div>
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Driver's License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
                  placeholder="DL123456"
                  required
                />
              </div>

              {/* Password Section */}
              <div className="border-t border-white/10 pt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Account Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-valhala-accent hover:text-valhala-gold"
                  >
                    Generate Random Password
                  </button>
                  {formData.password && (
                    <span className="text-xs text-green-500">✓ Password set</span>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Info Note */}
              <div className="bg-valhala-primary rounded-lg p-3 text-xs text-gray-400 space-y-1">
                <p>• Driver account will be created automatically</p>
                <p>• Login credentials: Email + Password above</p>
                <p>• Driver can log in at the driver portal</p>
                <p>• Driver status will be "Active" by default</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Register Rider
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default RiderRegistration;