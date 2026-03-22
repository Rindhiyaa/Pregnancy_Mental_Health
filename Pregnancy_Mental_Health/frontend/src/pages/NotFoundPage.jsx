import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [returnPath, setReturnPath] = useState("/");
  const [returnText, setReturnText] = useState("Return to Homepage");

  useEffect(() => {
    // Determine context based on the current path to provide a smart return button
    const path = location.pathname;
    if (path.startsWith("/doctor/")) {
      setReturnPath("/doctor/dashboard");
      setReturnText("Return to Doctor Portal");
    } else if (path.startsWith("/nurse/")) {
      setReturnPath("/nurse/dashboard");
      setReturnText("Return to Nurse Portal");
    } else if (path.startsWith("/patient/")) {
      setReturnPath("/patient/dashboard");
      setReturnText("Return to Patient Portal");
    } else if (path.startsWith("/admin/")) {
      setReturnPath("/admin/dashboard");
      setReturnText("Return to Admin Console");
    }
  }, [location]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: theme.isDark ? theme.pageBg : "#F8FAFC",
      fontFamily: theme.fontBody,
      padding: "20px",
      textAlign: "center"
    }}>
      <div style={{ position: "absolute", top: "24px", right: "24px" }}>
        <ThemeToggle />
      </div>

      <div style={{
        position: "relative",
        marginBottom: "24px",
      }}>
        <div style={{
          fontSize: "120px",
          fontWeight: 900,
          fontFamily: theme.fontHeading,
          background: theme.heroGradient || `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          opacity: 0.15,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 0
        }}>
          404
        </div>
        <AlertTriangle 
          size={80} 
          color={theme.primary} 
          style={{ position: "relative", zIndex: 1 }} 
        />
      </div>

      <h1 style={{
        fontFamily: theme.fontHeading,
        fontSize: "36px",
        fontWeight: 800,
        color: theme.textPrimary || theme.text,
        margin: "0 0 16px 0",
        position: "relative",
        zIndex: 1
      }}>
        Page Not Found
      </h1>

      <p style={{
        color: theme.textSecondary || theme.textMuted,
        fontSize: "16px",
        maxWidth: "400px",
        lineHeight: 1.6,
        margin: "0 0 32px 0",
        position: "relative",
        zIndex: 1
      }}>
        We couldn't find the page you were looking for. The link might be broken, or the page may have been moved.
      </p>

      <div style={{
        display: "flex",
        gap: "16px",
        position: "relative",
        zIndex: 1,
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            borderRadius: "12px",
            border: `1.5px solid ${theme.border}`,
            background: "transparent",
            color: theme.textPrimary || theme.text,
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ArrowLeft size={18} />
          Go Back
        </button>

        <button
          onClick={() => navigate(returnPath)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            borderRadius: "12px",
            border: "none",
            background: theme.primary,
            color: "white",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: theme.shadowPremium || "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = theme.shadowPremium || "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
          }}
        >
          <Home size={18} />
          {returnText}
        </button>
      </div>
    </div>
  );
}
