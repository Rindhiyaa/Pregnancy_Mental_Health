import React, { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import ThemeToggle from "./ThemeToggle";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { Menu, X } from "lucide-react";

const SIDEBAR_WIDTH = 240;

export default function PortalLayout({ children, pageTitle, sidebar: Sidebar }) {
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when switching to desktop
  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  // Close sidebar on body scroll-lock when open
  useEffect(() => {
    if (!isDesktop && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen, isDesktop]);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: theme.pageBg,
      fontFamily: theme.fontBody,
    }}>

      {/* ── Mobile overlay ── */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 450,
            backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* ── Sidebar drawer ── */}
      <div
        className="portal-sidebar-wrapper"
        style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          zIndex: 500,
          width: SIDEBAR_WIDTH,
          transform: isDesktop
            ? "translateX(0)"
            : sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        marginLeft: isDesktop ? SIDEBAR_WIDTH : 0,
        width: isDesktop ? `calc(100% - ${SIDEBAR_WIDTH}px)` : "100%",
        boxSizing: "border-box",
        minWidth: 0,
        background: theme.pageBg,
        fontFamily: theme.fontBody,
        height: "100vh",
        overflowY: "auto",
        paddingTop: !isDesktop ? "56px" : 0,
      }}>

        {/* ── Fixed mobile top bar ── */}
        {!isDesktop && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            background: theme.pageBg,
            borderBottom: `1px solid ${theme.divider || theme.border || "#e5e7eb"}`,
            zIndex: 400,
            boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: theme.textPrimary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 8,
                borderRadius: 8,
                minWidth: 40,
                minHeight: 40,
              }}
              aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <span style={{
              fontWeight: 700,
              fontSize: 16,
              color: theme.textPrimary,
              flex: 1,
              textAlign: "center",
            }}>
              {pageTitle}
            </span>

            <ThemeToggle />
          </div>
        )}

        {/* ── Page content with padding ── */}
        <div style={{
          padding: isMobile ? "16px" : isTablet ? "24px 28px" : "40px 48px",
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
