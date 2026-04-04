/**
 * API utility functions with JWT authentication and token refresh
 * Refresh tokens are stored in httpOnly cookies (secure, XSS-protected)
 * Handles multi-tab race conditions with request queuing
 */

// Vite bakes env vars at BUILD TIME, not runtime
// Use .env.production for production URL (committed to Git)
// Use .env.development for local developmentt
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';


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
    console.log(' Attempting token refresh...');
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
      console.log(' Refresh failed:', errorText);
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    console.log('Token refresh successful');
    localStorage.setItem('ppd_access_token', data.access_token);
    return data.access_token;
  } catch (error) {
    // Refresh failed - perform complete logout
    console.log(' Token refresh failed, performing complete logout...', error.message);

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
    // EXCLUDE login and refresh endpoints from auto-refresh logic
    const isAuthEndpoint = endpoint.includes('/login') || endpoint.includes('/refresh');

    if (response.status === 401 && !config._retry && !isAuthEndpoint) {
      console.log('🔑 Got 401, attempting token refresh...');
      // Mark this request as retried
      config._retry = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) {
              return reject(new Error('Session expired. Please login again.'));
            }
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
      } catch {
        isRefreshing = false;
        // Notify queued requests of failure
        refreshSubscribers.forEach(callback => callback(null));
        refreshSubscribers = [];
        throw new Error('Session expired. Please login again.');
      }
    }

    // Handle 403 Forbidden - specifically for first-time login
    if (response.status === 403) {
      const clonedRes = response.clone();
      try {
        const errorData = await clonedRes.json();
        if (errorData.detail && errorData.detail.includes("First-time login")) {
          console.warn("🛡️ Security: First-time login detected. Redirecting to password change.");
          // Clear all local session data to ensure Navbar/AuthContext sync
          localStorage.removeItem('ppd_access_token');
          localStorage.removeItem('ppd_user_email');
          localStorage.removeItem('ppd_user_role');
          localStorage.removeItem('ppd_user_full_name');
          
          window.location.href = '/signin?error=first_login';
          return response;
        }
      } catch {
        // Not JSON or other error, proceed as normal
      }
    }

    // Reset inactivity timer on successful API calls
    if (globalActivityCallback && response.ok) {
      globalActivityCallback();
    }

    return response;
  } catch (error) {
    const networkMessage =
      error instanceof TypeError ||
      /Failed to fetch|NetworkError when attempting to fetch resource/i.test(error?.message)
        ? 'Network error. Please check your connection and try again.'
        : error?.message || 'API request failed.';

    console.error('API request failed:', error);
    throw new Error(networkMessage);
  }
};

/**
 * Convenience methods
 */
/**
 * Convenience methods
 */
/**
 * Convenience methods with better error handling
 */
export const api = {
  get: async (endpoint, options = {}) => {
    const response = await apiRequest(endpoint, { ...options, method: 'GET' });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, response };
    }
    
    return { data: null, response };
  },

  post: async (endpoint, bodyData, options = {}) => {
    const response = await apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(bodyData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    // 204 No Content
    if (response.status === 204) {
      return { data: null, response };
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, response };
    }
    
    return { data: null, response };
  },

  put: async (endpoint, bodyData, options = {}) => {
    const response = await apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(bodyData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    if (response.status === 204) {
      return { data: null, response };
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, response };
    }
    
    return { data: null, response };
  },

  patch: async (endpoint, bodyData, options = {}) => {
    const response = await apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(bodyData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    if (response.status === 204) {
      return { data: null, response };
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, response };
    }
    
    return { data: null, response };
  },

  delete: async (endpoint, options = {}) => {
    const response = await apiRequest(endpoint, { ...options, method: 'DELETE' });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    if (response.status === 204) {
      return { data: null, response };
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data, response };
    }
    
    return { data: null, response };
  },
};

// export const addAuditLog = async (action, details, ip = null) => {
//   const body = { action, details, ip_address: ip };
//   const res = await api.post("/admin/audit-logs", body);
//   if (!res.ok) {
//     console.error("Failed to add audit log");
//   }
//   return res;
// };

// user API helpers
export const getUsers = () => api.get("/admin/users");

export const addUser = (data) => api.post("/admin/users", data);

export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);

export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

export const getErrorMessage = (err, defaultMsg) => {
  if (!err) return defaultMsg || "An unexpected error occurred";
  
  // Handle string errors (common for thrown strings)
  if (typeof err === 'string') return err;

  // If the error message is a JSON string (our api utility throws these)
  if (err.message && typeof err.message === 'string') {
    try {
      const errorData = JSON.parse(err.message);
      
      // Handle FastAPI "detail" field
      if (errorData.detail) {
        // detail can be a string or an array of objects (422 validation errors)
        if (typeof errorData.detail === 'string') {
          return errorData.detail;
        }
        
        if (Array.isArray(errorData.detail)) {
          // Format validation errors: "field: message"
          return errorData.detail
            .map(e => `${e.loc ? e.loc[e.loc.length - 1] : 'Error'}: ${e.msg}`)
            .join(', ');
        }
        
        if (typeof errorData.detail === 'object') {
          return JSON.stringify(errorData.detail);
        }
      }
    } catch {
      // Not JSON, return the raw message
      return err.message;
    }
  }

  // Handle standard Error objects or custom objects with 'detail'
  if (err.detail) {
    if (typeof err.detail === 'string') return err.detail;
    if (Array.isArray(err.detail)) return err.detail.map(e => e.msg).join(', ');
    return JSON.stringify(err.detail);
  }

  return defaultMsg || err.message || "An unexpected error occurred";
};

export const addAuditLog = async (action, details) => {
  let ip = null;
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    ip = data.ip;
  } catch (error) {
    console.error("Failed to get IP address:", error);
  }

  try {
    const { response } = await api.post("/admin/audit-logs", { action, details, ip_address: ip });
    
    if (!response.ok) {
      console.error("Failed to add audit log", response.status);
    }
    return { response };
  } catch (error) {
    console.error("Failed to add audit log", error.message);
    return { error };
  }
};