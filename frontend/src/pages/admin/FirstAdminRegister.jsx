import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, createUserWithEmailAndPassword, setDoc, doc, getDocs, collection, query, where } from '../../services/firebase';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, User, AlertCircle, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const FirstAdminRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasExistingAdmin, setHasExistingAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // Check if any admin already exists
  useEffect(() => {
    const checkExistingAdmins = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'admin'));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setHasExistingAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admins:', error);
      } finally {
        setChecking(false);
      }
    };
    
    checkExistingAdmins();
  }, []);

  // If admins already exist, redirect to login (fixed path - removed /admin prefix)
  if (!checking && hasExistingAdmin) {
    navigate('/login');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
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
    if (formData.secretKey !== import.meta.env.VITE_FIRST_ADMIN_SECRET_KEY) {
      setError('Invalid secret key');
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Save admin data to Firestore users collection
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        role: 'admin',
        isFirstAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      toast.success('First admin account created successfully! Please login.');
      // Fixed redirect path - removed /admin prefix
      navigate('/login');
      
    } catch (err) {
      console.error('Registration error:', err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('Registration failed. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-valhala-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          
          {/* Header */}
          <div className="bg-valhala-accent/20 p-6 text-center border-b border-white/10">
            <div className="w-20 h-20 bg-valhala-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">First Admin Setup</h1>
            <p className="text-gray-300 text-sm mt-1">Create the first administrator account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-valhala-accent focus:ring-1 focus:ring-valhala-accent transition"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-valhala-accent focus:ring-1 focus:ring-valhala-accent transition"
                  placeholder="admin@valhala.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-valhala-accent focus:ring-1 focus:ring-valhala-accent transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Confirm
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-valhala-accent focus:ring-1 focus:ring-valhala-accent transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Show Password Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-valhala-accent focus:ring-valhala-accent"
              />
              <label htmlFor="showPassword" className="text-sm text-gray-400 cursor-pointer">
                Show passwords
              </label>
            </div>

            {/* Secret Key Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                First Admin Secret Key
              </label>
              <div className="relative">
                <Key size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="secretKey"
                  value={formData.secretKey}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-valhala-accent focus:ring-1 focus:ring-valhala-accent transition"
                  placeholder="Enter first admin secret key"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * Contact the system owner for the secret key
              </p>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-valhala-accent hover:bg-valhala-accent/80 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Admin Account...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Create First Admin
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FirstAdminRegister;