/**
 * API utility functions with JWT authentication and token refresh
 * Refresh tokens are stored in httpOnly cookies (secure, XSS-protected)
 * Handles multi-tab race conditions with request queuing
 */

// Vite bakes env vars at BUILD TIME, not runtime
// Use .env.production for production URL (committed to Git)
// Use .env.development for local developmentt
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

// Export for use in other components
export { API_BASE_URL };

let isRefreshing = false;
let refreshSubscribers = [];

// Global logout callback - will be set by AuthContext
let globalLogoutCallback = null;
// Global activity callback - will be set by AuthContext for inactivity timer reset
let globalActivityCallback = null;

/**
 * Set the global logout callback (called by AuthContext)
 */
export const setGlobalLogoutCallback = (callback) => {
  globalLogoutCallback = callback;
};

/**
 * Set the global activity callback (called by AuthContext)
 */
export const setGlobalActivityCallback = (callback) => {
  globalActivityCallback = callback;
};

/**
 * Subscribe to token refresh completion
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers when token is refreshed
 */
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

/**
 * Refresh access token using httpOnly cookie
 * Cookie is sent automatically by browser
 */
const refreshAccessToken = async () => {
  try {
    console.log('🔄 Attempting token refresh...');
    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      credentials: 'include',  // Send httpOnly cookie
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔄 Refresh response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Refresh failed:', errorText);
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    console.log('✅ Token refresh successful');
    localStorage.setItem('ppd_access_token', data.access_token);
    return data.access_token;
  } catch (error) {
    // Refresh failed - perform complete logout
    console.log('❌ Token refresh failed, performing complete logout...', error.message);
    
    // Clear localStorage
    localStorage.removeItem('ppd_access_token');
    localStorage.removeItem('ppd_user_email');
    localStorage.removeItem('ppd_user_full_name');
    localStorage.removeItem('ppd_user_role');
    
    // Call global logout callback if available (updates AuthContext)
    if (globalLogoutCallback) {
      globalLogoutCallback();
    }
    
    // Redirect to signin page
    if (!window.location.pathname.includes('/signin')) {
      window.location.href = '/signin';
    }
    
    throw error;
  }
};

/**
 * Get authorization headers with JWT token
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('ppd_access_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Make authenticated API request with automatic token refresh
 * Handles multi-tab race conditions by queuing requests during refresh
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    credentials: 'include',  // Always send cookies (for refresh token)
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };
  
  // Add retry flag to prevent infinite loops
  if (!config._retry) {
    config._retry = false;
  }
  
  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 && !config._retry) {
      console.log('🔑 Got 401, attempting token refresh...');
      // Mark this request as retried
      config._retry = true;
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            // Update authorization header with new token
            config.headers['Authorization'] = `Bearer ${newToken}`;
            // Retry the original request
            fetch(url, config)
              .then(resolve)
              .catch(reject);
          });
        });
      }
      
      // Start refresh process
      isRefreshing = true;
      
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        
        // Notify all queued requests
        onTokenRefreshed(newToken);
        
        // Retry original request with new token
        config.headers['Authorization'] = `Bearer ${newToken}`;
        return await fetch(url, config);
      } catch (refreshError) {
        isRefreshing = false;
        // Notify queued requests of failure
        refreshSubscribers.forEach(callback => callback(null));
        refreshSubscribers = [];
        throw new Error('Session expired. Please login again.');
      }
    }
    
    // Reset inactivity timer on successful API calls
    if (globalActivityCallback && response.ok) {
      globalActivityCallback();
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Convenience methods
 */
export const api = {
  get: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint, data, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  put: (endpoint, data, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
