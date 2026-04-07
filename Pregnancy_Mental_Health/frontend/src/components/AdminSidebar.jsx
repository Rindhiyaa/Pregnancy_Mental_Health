import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { api } from "../utils/api";
import {
  LayoutDashboard, Users, UserPlus, FileText, LogOut,
  Shield, BarChart3, Menu, X, KeyRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../ThemeContext";
import logo from "../Images/Postpartum_Risk_Insight_Logo.png";
import ThemeToggle from "./ThemeToggle";

const ADMIN_NAV_ITEMS = [
  { to: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/admin/doctors",   icon: <Shield size={18} />,          label: "Doctors" },
  { to: "/admin/nurses",    icon: <UserPlus size={18} />,         label: "Nurses" },
  { to: "/admin/patients",  icon: <Users size={18} />,            label: "Patients" },
  { to: "/admin/recovery",  icon: <KeyRound size={18} />,         label: "Recoveries" },
  { to: "/admin/analytics", icon: <BarChart3 size={18} />,        label: "Analytics" },
  { to: "/admin/audit",     icon: <FileText size={18} />,         label: "Audit Logs" },
];

export default function AdminSidebar({ onClose }) {
  const { logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  useEffect(() => {
    fetchPendingCount();
    const wsUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/^http/, "ws").replace(/\/$/, "") + "/ws"
      : `ws://${window.location.hostname}:8000/ws`;
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_RECOVERY_REQUEST" || data.type === "RECOVERY_COMPLETED") fetchPendingCount();
      } catch {}
    };
    return () => { if (socket.readyState === WebSocket.OPEN) socket.close(); };
  }, []);

  const fetchPendingCount = async () => {
    try {
      const { data } = await api.get("/recovery/admin/pending");
      setPendingCount(Array.isArray(data) ? data.length : 0);
    } catch {}
  };

  const handleLogout = () => { logout(); navigate("/signin"); };

  const handleNavClick = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const close = () => { setIsOpen(false); if (onClose) onClose(); };

  return (
    <>
      {/* Fixed mobile top bar */}
      <div className="portal-mobile-topbar">
        <button
          onClick={() => setIsOpen(o => !o)}
          className="sidebar-toggle"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary, flex: 1, textAlign: "center" }}>
          Admin Portal
        </span>
        <ThemeToggle />
      </div>

      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay open" onClick={close} />}

      <aside
        className={`portal-sidebar${isOpen ? " open" : ""}`}
        style={{
          width: 240, height: "100vh", position: "fixed", top: 0, left: 0,
          background: theme.sidebarBg, borderRight: `1px solid ${theme.sidebarBorder}`,
          display: "flex", flexDirection: "column", zIndex: 100, color: "white",
          overflowX: "hidden", overflowY: "auto", boxSizing: "border-box",
          transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="Logo" style={{ width: "54px", height: "54px", objectFit: "contain", marginLeft: "-8px" }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>PPD Risk Insight</div>
              <div style={{ fontSize: 10, color: theme.sidebarMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Management Portal</div>
            </div>
          </div>
          <button onClick={close} className="sidebar-close-btn" style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
            <X size={24} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: "10px 16px" }}>
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={handleNavClick}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", margin: "2px 0", borderRadius: 8,
                textDecoration: "none",
                color: isActive ? theme.sidebarActiveText : theme.sidebarText,
                background: isActive ? theme.sidebarActiveBg : "transparent",
                transition: "all 0.2s", fontWeight: 600, fontSize: 13,
                borderLeft: isActive ? `3px solid ${theme.sidebarActiveBorder}` : "3px solid transparent",
                position: "relative",
              })}
            >
              <span style={{ display: "flex", opacity: 0.9 }}>{item.icon}</span>
              <span style={{ fontSize: 13, flex: 1 }}>{item.label}</span>
              {item.label === "Recoveries" && pendingCount > 0 && (
                <span style={{
                  background: theme.warningText || "#F59E0B", color: "white",
                  fontSize: 10, fontWeight: 900, padding: "2px 6px", borderRadius: 10,
                  minWidth: 16, textAlign: "center",
                }}>
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme.sidebarBorder}` }}>
          <button style={{ ...S.logoutBtn, color: theme.sidebarText }} onClick={handleLogout}>
            <span style={S.navIcon}><LogOut size={18} /></span>
            <span style={S.navLabel}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

const S = {
  logoutBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 20px", margin: "2px 12px", borderRadius: 10,
    textDecoration: "none", transition: "all 0.18s ease",
    boxSizing: "border-box", cursor: "pointer", border: "none",
    width: "calc(100% - 24px)", background: "transparent", fontWeight: 600, fontSize: 13,
  },
  navIcon: { display: "flex", opacity: 0.9 },
  navLabel: { fontSize: 13 },
};
