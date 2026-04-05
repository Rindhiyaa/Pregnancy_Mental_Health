// src/components/UI.jsx 
import React from "react";
import { useTheme } from "../ThemeContext";

export const PrimaryBtn = ({ children, onClick, style = {} }) => {
  const { theme } = useTheme();
  return (
    <button onClick={onClick} style={{
      background: theme.primary,
      color: "white",
      border: "none",
      padding: "10px 22px",
      borderRadius: 10,
      fontFamily: theme.fontHeading,
      fontSize: 13, fontWeight: 700,
      cursor: "pointer",
      transition: "background 0.2s",
      ...style,
    }}>
      {children}
    </button>
  );
};

export const OutlineBtn = ({ children, onClick, style = {} }) => {
  const { theme } = useTheme();
  return (
    <button onClick={onClick} style={{
      background: "transparent",
      color: theme.primary,
      border: `1.5px solid ${theme.primary}`,
      padding: "9px 20px",
      borderRadius: 10,
      fontFamily: theme.fontHeading,
      fontSize: 13, fontWeight: 700,
      cursor: "pointer",
      ...style,
    }}>
      {children}
    </button>
  );
};

export const PageTitle = ({ title, subtitle }) => {
  const { theme } = useTheme();
  return (
    <div style={{ marginBottom: 8 }}>
      <h1 style={{
        fontFamily: theme.fontHeading,
        fontSize: 26, fontWeight: 700,
        color: theme.textPrimary,
        margin: "0 0 6px 0",
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: 14, color: theme.textMuted, margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export const Divider = () => {
  const { theme } = useTheme();
  return (
    <div style={{
      height: 1,
      background: theme.divider,
      margin: "20px 0",
    }} />
  );
};

export const Card = ({ children, style = {}, glass = false, noPadding = false, hover = false }) => {
  const { theme, isDarkMode } = useTheme();

  const glassStyles = glass ? {
    background: theme.glassBg,
    backdropFilter: theme.glassBlur,
    WebkitBackdropFilter: theme.glassBlur,
    border: `1px solid ${theme.glassBorder}`,
    boxShadow: theme.shadowPremium,
  } : {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: isDarkMode
      ? "0 10px 30px rgba(0,0,0,0.5)"
      : "0 2px 8px rgba(0,0,0,0.04)",
  };

  return (
    <div 
      style={{
        borderRadius: 24,
        padding: noPadding ? 0 : "24px",
        transition: "all 0.3s ease",
        ...glassStyles,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = isDarkMode 
            ? '0 15px 40px rgba(0,0,0,0.6)' 
            : '0 10px 25px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = glassStyles.boxShadow;
        }
      }}
    >
      {children}
    </div>
  );
};

export const StatCard = ({ title, value, icon, trend, trendValue, color = "primary" }) => {
  const { theme } = useTheme();

  const getColor = () => {
    if (color === "danger") return theme.dangerText;
    if (color === "warning") return theme.warningText;
    if (color === "success") return theme.successText;
    return theme.primary;
  };

  return (
    <Card glass style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100,
        background: `radial-gradient(circle, ${getColor()}15 0%, transparent 70%)`,
        zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `${getColor()}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: getColor(),
            border: `1px solid ${getColor()}30`
          }}>
            {icon}
          </div>
          {trend && (
            <Badge variant={trend === "up" ? "success" : "danger"}>
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </Badge>
          )}
        </div>
        <div style={{ color: theme.textSecondary, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </div>
        <div style={{ color: theme.textPrimary, fontSize: 32, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em' }}>
          {value}
        </div>
      </div>
    </Card>
  );
};

export const Badge = ({ children, variant, type, size = "md" }) => {
  const badgeVariant = variant || type || "primary";
  const { theme } = useTheme();
  const configs = {
    primary: { bg: theme.primaryBg, color: theme.primary },
    success: { bg: theme.successBg, color: theme.successText },
    warning: { bg: theme.warningBg, color: theme.warningText },
    danger: { bg: theme.dangerBg, color: theme.dangerText },
    info: { bg: theme.infoBg, color: theme.infoText },
  };
  const cfg = configs[badgeVariant] || configs.primary;
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      padding: size === "sm" ? "2px 8px" : "6px 14px",
      borderRadius: 20,
      fontSize: size === "sm" ? 11 : 12,
      fontWeight: 800,
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      border: `1px solid ${cfg.color}20`,
      textTransform: "uppercase",
      letterSpacing: "0.02em"
    }}>
      {children}
    </span>
  );
};

export const Loader = ({ size = 24, color = "#475569" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const Loader2 = Loader;

export const Table = ({ headers, children, loading, loadingMessage = "Loading data...", emptyMessage = "No data found." }) => {
  const { theme } = useTheme();

  const thStyle = {
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 800,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: `1px solid ${theme.border}`,
    background: theme.tableHeaderBg || theme.cardBgSecondary
  };

  return (
    <Card padding="0" style={{ overflow: 'visible' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={headers.length} style={{ padding: '60px', textAlign: 'center' }}>
                  <Loader2 size={32} color={theme.primary} style={{ margin: '0 auto 16px' }} />
                  <div style={{ color: theme.textMuted, fontSize: 14 }}>{loadingMessage}</div>
                </td>
              </tr>
            ) : React.Children.count(children) > 0 ? (
              children
            ) : (
              <tr>
                <td colSpan={headers.length} style={{ padding: '60px', textAlign: 'center', color: theme.textMuted }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{emptyMessage}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const TableRow = ({ children, onClick, hover = true }) => {
  const { theme } = useTheme();
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: `1px solid ${theme.border}`,
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        background: 'transparent'
      }}
      onMouseEnter={(e) => {
        if (hover) e.currentTarget.style.background = theme.tableHover || (theme.isDark ? 'rgba(255, 255, 255, 0.03)' : `${theme.primary}05`);
      }}
      onMouseLeave={(e) => {
        if (hover) e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </tr>
  );
};

export const TableCell = ({ children, style = {}, colSpan }) => {
  const { theme } = useTheme();
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: '14px 20px',
        fontSize: 14,
        color: theme.text,
        verticalAlign: 'middle',
        lineHeight: 1.5,
        ...style
      }}
    >
      {children}
    </td>
  );
};

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { theme } = useTheme();

  if (totalPages <= 1) return null;

  const btnStyle = (disabled) => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: disabled ? 'transparent' : theme.cardBg,
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? theme.textMuted : theme.textPrimary,
    fontWeight: 700,
    fontSize: 13,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  });

  return (
    <div style={{
      padding: '20px 0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20
    }}>
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        style={btnStyle(currentPage === 1)}
      >
        Previous
      </button>
      <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>
        Page {currentPage} of {totalPages}
      </div>
      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        style={btnStyle(currentPage === totalPages)}
      >
        Next
      </button>
    </div>
  );
};