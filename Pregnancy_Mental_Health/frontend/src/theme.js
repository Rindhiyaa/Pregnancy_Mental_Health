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
  isDark: false,
  pageBg: "#F9FAFB",
  cardBg: "#FFFFFF",
  cardBgSecondary: "#F8FAF8",
  innerBg: "#F9FAFB",
  cardBorder: "#E5E7EB",
  border: "#E5E7EB",

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
  inputBg: "#FFFFFF",
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

  // ── Tables ──
  tableHover: "#F9FAFB",
  tableHeaderBg: "#F1F5F9",
};

export const DARK_THEME = {
  ...SHARED_THEME,
  // ── Core Brand ── 
  primary: "#1E3A8A",      // Royal Blue (User requested)
  primaryHover: "#2563EB", 
  primaryLight: "#3B82F6",
  primaryBg: "#0D131C",    // Inner BG (User requested)
  primaryText: "#F1F5F9",  // Foreground (User requested)

  // ── Glass & Effects ──
  glassBg: "rgba(26, 36, 51, 0.7)", // Based on Card BG
  glassBorder: "rgba(255, 255, 255, 0.1)",
  glassBlur: "blur(20px)",
  shadowPremium: "0 20px 50px -12px rgba(0,0,0,0.5)",

  // ── Sidebar ── 
  sidebarBg: "#0A0F1A",    // Sidebar BG (User requested)
  sidebarBorder: "#2D3748", // Card Border (User requested)
  sidebarText: "rgba(241, 245, 249, 0.7)",
  sidebarMuted: "rgba(241, 245, 249, 0.5)",
  sidebarActiveBg: "rgba(255, 255, 255, 0.1)",
  sidebarActiveText: "#F1F5F9",
  sidebarActiveBorder: "#2DD4BF", // Accent (User requested)

  isDark: true,
  // ── Page & Cards ── 
  pageBg: "#0A0F1A",       // Background (User requested)
  cardBg: "#1A2433",       // Card BG (User requested)
  cardBgSecondary: "#1F2937",
  cardBorder: "#2D3748",   // Card Border (User requested)
  border: "#2D3748",

  // ── Text ── 
  textPrimary: "#F1F5F9",  // Foreground (User requested)
  textSecondary: "#CBD5E1", // Brighter Gray (Soft white)
  textMuted: "#94A3B8",    // Brighter Muted (Slightly less bright white)
  textLight: "#64748B",

  // ── Hero Gradient ── 
  heroGradient: "linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)",

  // ── Dividers / Borders ── 
  divider: "#2D3748",      // Card Border (User requested)
  inputBg: "#1F2937",      // Input BG (User requested)
  inputBorder: "#1F2937",  // Input BG (User requested)

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
  fontHeading: "'Outfit', 'Inter', sans-serif", // Outfit for headings as requested
  fontBody: "'Inter', sans-serif",

  // ── Tables ──
  tableHover: "rgba(255, 255, 255, 0.03)",
  tableHeaderBg: "rgba(255, 255, 255, 0.05)",
};

// Default export for backwards compatibility (will point to light for now)
export const THEME = LIGHT_THEME;
