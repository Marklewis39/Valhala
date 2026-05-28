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
function CustomerApp() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/tracking/:orderId" element={<OrderTrackingPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </Suspense>
    </div>
  );
}

// ============================================
// ADMIN APP - Simplified (No FirstAdminRegister)
// ============================================
function AdminApp() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AdminLogin />} />
            
            {/* Admin Protected Routes */}
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/drivers" element={<DriversManagement />} />
            <Route path="/orders" element={<OrdersManagement />} />
            <Route path="/issues" element={<IssuesManagement />} />
            <Route path="/inventory" element={<InventoryManagement />} />
            <Route path="/analytics" element={<SalesAnalytics />} />
            
            {/* 404 - Redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// ============================================
// DRIVER APP
// ============================================
function DriverApp() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            <Route path="/" element={<DriverLogin />} />
            <Route path="/login" element={<DriverLogin />} />
            <Route path="/dashboard" element={<DriverDashboard />} />
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
function App() {
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