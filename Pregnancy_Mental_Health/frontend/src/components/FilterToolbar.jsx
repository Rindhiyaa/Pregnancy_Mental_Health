import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, FileText, FileSpreadsheet, Table2, ChevronDown } from 'lucide-react';
import { useTheme } from '../ThemeContext';

function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

const FilterToolbar = ({
  searchValue,
  onSearchChange,
  filters = [],
  activeFilter,
  onFilterChange,
  onPDFExport,
  onExcelExport,
  onCSVExport,
  placeholder = "Search...",
  showExport = true,
  children
}) => {
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => {
      setShowFilterDropdown(false);
      setShowExportDropdown(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const activeFilterLabel = filters.find(f => f.value === activeFilter)?.label || "Filter";

  return (
    <div style={{
      padding: isMobile ? "12px 14px" : "16px 20px",
      borderBottom: `1px solid ${theme.border}`,
      background: theme.innerBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
      display: "flex",
      flexDirection: "column",   // always column: search on top, buttons below
      gap: isMobile ? 10 : 12,
    }}>

      {/* ── Row 1: Search — full width ── */}
      <div style={{ position: "relative", width: "100%" }}>
        <Search
          size={16}
          style={{
            position: "absolute", left: 12,
            top: "50%", transform: "translateY(-50%)",
            color: theme.textMuted,
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 12px 9px 38px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            fontSize: isMobile ? 13 : 14,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            background: theme.inputBg,
            color: theme.textPrimary,
          }}
        />
      </div>

      {/* ── Row 2: Filter + Export — always horizontal ── */}
      <div style={{
        display: "flex",
        flexDirection: "row",       // ← KEY FIX: always row, never column
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
      }}>

        {/* Filter Dropdown */}
        {filters.length > 0 && (
          <div
            style={{ position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowFilterDropdown(f => !f);
                setShowExportDropdown(false);
              }}
              style={{
                padding: isMobile ? "8px 12px" : "9px 16px",
                borderRadius: 8,
                border: `1px solid ${activeFilter !== (filters[0]?.value) ? theme.primary : theme.border}`,
                background: activeFilter !== (filters[0]?.value)
                  ? `${theme.primary}15` : theme.cardBg,
                color: activeFilter !== (filters[0]?.value)
                  ? theme.primary : theme.textPrimary,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: isMobile ? 12 : 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",   // ← prevents text wrapping inside button
              }}
            >
              <Filter size={14} />
              {/* On mobile show short label, on desktop show full */}
              {isMobile
                ? (activeFilter !== filters[0]?.value ? activeFilterLabel : "Filter")
                : activeFilterLabel
              }
              <ChevronDown size={13} />
            </button>

            {showFilterDropdown && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 1000,
                overflow: "hidden",
                minWidth: 170,
              }}>
                {filters.map((filter) => (
                  <div
                    key={filter.value}
                    onClick={() => { onFilterChange(filter.value); setShowFilterDropdown(false); }}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: activeFilter === filter.value ? 700 : 500,
                      color: activeFilter === filter.value ? theme.primary : theme.textPrimary,
                      background: activeFilter === filter.value
                        ? `${theme.primary}12` : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      if (activeFilter !== filter.value)
                        e.currentTarget.style.background =
                          theme.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      if (activeFilter !== filter.value)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {filter.icon && <filter.icon size={15} />}
                    {filter.label}
                    {activeFilter === filter.value && (
                      <div style={{
                        marginLeft: "auto",
                        width: 7, height: 7,
                        borderRadius: "50%",
                        background: theme.primary,
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export Dropdown */}
        {showExport && (onPDFExport || onExcelExport || onCSVExport) && (
          <div
            style={{ position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowExportDropdown(f => !f);
                setShowFilterDropdown(false);
              }}
              style={{
                padding: isMobile ? "8px 12px" : "9px 16px",
                borderRadius: 8,
                background: theme.primary,
                color: "white",
                border: "none",
                boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: isMobile ? 12 : 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",   // ← prevents text wrapping inside button
              }}
            >
              <Download size={14} />
              Export
              <ChevronDown size={13} />
            </button>

            {showExportDropdown && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 1000,
                overflow: "hidden",
                minWidth: 160,
              }}>
                {onPDFExport && (
                  <div
                    onClick={() => { onPDFExport(); setShowExportDropdown(false); }}
                    style={exportItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background =
                      theme.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <FileText size={15} color="#ef4444" />
                    Export as PDF
                  </div>
                )}
                {onExcelExport && (
                  <div
                    onClick={() => { onExcelExport(); setShowExportDropdown(false); }}
                    style={exportItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background =
                      theme.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <FileSpreadsheet size={15} color="#22c55e" />
                    Export as Excel
                  </div>
                )}
                {onCSVExport && (
                  <div
                    onClick={() => { onCSVExport(); setShowExportDropdown(false); }}
                    style={exportItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background =
                      theme.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Table2 size={15} color="#3b82f6" />
                    Export as CSV
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Additional custom buttons */}
        {children}
      </div>
    </div>
  );
};

const exportItemStyle = {
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  color: "inherit",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  gap: 8,
  transition: "background 0.15s",
  whiteSpace: "nowrap",
};

export default FilterToolbar;
