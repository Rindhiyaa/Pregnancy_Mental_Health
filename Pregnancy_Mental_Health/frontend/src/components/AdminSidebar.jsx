import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  LogOut,
  Shield,
  BarChart3,
  Menu,
  X,
  KeyRound
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../ThemeContext";
import logo from "../Images/Postpartum_Risk_Insight_Logo.png";

const ADMIN_NAV_ITEMS = [
  { to: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/admin/doctors", icon: <Shield size={18} />, label: "Doctors" },
  { to: "/admin/nurses", icon: <UserPlus size={18} />, label: "Nurses" },
  { to: "/admin/patients", icon: <Users size={18} />, label: "Patients" },
  { to: "/admin/recovery", icon: <KeyRound size={18} />, label: "Recoveries" },
  { to: "/admin/analytics", icon: <BarChart3 size={18} />, label: "Analytics" },
  { to: "/admin/audit", icon: <FileText size={18} />, label: "Audit Logs" },
];

export default function AdminSidebar({ onClose }) {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate("/signin"); };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className="portal-sidebar"
      style={{
        width: 240, height: "100%", position: "relative",
        background: theme.sidebarBg, borderRight: `1px solid ${theme.sidebarBorder}`,
        display: "flex", flexDirection: "column", zIndex: 100, color: "white",
        transition: "transform 0.25s ease"
      }}
    >
      <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "-8px" }}>
            <img src={logo} alt="Logo" style={{ width: "54px", height: "54px", objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>PPD Risk Insight</div>
            <div style={{ fontSize: 10, color: theme.sidebarMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Management Portal</div>
          </div>
        </div>

        {/* Mobile close button */}
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', border: 'none', color: 'white', 
            cursor: 'pointer', display: window.innerWidth < 1024 ? 'block' : 'none' 
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Nav Section */}
      <nav style={{ flex: 1, padding: "10px 16px" }}>
        {ADMIN_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", margin: "2px 0", borderRadius: 8,
              textDecoration: "none", color: isActive ? theme.sidebarActiveText : theme.sidebarText,
              background: isActive ? theme.sidebarActiveBg : "transparent",
              transition: "all 0.2s", fontWeight: 600, fontSize: 13,
              borderLeft: isActive ? `3px solid ${theme.sidebarActiveBorder}` : "3px solid transparent"
            })}
          >
            <span style={{ display: "flex", opacity: 0.9 }}>{item.icon}</span>
            <span style={{ fontSize: 13 }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme.sidebarBorder}` }}>
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

const S = {
  logoutBtn: {
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
    fontWeight: 600,
    fontSize: 13,
  },
  navIcon: {
    display: "flex",
    opacity: 0.9,
  },
  navLabel: {
    fontSize: 13,
  },
}