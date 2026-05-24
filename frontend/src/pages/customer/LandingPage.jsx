import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, Clock, Shield, Truck, Star, User, ShieldCheck, Wine, Beer } from 'lucide-react';

// ============================================
// APP MODE DETECTION
// ============================================
const getAppMode = () => {
  const mode = import.meta.env.VITE_APP_MODE;
  if (mode === 'admin') return 'admin';
  if (mode === 'driver') return 'driver';
  return 'customer';
};

const appMode = getAppMode();

const LandingPage = () => {
  const { user } = useAuth();

  // ============================================
  // CUSTOMER LANDING PAGE
  // ============================================
  if (appMode === 'customer') {
    // If user is already logged in, redirect to products
    if (user) {
      window.location.href = '/products';
      return null;
    }

    return <CustomerLandingPage />;
  }

  // ============================================
  // ADMIN LANDING PAGE
  // ============================================
  if (appMode === 'admin') {
    // If admin is already logged in, redirect to dashboard
    if (user) {
      window.location.href = '/dashboard';
      return null;
    }

    return <AdminLandingPage />;
  }

  // ============================================
  // DRIVER LANDING PAGE
  // ============================================
  if (appMode === 'driver') {
    // If driver is already logged in, redirect to dashboard
    if (user) {
      window.location.href = '/dashboard';
      return null;
    }

    return <DriverLandingPage />;
  }

  return null;
};

// ============================================
// CUSTOMER LANDING PAGE (No admin/driver references)
// ============================================
const CustomerLandingPage = () => {
  const features = [
    { icon: <Truck className="text-valhala-accent" size={32} />, title: "Fast Delivery", description: "Get your drinks delivered in 30-45 minutes" },
    { icon: <Clock className="text-valhala-accent" size={32} />, title: "24/7 Service", description: "Order anytime, day or night" },
    { icon: <Shield className="text-valhala-accent" size={32} />, title: "Secure Payment", description: "Safe and encrypted transactions" },
    { icon: <Star className="text-valhala-accent" size={32} />, title: "Premium Quality", description: "Only authentic products" }
  ];

  const categories = [
    { name: "Whiskey", image: "/assets/icons/whiskey.svg", color: "from-amber-700 to-amber-900" },
    { name: "Beer", image: "/assets/icons/beer.svg", color: "from-yellow-600 to-yellow-800" },
    { name: "Wine", image: "/assets/icons/wine.svg", color: "from-purple-700 to-purple-900" },
    { name: "Gin", image: "/assets/icons/gin.svg", color: "from-emerald-700 to-emerald-900" },
    { name: "Vodka", image: "/assets/icons/vodka.svg", color: "from-blue-600 to-blue-800" },
    { name: "Scotch", image: "/assets/icons/scotch.svg", color: "from-amber-800 to-amber-950" }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/images/hero-bg.jpg" 
            alt="Hero background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-valhala-dark"></div>
        </div>
        
        <div className="absolute top-20 left-10 opacity-10 animate-float hidden lg:block">
          <Wine size={120} className="text-valhala-gold" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-10 animate-float hidden lg:block" style={{ animationDelay: '2s' }}>
          <Beer size={120} className="text-valhala-gold" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-valhala-accent/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-5xl font-norse font-bold text-valhala-gold">V</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-norse font-bold mb-6"
          >
            <span className="text-valhala-gold">Valhala</span>
            <br />
            <span className="text-white">Premium Alcohol Delivery</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto"
          >
            Get your favorite drinks delivered to your doorstep. Fast, reliable, and secure.
          </motion.p>
          
          {/* Customer Only Button - NO admin reference */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center"
          >
            <Link 
              to="/login" 
              className="group bg-gradient-to-r from-valhala-accent to-valhala-nordic px-12 py-4 rounded-xl text-center hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <User size={48} className="mx-auto mb-3 text-white group-hover:rotate-12 transition-transform duration-300" />
              <h3 className="text-2xl font-bold text-white mb-2">Shop Now</h3>
              <p className="text-gray-200 text-sm">Browse products and place orders</p>
              <div className="mt-4 flex items-center justify-center gap-2 text-white">
                <span>Get Started</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 text-gray-400 text-sm"
          >
            New customer? <Link to="/register" className="text-valhala-accent hover:text-valhala-gold">Create an account</Link>
          </motion.p>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white"
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-valhala-primary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose <span className="text-valhala-gold">Valhala</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-valhala-secondary rounded-xl hover:transform hover:scale-105 transition-all duration-300 group"
              >
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-valhala-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Shop by <span className="text-valhala-gold">Category</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className={`bg-gradient-to-br ${category.color} p-6 rounded-xl text-center cursor-pointer`}
                onClick={() => window.location.href = `/products?category=${category.name.toLowerCase()}`}
              >
                <img src={category.image} alt={category.name} className="w-16 h-16 mx-auto mb-3" />
                <p className="font-semibold">{category.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-valhala-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <p className="text-3xl md:text-4xl font-bold text-valhala-gold">500+</p>
              <p className="text-gray-400 mt-2">Products</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <p className="text-3xl md:text-4xl font-bold text-valhala-gold">10k+</p>
              <p className="text-gray-400 mt-2">Happy Customers</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <p className="text-3xl md:text-4xl font-bold text-valhala-gold">30min</p>
              <p className="text-gray-400 mt-2">Avg Delivery Time</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <p className="text-3xl md:text-4xl font-bold text-valhala-gold">24/7</p>
              <p className="text-gray-400 mt-2">Customer Support</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - Customer Only */}
      <section className="py-20 bg-gradient-to-r from-valhala-accent to-valhala-nordic">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-xl mb-8 opacity-90">Get your favorite drinks delivered now</p>
          <Link to="/login" className="bg-white text-valhala-accent px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2">
            <User size={20} />
            Start Shopping
          </Link>
          <p className="mt-6 text-white/80 text-sm">
            New customer? <Link to="/register" className="text-white font-semibold underline">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

// ============================================
// ADMIN LANDING PAGE (No customer references)
// ============================================
const AdminLandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-valhala-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={40} className="text-valhala-accent" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 mt-2">Manage your Valhala delivery platform</p>
        </div>
        
        <div className="bg-valhala-secondary rounded-xl p-8 shadow-xl">
          <Link 
            to="/login" 
            className="w-full bg-valhala-accent text-white py-3 rounded-lg font-semibold hover:bg-valhala-accent/80 transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck size={20} />
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================
// DRIVER LANDING PAGE
// ============================================
const DriverLandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-valhala-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck size={40} className="text-valhala-accent" />
          </div>
          <h1 className="text-3xl font-bold text-white">Driver Portal</h1>
          <p className="text-gray-400 mt-2">Manage your deliveries</p>
        </div>
        
        <div className="bg-valhala-secondary rounded-xl p-8 shadow-xl">
          <Link 
            to="/login" 
            className="w-full bg-valhala-accent text-white py-3 rounded-lg font-semibold hover:bg-valhala-accent/80 transition-colors flex items-center justify-center gap-2"
          >
            <Truck size={20} />
            Driver Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;