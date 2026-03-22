import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../ThemeContext";

export default function ThemeToggle({ showLabel = false, inHeader = false }) {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 10,
        background: inHeader ? "rgba(255, 255, 255, 0.15)" : (isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"),
        border: "none",
        color: inHeader ? "#FFFFFF" : (isDarkMode ? "#F1F5F9" : "#1F2937"),
        cursor: "pointer",
        transition: "all 0.3s ease",
        width: showLabel ? "calc(100% - 24px)" : "auto",
        margin: showLabel ? "2px 12px" : "0",
      }}
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <span style={{ display: "flex", opacity: 0.9 }}>
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </span>
      {showLabel && (
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
