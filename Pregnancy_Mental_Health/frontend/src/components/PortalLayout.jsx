import { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import ThemeToggle from "./ThemeToggle";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { Menu } from "lucide-react";

const SIDEBAR_WIDTH = 240;

export default function PortalLayout({ children, pageTitle, sidebar: Sidebar }) {
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: theme.pageBg,
      fontFamily: theme.fontBody,
    }}>
      {/* Mobile overlay */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 200,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar drawer */}
      <div style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 300,
        width: SIDEBAR_WIDTH,
        transform: isDesktop
          ? "translateX(0)"
          : sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
      }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: isDesktop ? SIDEBAR_WIDTH : 0,
        padding: isMobile ? "16px" : isTablet ? "24px 28px" : "40px 48px",
        width: isDesktop ? `calc(100% - ${SIDEBAR_WIDTH}px)` : "100%",
        boxSizing: "border-box",
        minWidth: 0,
        background: theme.pageBg,
        fontFamily: theme.fontBody,
        height: "100vh",
        overflowY: "auto",
      }}>
        {/* Mobile top bar */}
        {!isDesktop && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            padding: "8px 0",
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "none",
                cursor: "pointer", color: theme.textPrimary,
                display: "flex", alignItems: "center", padding: 4,
              }}
              aria-label="Open navigation"
            >
              <Menu size={24} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary }}>
              {pageTitle}
            </span>
            <ThemeToggle />
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
