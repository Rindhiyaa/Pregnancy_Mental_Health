import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { setGlobalLogoutCallback, setGlobalActivityCallback } from '../utils/api';
import InactivityWarning from '../components/InactivityWarning';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  
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

    // Store current user's assessment history before logout
    if (user?.email) {
      const currentHistory = localStorage.getItem('assessmentHistory');
      if (currentHistory) {
        localStorage.setItem(`assessmentHistory_${user.email}`, currentHistory);
      }
    }
    
    // Clear JWT access token (refresh token in httpOnly cookie cleared by backend)
    localStorage.removeItem('ppd_access_token');
    
    // Clear user profile data
    //localStorage.removeItem('ppd_user_profile');
    localStorage.removeItem('ppd_user_full_name');
    localStorage.removeItem('ppd_user_email');
    localStorage.removeItem('ppd_user_role');
    localStorage.removeItem('assessmentHistory');
    
    setUser(null);
  }, [user?.email]);

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
        console.log('🕐 User inactive for 30 minutes, logging out...');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user?.isAuthenticated, INACTIVITY_TIMEOUT, WARNING_TIME, logout]);

  const extendSession = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Register callbacks with api.js
  useEffect(() => {
    setGlobalLogoutCallback(logout);
    setGlobalActivityCallback(resetInactivityTimer); // Re-enabled
  }, [logout, resetInactivityTimer]); // Re-register when callbacks change

  // Set up activity listeners when user is authenticated
  useEffect(() => {
    if (!user?.isAuthenticated) {
      // Clear timer if user is not authenticated
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

    // Activity events to track
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Start the timer
    resetInactivityTimer();

    // Cleanup function
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
  }, [user?.isAuthenticated, resetInactivityTimer]); // Only depend on authentication status and stable callback

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('ppd_access_token');
      const email = localStorage.getItem('ppd_user_email');
      const fullName = localStorage.getItem('ppd_user_full_name');
      const role = localStorage.getItem('ppd_user_role');
  
      let storedProfile = null;
      if (email) {
        storedProfile = localStorage.getItem(`ppd_user_profile_${email}`);
      } else {
        storedProfile = localStorage.getItem('ppd_user_profile');
      }
  
      if ((token && email) || storedProfile || fullName || email) {
        let userProfile = {
          fullName: fullName || 'Clinician',
          email: email || '',
          role: role || '',
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
            `assessmentHistory_${userProfile.email}`,
          );
          if (userHistory) {
            localStorage.setItem('assessmentHistory', userHistory);
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
    // Store core identity in session storage to ensure availability across refresh
    if (userData.access_token) {
      localStorage.setItem('ppd_access_token', userData.access_token);
    }
    if (userData.email) {
      localStorage.setItem('ppd_user_email', userData.email);
    }
    if (userData.role) {
      localStorage.setItem('ppd_user_role', userData.role);
    }
    if (userData.fullName) {
      localStorage.setItem('ppd_user_full_name', userData.fullName);
    }
  
    let userProfile = {
      ...userData,
      isAuthenticated: true,
    };
  
    if (userData.email) {
      const key = `ppd_user_profile_${userData.email}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
      
          // Prefer non-empty stored values; only take backend values when they exist
          userProfile = {
            ...userData,
            ...parsed,
            // ensure core identity from backend
            email: userData.email || parsed.email,
            fullName: parsed.fullName || userData.fullName || "Clinician",
            role: parsed.role || userData.role || "",
            firstName: parsed.firstName || userData.firstName || "",
            lastName: parsed.lastName || userData.lastName || "",
            phone: parsed.phone || userData.phone || "",
            department: parsed.department || userData.department || "",
            memberSince:
              parsed.memberSince ||
              parsed.timestamp
                ? new Date(parsed.timestamp).toLocaleDateString()
                : userData.memberSince || new Date().toLocaleDateString(), 
            isAuthenticated: true,
          };
        } catch (e) {
          console.error("Error parsing stored profile", e);
        }
      }
      
    }
  
    setUser(userProfile);
  
    const baseKey = userProfile.email
      ? `ppd_user_profile_${userProfile.email}`
      : 'ppd_user_profile';
    localStorage.setItem(baseKey, JSON.stringify(userProfile));
    localStorage.setItem('ppd_user_full_name', userProfile.fullName);
    localStorage.setItem('ppd_user_email', userProfile.email);
    localStorage.setItem('ppd_user_role', userProfile.role);
  
    if (userProfile.email) {
      const userHistory = localStorage.getItem(
        `assessmentHistory_${userProfile.email}`
      );
      if (userHistory) {
        localStorage.setItem('assessmentHistory', userHistory);
      } else {
        localStorage.removeItem('assessmentHistory');
      }
    }

    // Reset inactivity timer after successful login
    resetInactivityTimer();
  };  
  

  const updateUser = (updatedData) => {
    const updatedUser = {
      ...user,
      ...updatedData,
      isAuthenticated: true,
    };
    setUser(updatedUser);
  
    const key = updatedUser.email
      ? `ppd_user_profile_${updatedUser.email}`
      : 'ppd_user_profile';
  
    localStorage.setItem(key, JSON.stringify(updatedUser));
    localStorage.setItem('ppd_user_full_name', updatedUser.fullName);
    localStorage.setItem('ppd_user_email', updatedUser.email);
    localStorage.setItem('ppd_user_role', updatedUser.role);
  };  


  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user?.isAuthenticated,
    showInactivityWarning,
    extendSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <InactivityWarning
        show={showInactivityWarning}
        onExtendSession={extendSession}
        onLogout={logout}
        timeRemaining={120} // 2 minutes in seconds
      />
    </AuthContext.Provider>
  );
};