import {
  getToken, setToken, clearAuth, getRoleFromUrl,
  getRefreshToken, setRefreshToken,               // ← NEW
} from '../auth/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
export { API_BASE_URL };

let isRefreshing = false;
let refreshSubscribers = [];

let globalLogoutCallback   = null;
let globalActivityCallback = null;

export const setGlobalLogoutCallback   = (cb) => { globalLogoutCallback   = cb; };
export const setGlobalActivityCallback = (cb) => { globalActivityCallback = cb; };

const subscribeTokenRefresh = (cb) => { refreshSubscribers.push(cb); };
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
};

const refreshAccessToken = async () => {
  try {
    console.log(' Attempting token refresh...');

    const role         = getRoleFromUrl();
    const refreshToken = role ? getRefreshToken(role) : null;

    // ✅ Try namespaced localStorage refresh token first
    if (refreshToken) {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      console.log('🔄 Refresh response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        if (role) {
          setToken(role, data.access_token);
          if (data.refresh_token) setRefreshToken(role, data.refresh_token);
        }
        console.log('Token refresh successful');
        return data.access_token;
      }
    }

    // ✅ Fallback: cookie-based refresh (httpOnly)
    const cookieResponse = await fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('🔄 Cookie refresh response status:', cookieResponse.status);

    if (!cookieResponse.ok) {
      const errorText = await cookieResponse.text();
      console.log(' Refresh failed:', errorText);
      throw new Error('Token refresh failed');
    }

    const data = await cookieResponse.json();
    if (role) {
      setToken(role, data.access_token);
      if (data.refresh_token) setRefreshToken(role, data.refresh_token);
    }
    return data.access_token;

  } catch (error) {
    console.log(' Token refresh failed, performing complete logout...', error.message);

    const failedRole = getRoleFromUrl();
    if (failedRole) clearAuth(failedRole);
    if (globalLogoutCallback) globalLogoutCallback();

    if (!window.location.hash.includes('/signin')) {
      window.location.href = '/#/signin';
    }

    throw error;
  }
};

export const getAuthHeaders = () => {
  const role  = getRoleFromUrl();
  const token = role ? getToken(role) : null;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const apiRequest = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    credentials: 'include',
    headers: { ...getAuthHeaders(), ...options.headers },
  };

  if (!config._retry) config._retry = false;

  try {
    const response = await fetch(url, config);

    const isAuthEndpoint = endpoint.includes('/login') || endpoint.includes('/refresh');

    if (response.status === 401 && !config._retry && !isAuthEndpoint) {
      console.log('🔑 Got 401, attempting token refresh...');
      config._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) return reject(new Error('Session expired. Please login again.'));
            config.headers['Authorization'] = `Bearer ${newToken}`;
            fetch(url, config).then(resolve).catch(reject);
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing   = false;
        onTokenRefreshed(newToken);
        config.headers['Authorization'] = `Bearer ${newToken}`;
        return await fetch(url, config);
      } catch {
        isRefreshing = false;
        refreshSubscribers.forEach(cb => cb(null));
        refreshSubscribers = [];
        throw new Error('Session expired. Please login again.');
      }
    }

    if (response.status === 403) {
      const clonedRes = response.clone();
      try {
        const errorData = await clonedRes.json();
        if (errorData.detail && errorData.detail.includes("First-time login")) {
          console.warn("🛡️ First-time login detected. Redirecting to password change.");
          ["ppd_access_token","ppd_user_email","ppd_user_role","ppd_user_full_name"]
            .forEach(k => localStorage.removeItem(k));
          window.location.href = '/signin?error=first_login';
          return response;
        }
      } catch { /* Not JSON */ }
    }

    if (globalActivityCallback && response.ok) globalActivityCallback();

    return response;
  } catch (error) {
    const networkMessage =
      error instanceof TypeError ||
      /Failed to fetch|NetworkError/i.test(error?.message)
        ? 'Network error. Please check your connection and try again.'
        : error?.message || 'API request failed.';
    console.error('API request failed:', error);
    throw new Error(networkMessage);
  }
};

export const api = {
  get: async (endpoint, options = {}) => {
    const response = await apiRequest(endpoint, { ...options, method: 'GET' });
    if (!response.ok) { const t = await response.text(); throw new Error(t || `HTTP ${response.status}`); }
    const ct = response.headers.get('content-type');
    if (ct && ct.includes('application/json')) return { data: await response.json(), response };
    return { data: null, response };
  },

  post: async (endpoint, bodyData, options = {}) => {
    const response = await apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(bodyData) });
    if (!response.ok) { const t = await response.text(); throw new Error(t || `HTTP ${response.status}`); }
    if (response.status === 204) return { data: null, response };
    const ct = response.headers.get('content-type');
    if (ct && ct.includes('application/json')) return { data: await response.json(), response };
    return { data: null, response };
  },

  put: async (endpoint, bodyData, options = {}) => {
    const response = await apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(bodyData) });
    if (!response.ok) { const t = await response.text(); throw new Error(t || `HTTP ${response.status}`); }
    if (response.status === 204) return { data: null, response };
    const ct = response.headers.get('content-type');
    if (ct && ct.includes('application/json')) return { data: await response.json(), response };
    return { data: null, response };
  },

  patch: async (endpoint, bodyData, options = {}) => {
    const response = await apiRequest(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(bodyData) });
    if (!response.ok) { const t = await response.text(); throw new Error(t || `HTTP ${response.status}`); }
    if (response.status === 204) return { data: null, response };
    const ct = response.headers.get('content-type');
    if (ct && ct.includes('application/json')) return { data: await response.json(), response };
    return { data: null, response };
  },

  delete: async (endpoint, options = {}) => {
    const response = await apiRequest(endpoint, { ...options, method: 'DELETE' });
    if (!response.ok) { const t = await response.text(); throw new Error(t || `HTTP ${response.status}`); }
    if (response.status === 204) return { data: null, response };
    const ct = response.headers.get('content-type');
    if (ct && ct.includes('application/json')) return { data: await response.json(), response };
    return { data: null, response };
  },
};

export const getUsers    = ()         => api.get("/admin/users");
export const addUser     = (data)     => api.post("/admin/users", data);
export const updateUser  = (id, data) => api.put(`/admin/users/${id}`, data);
export const deleteUser  = (id)       => api.delete(`/admin/users/${id}`);

export const getErrorMessage = (err, defaultMsg) => {
  if (!err) return defaultMsg || "An unexpected error occurred";
  if (typeof err === 'string') return err;
  if (err.message) {
    try {
      const errorData = JSON.parse(err.message);
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') return errorData.detail;
        if (Array.isArray(errorData.detail))
          return errorData.detail.map(e => `${e.loc?.[e.loc.length-1] || 'Error'}: ${e.msg}`).join(', ');
        return JSON.stringify(errorData.detail);
      }
    } catch { return err.message; }
  }
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
    const res  = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    ip = data.ip;
  } catch (e) { console.error("Failed to get IP:", e); }

  try {
    const { response } = await api.post("/admin/audit-logs", { action, details, ip_address: ip });
    if (!response.ok) console.error("Failed to add audit log", response.status);
    return { response };
  } catch (error) {
    console.error("Failed to add audit log", error.message);
    return { error };
  }
};