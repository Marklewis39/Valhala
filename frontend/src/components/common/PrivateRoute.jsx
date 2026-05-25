import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, allowedRoles = null }) => {
  const { user, loading, isAdmin, isCustomer, isDriver, userRole } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Check if user is authenticated
  if (!user) {
    // Redirect based on the route pattern
    if (window.location.pathname.startsWith('/admin')) {
      return <Navigate to="/login" replace />;
    }
    if (window.location.pathname.startsWith('/driver')) {
      return <Navigate to="/driver/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check them
  if (allowedRoles && allowedRoles.length > 0) {
    let hasRequiredRole = false;
    
    if (allowedRoles.includes('admin') && isAdmin) {
      hasRequiredRole = true;
    }
    if (allowedRoles.includes('driver') && isDriver) {
      hasRequiredRole = true;
    }
    if (allowedRoles.includes('customer') && isCustomer) {
      hasRequiredRole = true;
    }
    
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user's actual role
      if (isAdmin) {
        return <Navigate to="/dashboard" replace />;
      }
      if (isDriver) {
        return <Navigate to="/driver/dashboard" replace />;
      }
      return <Navigate to="/products" replace />;
    }
  }

  return children;
};

export default PrivateRoute;