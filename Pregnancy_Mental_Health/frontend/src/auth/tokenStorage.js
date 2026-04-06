
// src/auth/tokenStorage.js
// Namespaced localStorage utility — one key-set per portal role.
// Replaces all direct localStorage.setItem("ppd_access_token", ...) calls.

const KEYS = {
  admin:   {
    token:    "ppd_admin_access_token",
    email:    "ppd_admin_user_email",
    role:     "ppd_admin_user_role",
    fullName: "ppd_admin_user_full_name",
    reset:    "ppd_admin_reset_code",
  },
  doctor:  {
    token:    "ppd_doctor_access_token",
    email:    "ppd_doctor_user_email",
    role:     "ppd_doctor_user_role",
    fullName: "ppd_doctor_user_full_name",
    reset:    "ppd_doctor_reset_code",
  },
  nurse:   {
    token:    "ppd_nurse_access_token",
    email:    "ppd_nurse_user_email",
    role:     "ppd_nurse_user_role",
    fullName: "ppd_nurse_user_full_name",
    reset:    "ppd_nurse_reset_code",
  },
  patient: {
    token:    "ppd_patient_access_token",
    email:    "ppd_patient_user_email",
    role:     "ppd_patient_user_role",
    fullName: "ppd_patient_user_full_name",
    reset:    "ppd_patient_reset_code",
  },
};

// ─── Helpers ──────────────────────────────────────────────────

/** 
 * Derive role from URL (HashRouter compatible) 
 * Used primarily in api.js where AuthContext is not available.
 */
export function getRoleFromUrl() {
  const hash = window.location.hash; // e.g. "#/admin/dashboard"
  if (hash.includes("/admin"))   return "admin";
  if (hash.includes("/doctor"))  return "doctor";
  if (hash.includes("/nurse"))   return "nurse";
  if (hash.includes("/patient")) return "patient";
  
  // Fallback to role stored in global session if on common pages
  return localStorage.getItem('ppd_user_role')?.toLowerCase() || null;
}

// ─── Token ────────────────────────────────────────────────────
export const setToken   = (role, val) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].token, val);
};

export const getToken   = (role)      => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].token);
};

export const clearToken = (role)      => {
  if (!role || !KEYS[role]) return;
  localStorage.removeItem(KEYS[role].token);
};

// ─── User Fields ──────────────────────────────────────────────
export const setEmail    = (role, v) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].email, v);
};

export const getEmail    = (role)    => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].email);
};

export const setRole     = (role, v) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].role, v);
};

export const getRole     = (role)    => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].role);
};

export const setFullName = (role, v) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].fullName, v);
};

export const getFullName = (role)    => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].fullName);
};

// ─── Profile Cache (email-scoped) ─────────────────────────────
export const getProfileKey = (role, email) => 
  email ? `ppd_${role}_profile_${email}` : `ppd_${role}_profile`;

// ─── Reset Code ───────────────────────────────────────────────
export const setResetCode   = (role, code) => {
  if (!role || !KEYS[role]) return;
  localStorage.setItem(KEYS[role].reset, code);
};

export const getResetCode   = (role)       => {
  if (!role || !KEYS[role]) return null;
  return localStorage.getItem(KEYS[role].reset);
};

export const clearResetCode = (role)       => {
  if (!role || !KEYS[role]) return;
  localStorage.removeItem(KEYS[role].reset);
};

// ─── Full Auth Write (used in login) ─────────────────────────
export function setAuth(role, { token, email, fullName }) {
  if (!role || !KEYS[role]) return;
  setToken(role, token);
  setEmail(role, email);
  setRole(role, role);
  setFullName(role, fullName);
}

/** Clear ONLY this portal's keys — other portals unaffected */
export function clearAuth(role) {
  if (!role || !KEYS[role]) return;
  Object.values(KEYS[role]).forEach(k => localStorage.removeItem(k));
}

// ─── Legacy key cleanup (run once on first load) ──────────────
export function clearLegacyKeys() {
  ["ppd_access_token","ppd_user_email","ppd_user_role","ppd_user_full_name"]
    .forEach(k => localStorage.removeItem(k));
}
