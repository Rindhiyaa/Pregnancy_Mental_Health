// src/theme.js 

const SHARED_THEME = {
  fontHeading: "'Poppins', 'Inter', sans-serif",
  fontBody: "'Inter', 'Poppins', sans-serif",
  fontNormal: 500,
  fontMedium: 600,
  fontBold: 700,
  fontHeavy: 800,
  sizeXs: "11px",
  sizeSm: "12px",
  sizeBase: "14px",
  sizeLg: "16px",
  sizeXl: "18px",
  size2xl: "22px",
  size3xl: "28px",
};

export const LIGHT_THEME = {
  ...SHARED_THEME,
  // ── Core Brand ── 
  primary: "#2A9D8F",      // Softer Teal
  primaryHover: "#23867A", // Slightly Darker Teal
  primaryLight: "#E6F4F2", // Ultra Light Teal
  primaryBg: "#F0FDFA",    // Soft Mint
  primaryText: "#1F2937",

  // ── Glass & Effects ──
  glassBg: "rgba(255, 255, 255, 0.7)",
  glassBorder: "rgba(255, 255, 255, 0.3)",
  glassBlur: "blur(12px)",
  shadowPremium: "0 10px 30px -10px rgba(0,0,0,0.1)",

  // ── Sidebar ── 
  sidebarBg: "linear-gradient(180deg, #1F6F78, #2A9D8F)",
  sidebarBorder: "rgba(255,255,255,0.05)",
  sidebarText: "rgba(255,255,255,0.9)",
  sidebarMuted: "rgba(255,255,255,0.6)",
  sidebarActiveBg: "rgba(255,255,255,0.15)",
  sidebarActiveText: "#FFFFFF",
  sidebarActiveBorder: "#E6F4F2",

  // ── Page & Cards ── 
  pageBg: "#F9FAFB",
  cardBg: "#FFFFFF",
  cardBorder: "#E5E7EB",

  // ── Text ── 
  textPrimary: "#1F2937", // Dark Gray
  textSecondary: "#4B5563", // Soft Gray
  textMuted: "#9CA3AF", // Light Gray
  textLight: "#D1D5DB",
  text: "#1F2937",         // Alias for textPrimary
  secondary: "#4B5563",    // Alias for textSecondary

  // ── Hero Gradient ── 
  heroGradient: "linear-gradient(135deg, #1F6F78 0%, #2A9D8F 100%)",

  // ── Dividers / Borders ── 
  divider: "#F3F4F6",
  inputBorder: "#E5E7EB",

  // ── Status Badges ── 
  successBg: "#E6F4EA",
  successText: "#2E7D32",
  warningBg: "#FFF4E5",
  warningText: "#B26A00",
  dangerBg: "#FDECEA",
  dangerText: "#C62828",
  infoBg: "#EFF6FF",
  infoText: "#1D4ED8",

  // ── Fonts ── 
  fontHeading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontBody: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const DARK_THEME = {
  ...SHARED_THEME,
  // ── Core Brand ── 
  primary: "#E04C63",
  primaryHover: "#F06277",
  primaryLight: "#F28B9B",
  primaryBg: "#3D1219",
  primaryText: "#FCEEF2",

  // ── Glass & Effects ──
  glassBg: "rgba(30, 41, 59, 0.7)",
  glassBorder: "rgba(255, 255, 255, 0.1)",
  glassBlur: "blur(20px)",
  shadowPremium: "0 20px 50px -12px rgba(0,0,0,0.5)",

  // ── Sidebar 
  sidebarBg: "#1e737fff",
  sidebarBorder: "rgba(255,255,255,0.05)",
  sidebarText: "rgba(255,255,255,0.7)",
  sidebarMuted: "rgba(255,255,255,0.5)",
  sidebarActiveBg: "rgba(255,255,255,0.1)",
  sidebarActiveText: "#FFFFFF",
  sidebarActiveBorder: "#14B8A6",

  // ── Page & Cards 
  pageBg: "#110608",
  cardBg: "#1D0C10",
  cardBorder: "#2D1A1E",

  // ── Text ── 
  textPrimary: "#F9FAFB",
  textSecondary: "#D1D5DB",
  textMuted: "#9CA3AF",
  textLight: "#6B7280",

  // ── Hero Gradient ── 
  heroGradient: "linear-gradient(135deg, #7A1C2A 0%, #9B2335 100%)",

  // ── Dividers / Borders ── 
  divider: "#2D1A1E",
  inputBorder: "#374151",

  // ── Status Badges ── 
  successBg: "#064E3B",
  successText: "#A7F3D0",
  warningBg: "#78350F",
  warningText: "#FDE68A",
  dangerBg: "#831843",
  dangerText: "#FBCFE8",
  infoBg: "#1E3A8A",
  infoText: "#BFDBFE",

  // ── Fonts ── 
  fontHeading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontBody: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// Default export for backwards compatibility (will point to light for now)
export const THEME = LIGHT_THEME;
