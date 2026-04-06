
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { setGlobalLogoutCallback, setGlobalActivityCallback } from '../utils/api';
import InactivityWarning from '../components/InactivityWarning';
import { 
  setAuth, clearAuth, 
  getToken, getEmail, getFullName, getRole, 
  getProfileKey, clearLegacyKeys, getRoleFromUrl 
} from '../auth/tokenStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, portalRole = null }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  
  // Use the explicitly provided portalRole or detect from URL as fallback
  const currentPortalRole = portalRole || getRoleFromUrl();

  // 30-minute inactivity timeout
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout

  const logout = useCallback(() => {
    // Clear inactivity timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    
    // Hide warning
    setShowInactivityWarning(false);

    const role = user?.role || currentPortalRole;

    // Store current user's assessment history before logout
    if (user?.email && role) {
      const currentHistory = localStorage.getItem(`assessmentHistory_${role}`);
      if (currentHistory) {
        localStorage.setItem(`assessmentHistory_${role}_${user.email}`, currentHistory);
      }
    }
    
    // ✅ Clear ONLY this role's namespaced keys
    if (role) {
      clearAuth(role);
    }
    
    setUser(null);
  }, [user?.email, user?.role, currentPortalRole]);

  // Inactivity timer management
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    // Hide warning if showing
    setShowInactivityWarning(false);
    
    // Only set timer if user is authenticated
    if (user?.isAuthenticated) {
      // Set warning timer (28 minutes)
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
      }, INACTIVITY_TIMEOUT - WARNING_TIME);
      
      // Set logout timer (30 minutes)
      inactivityTimerRef.current = setTimeout(() => {
        console.log(`🕐 User (${user.role}) inactive for 30 minutes, logging out...`);
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user?.isAuthenticated, user?.role, INACTIVITY_TIMEOUT, WARNING_TIME, logout]);

  const extendSession = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Check if user is logged in on app start
  useEffect(() => {
    clearLegacyKeys(); // Cleanup old flat keys once
    checkAuthStatus();
  }, [currentPortalRole]);

  // Register callbacks with api.js
  useEffect(() => {
    setGlobalLogoutCallback(logout);
    setGlobalActivityCallback(resetInactivityTimer);
  }, [logout, resetInactivityTimer]);

  // Set up activity listeners when user is authenticated
  useEffect(() => {
    if (!user?.isAuthenticated) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      return;
    }

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [user?.isAuthenticated, resetInactivityTimer]);

  const checkAuthStatus = () => {
    try {
      const role = currentPortalRole;
      if (!role) {
        setLoading(false);
        return;
      }

      const token = getToken(role);
      const email = getEmail(role);
      const fullName = getFullName(role);
  
      let storedProfile = null;
      if (email) {
        storedProfile = localStorage.getItem(getProfileKey(role, email));
      }
  
      if ((token && email) || storedProfile || fullName || email) {
        let userProfile = {
          fullName: fullName || 'Clinician',
          email: email || '',
          role: role,
          isAuthenticated: true,
        };
  
        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          userProfile = {
            ...userProfile,
            ...parsedProfile,
            memberSince: parsedProfile.timestamp
              ? new Date(parsedProfile.timestamp).toLocaleDateString()
              : new Date().toLocaleDateString(),
          };
        }
  
        setUser(userProfile);
  
        if (userProfile.email) {
          const userHistory = localStorage.getItem(
            `assessmentHistory_${role}_${userProfile.email}`,
          );
          if (userHistory) {
            localStorage.setItem(`assessmentHistory_${role}`, userHistory);
          }
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

    // ✅ Write to ppd_<role>_access_token, ppd_<role>_user_email, etc.
    setAuth(role, {
      token: userData.access_token,
      email: userData.email,
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
            ...userData,
            ...parsed,
            email: userData.email || parsed.email,
            fullName: parsed.fullName || userData.fullName || "Clinician",
            role: role,
            isAuthenticated: true,
          };
        } catch (e) { console.error("Error parsing stored profile", e); }
      }
      
      // Save profile under role-namespaced key
      localStorage.setItem(profileKey, JSON.stringify(userProfile));
    }

    setUser(userProfile);

    // Restore assessment history for this role+email
    if (userProfile.email) {
      const userHistory = localStorage.getItem(`assessmentHistory_${role}_${userProfile.email}`);
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
      const key = getProfileKey(role, updatedUser.email);
      localStorage.setItem(key, JSON.stringify(updatedUser));
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
