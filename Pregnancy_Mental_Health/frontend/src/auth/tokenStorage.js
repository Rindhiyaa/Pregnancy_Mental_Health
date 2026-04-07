// src/auth/tokenStorage.js
// Namespaced localStorage utility — one key-set per portal role.

const KEYS = {
  admin:   {
    token:    "ppd_admin_access_token",
    refresh:  "ppd_admin_refresh_token",
    email:    "ppd_admin_user_email",
    role:     "ppd_admin_user_role",
    fullName: "ppd_admin_user_full_name",
    reset:    "ppd_admin_reset_code",
  },
  doctor:  {
    token:    "ppd_doctor_access_token",
    refresh:  "ppd_doctor_refresh_token",
    email:    "ppd_doctor_user_email",
    role:     "ppd_doctor_user_role",
    fullName: "ppd_doctor_user_full_name",
    reset:    "ppd_doctor_reset_code",
  },
  nurse:   {
    token:    "ppd_nurse_access_token",
    refresh:  "ppd_nurse_refresh_token",
    email:    "ppd_nurse_user_email",
    role:     "ppd_nurse_user_role",
    fullName: "ppd_nurse_user_full_name",
    reset:    "ppd_nurse_reset_code",
  },
  patient: {
    token:    "ppd_patient_access_token",
    refresh:  "ppd_patient_refresh_token",
    email:    "ppd_patient_user_email",
    role:     "ppd_patient_user_role",
    fullName: "ppd_patient_user_full_name",
    reset:    "ppd_patient_reset_code",
  },
};

export function getRoleFromUrl() {
  const hash = window.location.hash;
  if (hash.includes("/admin"))   { setTabRole("admin");   return "admin"; }
  if (hash.includes("/doctor"))  { setTabRole("doctor");  return "doctor"; }
  if (hash.includes("/nurse"))   { setTabRole("nurse");   return "nurse"; }
  if (hash.includes("/patient")) { setTabRole("patient"); return "patient"; }
  return getTabRole() || localStorage.getItem('ppd_user_role')?.toLowerCase() || null;
}

export const setTabRole = (role) => {
  if (role) sessionStorage.setItem('ppd_tab_active_role', role);
};

export const getTabRole = () => sessionStorage.getItem('ppd_tab_active_role');

// ─── Access Token ─────────────────────────────────────────────
export const setToken = (role, val) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].token, val);
};
export const getToken = (role) => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].token);
};
export const clearToken = (role) => {
  if (!role || !KEYS[role]) return;
  localStorage.removeItem(KEYS[role].token);
};

// ─── Refresh Token ────────────────────────────────────────────
export const setRefreshToken = (role, val) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].refresh, val);
};
export const getRefreshToken = (role) => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].refresh);
};
export const clearRefreshToken = (role) => {
  if (!role || !KEYS[role]) return;
  localStorage.removeItem(KEYS[role].refresh);
};

// ─── User Fields ──────────────────────────────────────────────
export const setEmail = (role, v) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].email, v);
};
export const getEmail = (role) => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].email);
};
export const setRole = (role, v) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].role, v);
};
export const getRole = (role) => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].role);
};
export const setFullName = (role, v) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].fullName, v);
};
export const getFullName = (role) => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].fullName);
};

// ─── Profile Cache ────────────────────────────────────────────
export const getProfileKey = (role, email) =>
  email ? `ppd_${role}_profile_${email}` : `ppd_${role}_profile`;

// ─── Reset Code ───────────────────────────────────────────────
export const setResetCode = (role, code) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].reset, code);
};
export const getResetCode = (role) => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].reset);
};
export const clearResetCode = (role) => {
  if (!role || !KEYS[role]) return;
  localStorage.removeItem(KEYS[role].reset);
};

// ─── Full Auth Write ──────────────────────────────────────────
export function setAuth(role, { token, refresh, email, fullName }) {
  if (!role || !KEYS[role]) return;
  setToken(role, token);
  if (refresh) setRefreshToken(role, refresh);
  setEmail(role, email);
  setRole(role, role);
  setFullName(role, fullName);
}

export function clearAuth(role) {
  if (!role || !KEYS[role]) return;
  Object.values(KEYS[role]).forEach(k => localStorage.removeItem(k));
}

// ─── Legacy Cleanup ───────────────────────────────────────────
export function clearLegacyKeys() {
  ["ppd_access_token", "ppd_user_email", "ppd_user_role", "ppd_user_full_name"]
    .forEach(k => localStorage.removeItem(k));
}