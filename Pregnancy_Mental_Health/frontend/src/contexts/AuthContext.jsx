import { createContext, useContext, useState, useEffect } from 'react';

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

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const email = localStorage.getItem('ppd_user_email');
      const fullName = localStorage.getItem('ppd_user_full_name');
      const role = localStorage.getItem('ppd_user_role');
  
      let storedProfile = null;
      if (email) {
        storedProfile = localStorage.getItem(`ppd_user_profile_${email}`);
      } else {
        storedProfile = localStorage.getItem('ppd_user_profile');
      }
  
      if (storedProfile || fullName || email) {
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
    // clear session-level keys (not per-user profiles)
    localStorage.removeItem('ppd_user_full_name');
    localStorage.removeItem('ppd_user_email');
    localStorage.removeItem('ppd_user_role');
    localStorage.removeItem('assessmentHistory');
  
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
  };  
  

  const logout = () => {
    // Store current user's assessment history before logout
    if (user?.email) {
      const currentHistory = localStorage.getItem('assessmentHistory');
      if (currentHistory) {
        localStorage.setItem(`assessmentHistory_${user.email}`, currentHistory);
      }
    }
    
    // Clear user profile data
    //localStorage.removeItem('ppd_user_profile');
    localStorage.removeItem('ppd_user_full_name');
    localStorage.removeItem('ppd_user_email');
    localStorage.removeItem('ppd_user_role');
    localStorage.removeItem('assessmentHistory');
    
    setUser(null);
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
    isAuthenticated: !!user?.isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};