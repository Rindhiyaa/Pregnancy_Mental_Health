import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  // If not authenticated, redirect to signin with the current location
  if (!user || !user.isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Force password reset if first_login is true (except admin and change-password page)
  if (user.first_login && user.role !== 'admin' && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Check for required role if specified
  const userRole = user.role ? user.role.toLowerCase() : '';

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) 
      ? requiredRole.map(r => r.toLowerCase()) 
      : [requiredRole.toLowerCase()];

    // Special case for 'clinician' if it's not already handled by an array
    if (requiredRole === 'clinician') {
      roles.push('doctor', 'nurse');
    }

    if (!roles.includes(userRole)) {
      // Role mismatch redirection
      if (userRole === 'patient') return <Navigate to="/patient/dashboard" replace />;
      if (userRole === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
      if (userRole === 'nurse') return <Navigate to="/nurse/dashboard" replace />;
      if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/signin" replace />;
    }
  }

  // If authenticated and token is valid, render the protected component
  return children;
};

export default ProtectedRoute;