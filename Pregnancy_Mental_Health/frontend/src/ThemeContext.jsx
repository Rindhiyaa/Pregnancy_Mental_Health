import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LIGHT_THEME, DARK_THEME } from "./theme";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const saved = localStorage.getItem("ppd_dark_mode");
    return saved === "true";
  });

  // Check if we are in a portal or a marketing page
  const path = location.pathname;
  const isPortal = path.startsWith("/patient") || 
                   path.startsWith("/nurse") || 
                   path.startsWith("/doctor") || 
                   path.startsWith("/admin");

  const effectiveDarkMode = isDarkMode && isPortal;
  const theme = effectiveDarkMode ? DARK_THEME : LIGHT_THEME;

  useEffect(() => {
    localStorage.setItem("ppd_dark_mode", isDarkMode);
    
    // Apply background color to body to prevent white flashes
    document.body.style.backgroundColor = theme.pageBg;
    document.body.style.color = theme.textPrimary;
    document.body.style.transition = "background-color 0.3s, color 0.3s";
    
    if (effectiveDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, theme, effectiveDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
