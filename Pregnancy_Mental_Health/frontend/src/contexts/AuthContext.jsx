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
      const storedProfile = localStorage.getItem('ppd_user_profile');
      const fullName = localStorage.getItem('ppd_user_full_name');
      const email = localStorage.getItem('ppd_user_email');
      const role = localStorage.getItem('ppd_user_role');

      if (storedProfile || fullName || email) {
        let userProfile = {
          fullName: fullName || 'Clinician',
          email: email || '',
          role: role || '',
          isAuthenticated: true
        };

        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          userProfile = {
            ...userProfile,
            fullName: parsedProfile.fullName || fullName || 'Clinician',
            firstName: parsedProfile.firstName || '',
            lastName: parsedProfile.lastName || '',
            email: parsedProfile.email || email || '',
            phone: parsedProfile.phone || '',
            role: parsedProfile.role || role || '',
            department: parsedProfile.department || '',
            memberSince: parsedProfile.timestamp ? new Date(parsedProfile.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
            isAuthenticated: true
          };
        }

        setUser(userProfile);
        
        // Restore user's specific assessment history
        if (userProfile.email) {
          const userHistory = localStorage.getItem(`assessmentHistory_${userProfile.email}`);
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
    // Clear any existing data first
    localStorage.removeItem('ppd_user_profile');
    localStorage.removeItem('ppd_user_full_name');
    localStorage.removeItem('ppd_user_email');
    localStorage.removeItem('ppd_user_role');
    
    const userProfile = {
      ...userData,
      isAuthenticated: true
    };
    setUser(userProfile);
    
    // Store fresh data in localStorage
    localStorage.setItem('ppd_user_profile', JSON.stringify(userProfile));
    localStorage.setItem('ppd_user_full_name', userProfile.fullName);
    localStorage.setItem('ppd_user_email', userProfile.email);
    localStorage.setItem('ppd_user_role', userProfile.role);
    
    // Restore user's specific assessment history
    if (userProfile.email) {
      const userHistory = localStorage.getItem(`assessmentHistory_${userProfile.email}`);
      if (userHistory) {
        localStorage.setItem('assessmentHistory', userHistory);
      } else {
        // If no history exists for this user, clear any existing history
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
    localStorage.removeItem('ppd_user_profile');
    localStorage.removeItem('ppd_user_full_name');
    localStorage.removeItem('ppd_user_email');
    localStorage.removeItem('ppd_user_role');
    localStorage.removeItem('assessmentHistory');
    
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const updatedUser = {
      ...user,
      ...updatedData
    };
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('ppd_user_profile', JSON.stringify(updatedUser));
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