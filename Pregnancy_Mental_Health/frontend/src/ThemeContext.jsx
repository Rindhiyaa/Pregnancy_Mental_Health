import React, { createContext, useContext, useEffect } from "react";
import { LIGHT_THEME, DARK_THEME } from "./theme";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const isDarkMode = false;
  const theme = LIGHT_THEME;

  useEffect(() => {
    // Apply background color to body to prevent white flashes
    document.body.style.backgroundColor = theme.pageBg;
    document.body.style.color = theme.textPrimary;
  }, [theme]);

  const toggleTheme = () => {};

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
