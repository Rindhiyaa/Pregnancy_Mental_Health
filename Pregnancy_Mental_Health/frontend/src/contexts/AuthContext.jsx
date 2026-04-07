import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { setGlobalLogoutCallback, setGlobalActivityCallback } from '../utils/api';
import InactivityWarning from '../components/InactivityWarning';
import {
  setAuth, clearAuth,
  getToken, getEmail, getFullName,
  getProfileKey, clearLegacyKeys, getRoleFromUrl, setTabRole,
  setRefreshToken,
} from '../auth/tokenStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children, portalRole = null }) => {
  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const inactivityTimerRef                    = useRef(null);
  const warningTimerRef                       = useRef(null);

  const currentPortalRole = portalRole || getRoleFromUrl();

  const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
  const WARNING_TIME       =  2 * 60 * 1000;

  const logout = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current)    clearTimeout(warningTimerRef.current);
    setShowInactivityWarning(false);

    const role = user?.role || currentPortalRole;

    if (user?.email && role) {
      const currentHistory = localStorage.getItem(`assessmentHistory_${role}`);
      if (currentHistory) {
        localStorage.setItem(`assessmentHistory_${role}_${user.email}`, currentHistory);
      }
    }

    if (role) clearAuth(role);
    setUser(null);
  }, [user?.email, user?.role, currentPortalRole]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current)    clearTimeout(warningTimerRef.current);
    setShowInactivityWarning(false);

    if (user?.isAuthenticated) {
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      inactivityTimerRef.current = setTimeout(() => {
        console.log(`🕐 User (${user.role}) inactive for 30 min, logging out...`);
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user?.isAuthenticated, user?.role, INACTIVITY_TIMEOUT, WARNING_TIME, logout]);

  const extendSession = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    clearLegacyKeys();
    checkAuthStatus();
  }, [currentPortalRole]);

  useEffect(() => {
    setGlobalLogoutCallback(logout);
    setGlobalActivityCallback(resetInactivityTimer);
  }, [logout, resetInactivityTimer]);

  useEffect(() => {
    if (!user?.isAuthenticated) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current)    clearTimeout(warningTimerRef.current);
      return;
    }

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current)    clearTimeout(warningTimerRef.current);
    };
  }, [user?.isAuthenticated, resetInactivityTimer]);

  const checkAuthStatus = () => {
    try {
      const role = currentPortalRole;
      if (!role) { setLoading(false); return; }

      const token    = getToken(role);
      const email    = getEmail(role);
      const fullName = getFullName(role);

      let storedProfile = null;
      if (email) {
        storedProfile = localStorage.getItem(getProfileKey(role, email));
      }

      if (token && email || storedProfile || fullName || email) {
        let userProfile = {
          fullName: fullName || 'Clinician',
          email:    email || '',
          role,
          isAuthenticated: true,
        };

        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          userProfile = {
            ...userProfile,
            ...parsed,
            memberSince: parsed.timestamp
              ? new Date(parsed.timestamp).toLocaleDateString()
              : new Date().toLocaleDateString(),
          };
        }

        setUser(userProfile);

        if (userProfile.email) {
          const userHistory = localStorage.getItem(
            `assessmentHistory_${role}_${userProfile.email}`
          );
          if (userHistory) localStorage.setItem(`assessmentHistory_${role}`, userHistory);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    const role = userData.role?.toLowerCase();
    if (!role) return;

    setTabRole(role);

    // ✅ Save access + refresh tokens (namespaced)
    setAuth(role, {
      token:    userData.access_token,
      refresh:  userData.refresh_token,   // ← NEW
      email:    userData.email,
      fullName: userData.fullName,
    });

    let userProfile = { ...userData, isAuthenticated: true };

    if (userData.email) {
      const profileKey = getProfileKey(role, userData.email);
      const stored = localStorage.getItem(profileKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          userProfile = {
            ...parsed,
            ...userData,
            email:    userData.email    || parsed.email,
            fullName: userData.fullName || parsed.fullName || "Clinician",
            role,
            isAuthenticated: true,
          };
        } catch (e) { console.error("Error parsing stored profile", e); }
      }
      localStorage.setItem(profileKey, JSON.stringify(userProfile));
    }

    setUser(userProfile);

    if (userProfile.email) {
      const userHistory = localStorage.getItem(
        `assessmentHistory_${role}_${userProfile.email}`
      );
      if (userHistory) {
        localStorage.setItem(`assessmentHistory_${role}`, userHistory);
      } else {
        localStorage.removeItem(`assessmentHistory_${role}`);
      }
    }

    resetInactivityTimer();
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData, isAuthenticated: true };
    setUser(updatedUser);
    const role = updatedUser.role;
    if (role) {
      localStorage.setItem(getProfileKey(role, updatedUser.email), JSON.stringify(updatedUser));
    }
  };

  const value = {
    user, login, logout, updateUser, loading,
    isAuthenticated: !!user?.isAuthenticated,
    showInactivityWarning, extendSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <InactivityWarning
        show={showInactivityWarning}
        onExtendSession={extendSession}
        onLogout={logout}
        timeRemaining={120}
      />
    </AuthContext.Provider>
  );
};