import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, signInWithEmailAndPassword, onAuthStateChanged, db, collection, query, where, getDocs } from '../../services/firebase';
import { Truck, Mail, Lock, Eye, EyeOff, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DriverLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verify if user is a driver
        try {
          const driversRef = collection(db, 'drivers');
          const q = query(driversRef, where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const driverData = querySnapshot.docs[0].data();
            if (driverData.isActive !== false) {
              navigate('/driver/dashboard');
            } else {
              toast.error('Your account has been deactivated. Contact admin.');
              await auth.signOut();
            }
          } else {
            await auth.signOut();
            toast.error('Not a driver account. Please use customer login.');
          }
        } catch (err) {
          console.error('Error verifying driver status:', err);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verify driver status
      const driversRef = collection(db, 'drivers');
      const q = query(driversRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await auth.signOut();
        setError('This account is not registered as a driver');
        toast.error('Access denied. Driver account required.');
        setLoading(false);
        return;
      }
      
      const driverData = querySnapshot.docs[0].data();
      
      if (driverData.isActive === false) {
        await auth.signOut();
        setError('Your driver account has been deactivated. Please contact admin.');
        toast.error('Account deactivated');
        setLoading(false);
        return;
      }
      
      // Success - navigate to dashboard
      toast.success(`Welcome back, ${driverData.name || 'Driver'}!`);
      navigate('/driver/dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No driver account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Try again later');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        default:
          setError('Login failed. Please try again');
      }
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo driver credentials for testing (only shown in development)
  const fillDemoCredentials = () => {
    setEmail('demo_driver@valhala.com');
    setPassword('demo123');
    setError('');
    toast.info('Demo credentials loaded. Contact admin for actual account.', {
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-valhala-primary via-valhala-secondary to-valhala-nordic flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-valhala-accent rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-valhala-gold rounded-full filter blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          
          {/* Header */}
          <div className="bg-valhala-accent/20 p-6 text-center border-b border-white/10">
            <div className="w-20 h-20 bg-valhala-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Truck size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Driver Portal</h1>
            <p className="text-gray-300 text-sm mt-1">Sign in to start delivering</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Info Note - No Registration */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-300">
                  Driver accounts are created by administrators only. 
                  Contact your supervisor if you need access.
                </p>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-valhala-accent focus:ring-1 focus:ring-valhala-accent transition"
                  placeholder="driver@valhala.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-valhala-accent focus:ring-1 focus:ring-valhala-accent transition"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-valhala-accent focus:ring-valhala-accent"
                />
                <span className="text-sm text-gray-400">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-valhala-accent hover:text-valhala-gold transition"
                onClick={() => toast.info('Contact your administrator to reset your password')}
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-valhala-accent hover:bg-valhala-accent/80 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Truck size={18} />
                  Sign In
                </>
              )}
            </button>

            {/* Demo Access - Only in Development */}
            {import.meta.env.DEV && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-400">Demo Access (Development Only)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="w-full border border-white/30 text-gray-300 font-medium py-2 rounded-lg hover:bg-white/5 transition"
                >
                  Use Demo Credentials
                </button>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="p-4 text-center border-t border-white/10">
            <p className="text-sm text-gray-400">
              Need help? <a href="/support" className="text-valhala-accent hover:text-valhala-gold">Contact Support</a>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © 2024 Valhala. All rights reserved.
            </p>
          </div>
        </div>

        {/* Return to Customer Login */}
        <div className="text-center mt-6">
          <Link to="/login" className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1">
            <Shield size={14} />
            Customer Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;