import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { USE_DUMMY_DATA } from '../utils/dummyData';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  // Handle logout as a side effect to avoid "update during render" warning
  useEffect(() => {
    if (loading || !user) return;

    const token = localStorage.getItem('ppd_access_token');
    if (!token) return;

    // Bypass strict JWT decoding for dummy data
    if (USE_DUMMY_DATA && token.startsWith('mock-')) {
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        console.log('🔑 Access token expired, logging out...');
        logout();
      }
    } catch (error) {
      console.error('🔑 Invalid token format, logging out...', error);
      logout();
    }
  }, [user, loading, logout]);

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

  // Force password reset if first_login is true (except when already on the change-password page)
  if (user.first_login && location.pathname !== "/change-password") {
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