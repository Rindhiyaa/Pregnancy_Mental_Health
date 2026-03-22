import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  BarChart2,
  Calendar,
  Smile,
  Clipboard,
  BookOpen,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";
import { THEME } from "../theme";
import { useTheme } from "../ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import logo from "../Images/Postpartum_Risk_Insight_Logo.png";

const NAV_ITEMS = [
  { to: "/patient/dashboard", icon: <Home size={18} />, label: "Dashboard" },
  { to: "/patient/results", icon: <BarChart2 size={18} />, label: "My Results" },
  { to: "/patient/mood", icon: <Smile size={18} />, label: "Mood Tracker" },
  { to: "/patient/careplan", icon: <Clipboard size={18} />, label: "Care Plan" },
  { to: "/patient/resources", icon: <BookOpen size={18} />, label: "Resources" },
  { to: "/patient/messages", icon: <MessageSquare size={18} />, label: "Messages" },
];

export default function PatientSidebar() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <aside style={{ ...S.sidebar, background: theme.sidebarBg, borderRight: `1px solid ${theme.sidebarBorder}` }}>

      <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "rgba(255, 255, 255, 0.84)",
          display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <img src={logo} alt="Logo" style={{ width: "66px", height: "66px", objectFit: "contain" }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>PPD Risk Insight</div>
          <div style={{ fontSize: 10, color: theme.sidebarMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Patient Portal</div>
        </div>
      </div>

      <div style={{ ...S.topDivider, background: theme.sidebarBorder, marginBottom: 8 }} />

      {/* ── NAV ── */}
      <nav style={{ flex: 1, padding: "10px 16px" }}>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", margin: "2px 0", borderRadius: 8,
              textDecoration: "none", color: isActive ? theme.sidebarActiveText : theme.sidebarText,
              background: isActive ? theme.sidebarActiveBg : "transparent",
              transition: "all 0.2s", fontWeight: 600, fontSize: 13,
              borderLeft: isActive ? `3px solid ${theme.sidebarActiveBorder}` : "3px solid transparent"
            })}
          >
            <span style={{ display: "flex", opacity: 0.9 }}>{icon}</span>
            <span style={{ fontSize: 13 }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── BOTTOM ── */}
      <div style={S.bottomArea}>
        <div style={{ ...S.topDivider, background: theme.sidebarBorder }} />

        <NavLink
          to="/patient/profile"
          style={({ isActive }) => ({
            ...S.navItem,
            background: isActive ? theme.sidebarActiveBg : "transparent",
            color: isActive ? theme.sidebarActiveText : theme.sidebarText,
            boxShadow: isActive ? `inset 3px 0 0 ${theme.sidebarActiveBorder}` : "none",
            fontWeight: 700
          })}
        >
          <span style={S.navIcon}><User size={18} /></span>
          <span style={S.navLabel}>My Profile</span>
        </NavLink>

        <button
          style={{ ...S.logoutBtn, color: theme.sidebarText }}
          onClick={handleLogout}
        >
          <span style={S.navIcon}><LogOut size={18} /></span>
          <span style={S.navLabel}>Logout</span>
        </button>
      </div>

    </aside>
  );
}

// ── STYLES ── 
const S = {
  sidebar: {
    width: 240,
    minHeight: "100vh",
    position: "fixed",
    top: 0, left: 0,
    background: THEME.sidebarBg,           // Blush white 
    borderRight: `1px solid ${THEME.sidebarBorder}`,
    display: "flex",
    flexDirection: "column",
    zIndex: 100,
    overflowX: "hidden",                   // ✅ No horizontal scroll 
    overflowY: "auto",
    boxSizing: "border-box",
    fontFamily: THEME.fontBody,
  },

  // Logo 
  logoArea: {
    display: "flex", alignItems: "center",
    gap: 10, padding: "24px 20px 20px 20px",
  },
  logoIcon: {
    fontSize: 28,
    width: 42, height: 42,
    background: THEME.primaryBg,
    borderRadius: 12,
    display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  logoText: {
    fontFamily: THEME.fontHeading,
    fontSize: 15, fontWeight: 800,
    color: THEME.primary,
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 10, color: THEME.sidebarMuted,
    marginTop: 2, lineHeight: 1,
  },

  topDivider: {
    height: 1,
    background: THEME.sidebarBorder,
    margin: "0 16px",
  },

  // User card 
  userCard: {
    display: "flex", alignItems: "center",
    gap: 10, padding: "14px 20px",
  },
  userAvatar: {
    width: 38, height: 38,
    borderRadius: "50%",
    background: THEME.primaryBg,
    color: THEME.primary,
    fontFamily: THEME.fontHeading,
    fontWeight: 800, fontSize: 16,
    display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  userName: {
    fontFamily: THEME.fontHeading,
    fontSize: 13, fontWeight: 700,
    color: THEME.textPrimary,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userWeek: {
    fontSize: 11,
    color: THEME.sidebarMuted,
    marginTop: 2,
  },

  // Nav 
  nav: {
    flex: 1,
    padding: "10px 0",
    display: "flex",
    flexDirection: "column",
  },
  navItem: {
    display: "flex", alignItems: "center",
    gap: 10,
    padding: "10px 20px",
    margin: "2px 12px",
    borderRadius: 10,
    textDecoration: "none",
    transition: "all 0.18s ease",
    boxSizing: "border-box",
    cursor: "pointer",
    border: "none",
    width: "calc(100% - 24px)",
    background: "transparent",
  },
  navActive: {
    background: THEME.sidebarActiveBg,     // soft pink 
    color: THEME.sidebarActiveText,         // rose text 
    fontWeight: 700,
    boxShadow: `inset 3px 0 0 ${THEME.sidebarActiveBorder}`,
  },
  navInactive: {
    color: THEME.sidebarText,
    fontWeight: 700,
  },
  navIcon: { fontSize: 17, flexShrink: 0 },
  navLabel: {
    fontSize: 12,
    fontFamily: THEME.fontBody,
    fontWeight: 700,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  // Bottom 
  bottomArea: {
    paddingBottom: 16,
    display: "flex",
    flexDirection: "column",
  },
  logoutBtn: {
    display: "flex", alignItems: "center",
    gap: 10,
    padding: "10px 20px",
    margin: "2px 12px",
    borderRadius: 10,
    background: "transparent",
    border: "none",
    color: THEME.sidebarText,
    cursor: "pointer",
    width: "calc(100% - 24px)",
    fontFamily: THEME.fontBody,
    fontSize: 13,
    fontWeight: 700,
    textAlign: "left",
    transition: "all 0.18s",
  },
}; 