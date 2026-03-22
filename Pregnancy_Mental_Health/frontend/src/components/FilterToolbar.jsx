import React, { useState } from 'react';
import { Search, Filter, Download, FileText, FileSpreadsheet, Table2, ChevronDown } from 'lucide-react';
import { useTheme } from '../ThemeContext';

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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const toolbarStyle = {
    padding: "20px 24px",
    borderBottom: `1px solid ${theme.border}`,
    display: "flex",
    gap: 16,
    alignItems: "center",
    background: theme.innerBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
    flexWrap: "wrap",
    justifyContent: "space-between"
  };

  const rightGroupStyle = {
    display: "flex",
    gap: 6,
    alignItems: "center",
    flexWrap: "wrap",
    marginLeft: "auto"
  };

  const searchContainerStyle = {
    position: "relative",
    flex: 1,
    maxWidth: 320,
    minWidth: 200
  };

  const searchIconStyle = {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: theme.textMuted
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px 10px 40px",
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    background: theme.inputBg,
    color: theme.textPrimary
  };

  const buttonStyle = {
    padding: "10px 22px",
    minWidth: 130,
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.cardBg,
    color: theme.textPrimary,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    position: "relative"
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: theme.primary,
    color: "white",
    border: "none",
    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)"
  };

  const dropdownStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    boxShadow: theme.shadowPremium,
    zIndex: 1000,
    overflow: "hidden"
  };

  const dropdownItemStyle = {
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: theme.textPrimary,
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "background 0.2s"
  };

  return (
    <div style={toolbarStyle}>
      {/* Search Input */}
      <div style={searchContainerStyle}>
        <Search size={18} style={searchIconStyle} />
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Right-aligned group: Filter + Export + children */}
      <div style={rightGroupStyle}>
        {/* Filter Dropdown */}
        {filters.length > 0 && (
          <div style={{ position: "relative" }}>
            <button
              style={buttonStyle}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter size={18} />
              Filter
              <ChevronDown size={16} />
            </button>
            
            {showFilterDropdown && (
              <div style={dropdownStyle}>
                {filters.map((filter) => (
                  <div
                    key={filter.value}
                    style={{
                      ...dropdownItemStyle,
                      background: activeFilter === filter.value ? theme.primary + '10' : 'transparent'
                    }}
                    onClick={() => {
                      onFilterChange(filter.value);
                      setShowFilterDropdown(false);
                    }}
                    onMouseEnter={(e) => {
                      if (activeFilter !== filter.value) {
                        e.currentTarget.style.background = theme.tableHover || (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc");
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeFilter !== filter.value) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {filter.icon && <filter.icon size={16} />}
                    {filter.label}
                    {activeFilter === filter.value && (
                      <div style={{
                        marginLeft: "auto",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: theme.primary
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
          <div style={{ position: "relative" }}>
            <button
              style={primaryButtonStyle}
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              <Download size={18} />
              Export
              <ChevronDown size={16} />
            </button>
            
            {showExportDropdown && (
              <div style={dropdownStyle}>
                {onPDFExport && (
                  <div
                    style={dropdownItemStyle}
                    onClick={() => { onPDFExport(); setShowExportDropdown(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.tableHover || (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={16} color="#ef4444" />
                    Export as PDF
                  </div>
                )}
                {onExcelExport && (
                  <div
                    style={dropdownItemStyle}
                    onClick={() => { onExcelExport(); setShowExportDropdown(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.tableHover || (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileSpreadsheet size={16} color="#22c55e" />
                    Export as Excel
                  </div>
                )}
                {onCSVExport && (
                  <div
                    style={dropdownItemStyle}
                    onClick={() => { onCSVExport(); setShowExportDropdown(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.tableHover || (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Table2 size={16} color="#3b82f6" />
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

export default FilterToolbar;