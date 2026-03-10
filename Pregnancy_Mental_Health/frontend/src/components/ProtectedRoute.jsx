import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, logout } = useAuth();
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
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check JWT token expiry client-side for additional security
  try {
    const token = localStorage.getItem('ppd_access_token');
    if (token) {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Convert to seconds
      
      // If token is expired, logout and redirect
      if (decoded.exp < currentTime) {
        console.log('🔑 Access token expired, logging out...');
        logout();
        return <Navigate to="/signin" state={{ from: location }} replace />;
      }
    }
  } catch (error) {
    // If token is malformed, logout and redirect
    console.error('🔑 Invalid token format, logging out...', error);
    logout();
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If authenticated and token is valid, render the protected component
  return children;
};

export default ProtectedRoute;