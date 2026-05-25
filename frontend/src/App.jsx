import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { OrderProvider } from './contexts/OrderContext';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load components for better performance
const Navbar = lazy(() => import('./components/common/Navbar'));
const Footer = lazy(() => import('./components/common/Footer'));

// Customer Pages
const LandingPage = lazy(() => import('./pages/customer/LandingPage'));
const Login = lazy(() => import('./pages/customer/Login'));
const Register = lazy(() => import('./pages/customer/Register'));
const ProductsPage = lazy(() => import('./pages/customer/ProductsPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const OrderTrackingPage = lazy(() => import('./pages/customer/OrderTrackingPage'));
const MyOrdersPage = lazy(() => import('./pages/customer/MyOrdersPage'));
const SupportPage = lazy(() => import('./pages/customer/SupportPage'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const FirstAdminRegister = lazy(() => import('./pages/admin/FirstAdminRegister'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const DriversManagement = lazy(() => import('./pages/admin/DriversManagement'));
const OrdersManagement = lazy(() => import('./pages/admin/OrdersManagement'));
const IssuesManagement = lazy(() => import('./pages/admin/IssuesManagement'));
const InventoryManagement = lazy(() => import('./pages/admin/InventoryManagement'));
const SalesAnalytics = lazy(() => import('./pages/admin/SalesAnalytics'));

// Driver Pages
const DriverLogin = lazy(() => import('./pages/driver/DriverLogin'));
const DriverDashboard = lazy(() => import('./pages/driver/DriverDashboard'));

// ============================================
// APP MODE DETECTION
// ============================================
// Determines which version of the app to run based on environment variable
// VITE_APP_MODE can be: 'customer', 'admin', or 'driver'
// Default is 'customer'
const getAppMode = () => {
  const mode = import.meta.env.VITE_APP_MODE;
  if (mode === 'admin') return 'admin';
  if (mode === 'driver') return 'driver';
  return 'customer';
};

const appMode = getAppMode();

// ============================================
// CUSTOMER APP (Default)
// ============================================
// Includes: Product browsing, cart, checkout, order tracking
// NO admin or driver routes accessible
function CustomerApp() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Customer Routes */}
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/tracking/:orderId" element={<OrderTrackingPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/support" element={<SupportPage />} />
            
            {/* 404 - Redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </Suspense>
    </div>
  );
}

// ============================================
// ADMIN APP (Separate Deployment)
// ============================================
// Includes: Admin dashboard, driver management, inventory, analytics
// NO customer routes accessible
function AdminApp() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Admin Public Routes - First admin setup takes priority */}
            <Route path="/" element={<FirstAdminRegister />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/setup" element={<FirstAdminRegister />} />
            
            {/* Admin Protected Routes */}
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/drivers" element={<DriversManagement />} />
            <Route path="/orders" element={<OrdersManagement />} />
            <Route path="/issues" element={<IssuesManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/analytics" element={<SalesAnalytics />} />
            
            {/* 404 - Redirect to admin root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// ============================================
// DRIVER APP (Separate Deployment)
// ============================================
// Includes: Driver dashboard, location tracking, delivery management
// NO customer or admin routes accessible
function DriverApp() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Driver Public Routes */}
            <Route path="/" element={<DriverLogin />} />
            <Route path="/login" element={<DriverLogin />} />
            
            {/* Driver Protected Routes */}
            <Route path="/dashboard" element={<DriverDashboard />} />
            
            {/* 404 - Redirect to driver login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================
// Routes to the correct app based on VITE_APP_MODE environment variable
function App() {
  // Toast configuration shared across all apps
  const toastOptions = {
    duration: 4000,
    style: {
      background: '#1a1a2e',
      color: '#fff',
      border: '1px solid #e94560',
      borderRadius: '8px',
    },
    success: {
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
      duration: 3000,
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
      duration: 4000,
    },
  };

  // Render the appropriate app based on mode
  const renderApp = () => {
    switch (appMode) {
      case 'admin':
        return <AdminApp />;
      case 'driver':
        return <DriverApp />;
      default:
        return <CustomerApp />;
    }
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            {renderApp()}
            <Toaster position="top-right" toastOptions={toastOptions} />
          </OrderProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;