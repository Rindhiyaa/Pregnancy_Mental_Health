import React, { useState, useEffect } from 'react';
import { useTheme } from "../../ThemeContext";
import AdminSidebar from "../../components/AdminSidebar";
import { PageTitle, Divider, Card, Badge, Pagination } from "../../components/UI";

import { Calendar, Clock, Search, Filter, Download, ChevronDown, Menu, X } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";

import toast from "react-hot-toast";
import { api, apiRequest } from "../../utils/api";

// ─── Responsive Hook ────────────────────────────────────────────────────────
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
        width,
    };
}

export default function AuditLogsPage() {
    const { theme } = useTheme();
    const { isMobile, isTablet, isDesktop } = useBreakpoint();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [searchUser, setSearchUser] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [ipFilter, setIpFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => { loadLogs(); }, []);

    useEffect(() => {
        const handler = () => { setShowFilterMenu(false); setShowExportMenu(false); };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);


    const loadLogs = async () => {
        setLoading(true);
        try {
          const { data } = await api.get("/admin/audit-logs");
          setLogs(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error(err);
          toast.error("Failed to load audit logs");
        } finally {
          setLoading(false);
        }
      };

      const filteredLogs = logs
  .map(log => {
    const userNameObj = log.user_name || log.user || "";
    const userName =
      typeof userNameObj === "string"
        ? userNameObj
        : (userNameObj.first_name || userNameObj.name || "") +
          " " +
          (userNameObj.last_name || "");

    return {
      ...log,
      userDisplay: userName.trim() || "Unknown",
    };
  })
  .filter(log => {
    const matchesUser =
      log.userDisplay.toLowerCase().includes(searchUser.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchUser.toLowerCase());

    const matchesAction =
      actionFilter === "all" ||
      (log.action || "").toLowerCase() === actionFilter.toLowerCase();

    const ts = log.timestamp || log.created_at || "";
    const logDate = ts && typeof ts === "string" ? ts.split("T")[0] : "";
    const matchesDate = !dateFilter || logDate === dateFilter;
    const matchesIp = !ipFilter || (log.ip_address || "").toLowerCase().includes(ipFilter.toLowerCase());

    return matchesUser && matchesAction && matchesDate && matchesIp;
  });

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getActionColor = (action) => {
        const act = action.toLowerCase();
        if (act.includes('delete') || act.includes('suspend') || act.includes('fail')) return 'error';
        if (act.includes('create') || act.includes('approve') || act.includes('success')) return 'success';
        if (act.includes('update') || act.includes('edit')) return 'warning';
        return 'info';
    };

    const handleExport = async () => {
        try {
          const res = await apiRequest("/admin/audit-logs/export", {
            method: "GET",
          });
          if (!res.ok) throw new Error("Failed to export CSV");
      
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "audit_logs.csv";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (err) {
          console.error(err);
          toast.error("Failed to export CSV");
        }
      };

    const filterOptions = [
        { label: "All Actions", value: "all" },
        { label: "User Created", value: "User Created" },
        { label: "Password Reset", value: "Password Reset" },
        { label: "Assessment Approved", value: "Assessment Approved" },
        { label: "Mood Logged", value: "Mood Logged" },
        { label: "System Action", value: "System Action" },
    ];

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: theme.pageBg, fontFamily: theme.fontBody }}>

            {/* ── Sidebar ── */}
            <AdminSidebar />

            {/* ── Main content ── */}
            <main style={{
                flex: 1, minWidth: 0,
                height: "100vh", overflowY: "auto",
                background: theme.pageBg, fontFamily: theme.fontBody,
                paddingTop: !isDesktop ? "56px" : 0,
            }}>
            <div style={{ padding: isMobile ? "16px" : isTablet ? "24px 28px" : "40px 48px" }}>

                {/* ── Page Title ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <PageTitle
                        title="Audit Logs"
                        subtitle={isMobile ? "System action tracking" : "Comprehensive system-wide action tracking for security and compliance"}
                    />
                </div>
                <Divider style={{ marginBottom: 24 }} />

                <Card style={{ padding: 0, overflow: "hidden" }}>

                    {/* ── Toolbar ── */}
                    <div style={{
                        padding: isMobile ? "14px 16px" : "20px 24px",
                        borderBottom: `1px solid ${theme.border}`,
                        background: theme.innerBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        flexWrap: "wrap",
                        gap: isMobile ? 10 : 12,
                        alignItems: isMobile ? "stretch" : "center",
                    }}>

                        {/* Search */}
                        <div style={{
                            position: "relative",
                            flex: isMobile ? "1 1 100%" : "1 1 auto",
                            maxWidth: isMobile ? "100%" : 320,
                            minWidth: isMobile ? "unset" : 200,
                        }}>
                            <Search size={16} style={{
                                position: "absolute", left: 12,
                                top: "50%", transform: "translateY(-50%)",
                                color: theme.textMuted,
                            }} />
                            <input
                                type="text"
                                placeholder="Search user or details..."
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "9px 12px 9px 38px",
                                    borderRadius: 8,
                                    border: `1px solid ${theme.border}`,
                                    fontSize: isMobile ? 13 : 14,
                                    fontFamily: "inherit", outline: "none",
                                    boxSizing: "border-box",
                                    background: theme.inputBg,
                                    color: theme.textPrimary,
                                }}
                            />
                        </div>

                        {/* Right controls row */}
                        <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            alignItems: "center",
                            flex: isMobile ? "1 1 100%" : "0 0 auto",
                            justifyContent: isMobile ? "space-between" : "flex-end",
                            marginLeft: isMobile ? 0 : "auto",
                        }}>

                            {/* Date Picker */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <Calendar size={16} color={theme.textMuted} />
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        padding: isMobile ? "8px" : "9px 10px",
                                        borderRadius: 8,
                                        border: `1px solid ${theme.border}`,
                                        fontSize: isMobile ? 12 : 14,
                                        background: theme.inputBg,
                                        color: theme.textPrimary,
                                        cursor: "pointer",
                                        fontFamily: "inherit",
                                        outline: "none",
                                        maxWidth: isMobile ? 140 : "unset",
                                    }}
                                />
                            </div>

                            {/* IP Filter */}
                            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                    style={{ position: "absolute", left: 10, color: "#94a3b8", pointerEvents: "none" }}>
                                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Filter by IP..."
                                    value={ipFilter}
                                    onChange={(e) => { setIpFilter(e.target.value); setCurrentPage(1); }}
                                    style={{
                                        padding: isMobile ? "8px 8px 8px 32px" : "9px 10px 9px 32px",
                                        borderRadius: 8,
                                        border: `1px solid ${ipFilter ? "#8b5cf6" : "#e2e8f0"}`,
                                        fontSize: isMobile ? 12 : 13,
                                        background: ipFilter ? "rgba(139,92,246,0.06)" : "white",
                                        color: "#1e293b",
                                        fontFamily: "inherit",
                                        outline: "none",
                                        width: isMobile ? 120 : 150,
                                        transition: "border-color 0.2s",
                                    }}
                                />
                            </div>

                            {/* Filter Dropdown */}
                            <div
                                style={{ position: "relative" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { setShowFilterMenu(f => !f); setShowExportMenu(false); }}
                                    style={{
                                        padding: isMobile ? "8px 10px" : "9px 16px",
                                        borderRadius: 8,
                                        border: `1px solid ${actionFilter !== 'all' ? theme.primary : theme.border}`,
                                        background: actionFilter !== 'all' ? `${theme.primary}15` : theme.cardBg,
                                        color: actionFilter !== 'all' ? theme.primary : theme.textPrimary,
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: isMobile ? 12 : 14,
                                        display: "flex", alignItems: "center",
                                        gap: 6, whiteSpace: "nowrap",
                                    }}
                                >
                                    <Filter size={14} />
                                    {isMobile
                                        ? (actionFilter !== "all" ? actionFilter : "")
                                        : (actionFilter === "all" ? "Filter" : actionFilter)
                                    }
                                    {!isMobile && <ChevronDown size={14} />}
                                </button>
                                {showFilterMenu && (
                                    <div style={{
                                        position: "absolute",
                                        top: "110%", right: 0,
                                        background: theme.cardBg,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 8, zIndex: 200,
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                        minWidth: 180,
                                    }}>
                                        {filterOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    setActionFilter(opt.value);
                                                    setCurrentPage(1);
                                                    setShowFilterMenu(false);
                                                }}
                                                style={{
                                                    display: "block", width: "100%",
                                                    textAlign: "left",
                                                    padding: "10px 16px", border: "none",
                                                    cursor: "pointer", fontSize: 13,
                                                    background: actionFilter === opt.value
                                                        ? `${theme.primary}15` : theme.cardBg,
                                                    color: actionFilter === opt.value
                                                        ? theme.primary : theme.textPrimary,
                                                    fontWeight: actionFilter === opt.value ? 700 : 400,
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background =
                                                    actionFilter === opt.value
                                                        ? `${theme.primary}25`
                                                        : (theme.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9")}
                                                onMouseLeave={e => e.currentTarget.style.background =
                                                    actionFilter === opt.value
                                                        ? `${theme.primary}15` : theme.cardBg}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Export Dropdown */}
                            <div
                                style={{ position: "relative" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { setShowExportMenu(f => !f); setShowFilterMenu(false); }}
                                    style={{
                                        padding: isMobile ? "8px 10px" : "9px 16px",
                                        borderRadius: 8,
                                        background: theme.primary,
                                        color: "white", border: "none",
                                        cursor: "pointer", fontWeight: 600,
                                        fontSize: isMobile ? 12 : 14,
                                        display: "flex", alignItems: "center",
                                        gap: 6, whiteSpace: "nowrap",
                                    }}
                                >
                                    <Download size={14} />
                                    {!isMobile && "Export"}
                                    {!isMobile && <ChevronDown size={14} />}
                                </button>
                                {showExportMenu && (
                                    <div style={{
                                        position: "absolute",
                                        top: "110%", right: 0,
                                        background: theme.cardBg,
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: 8, zIndex: 200,
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                        minWidth: 140,
                                    }}>
                                        {["PDF", "Excel", "CSV"].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => handleExport(type.toLowerCase())}
                                                style={{
                                                    display: "block", width: "100%",
                                                    textAlign: "left",
                                                    padding: "10px 16px", border: "none",
                                                    cursor: "pointer", fontSize: 13,
                                                    background: theme.cardBg,
                                                    color: theme.textPrimary,
                                                    fontWeight: 500,
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background =
                                                    theme.isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
                                                onMouseLeave={e => e.currentTarget.style.background = theme.cardBg}
                                            >
                                                Export as {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Clear filters */}
                            {(searchUser || actionFilter !== 'all' || dateFilter || ipFilter) && (
                                <button
                                    onClick={() => {
                                        setSearchUser("");
                                        setActionFilter("all");
                                        setDateFilter("");
                                        setIpFilter("");
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        background: "none", border: "none",
                                        color: theme.primary, fontWeight: 700,
                                        cursor: "pointer", fontSize: 13,
                                        display: "flex", alignItems: "center", gap: 4,
                                        padding: "4px 2px",
                                    }}
                                >
                                    <X size={14} /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── MOBILE: Stacked card rows ── */}
                    {isMobile ? (
                        <div style={{ padding: "8px 0" }}>
                            {loading ? (
                                <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>
                                    Loading audit logs...
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>
                                    No logs found matching your filters.
                                </div>
                            ) : (
                                paginatedLogs.map(log => {
                                    const date = new Date(log.timestamp);
                                    const formattedDate = date.toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    });
                                    const formattedTime = date.toLocaleTimeString('en-US', {
                                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    });
                                    return (
                                        <div
                                            key={log.id}
                                            style={{
                                                padding: "14px 16px",
                                                borderBottom: `1px solid ${theme.divider}`,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 8,
                                            }}
                                        >
                                            {/* Timestamp + Badge */}
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: 6,
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Clock size={13} color={theme.textMuted} />
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>
                                                        {formattedDate}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: theme.textMuted }}>
                                                        {formattedTime}
                                                    </span>
                                                </div>
                                                <Badge type={getActionColor(log.action)}>
                                                    {log.action}
                                                </Badge>
                                            </div>

                                            {/* User */}
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span style={mobileLabel}>User</span>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>
                                                    {log.userDisplay}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                                <span style={{ ...mobileLabel, paddingTop: 1 }}>Details</span>
                                                <span style={{
                                                    fontSize: 12, color: theme.textSecondary,
                                                    lineHeight: 1.5, flex: 1,
                                                }}>
                                                    {log.details}
                                                </span>
                                            </div>

                                            {/* IP */}
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <span style={mobileLabel}>IP</span>
                                                <code style={{
                                                    fontSize: 11, color: theme.textMuted,
                                                    background: theme.innerBg,
                                                    border: `1px solid ${theme.border}`,
                                                    padding: "3px 7px", borderRadius: 4,
                                                }}>
                                                    {log.ip_address}
                                                </code>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        // ── TABLET + DESKTOP: Full 5-column table ────────────
                        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                            <table
                                className="portal-table"
                                style={{
                                    borderColor: theme.divider,
                                    minWidth: isTablet ? 680 : 800,
                                }}
                            >
                                <thead>
                                    <tr style={{
                                        background: theme.tableHeaderBg || (theme.isDark ? theme.innerBg : "#f8fafc"),
                                        borderColor: theme.divider,
                                    }}>
                                        <th style={{ color: theme.textSecondary }}>Timestamp</th>
                                        <th style={{ color: theme.textSecondary }}>User</th>
                                        <th style={{ color: theme.textSecondary }}>Action Type</th>
                                        <th style={{ color: theme.textSecondary }}>Details</th>
                                        {!isTablet && <th style={{ color: theme.textSecondary }}>IP Address</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={isTablet ? 4 : 5} style={{
                                                padding: 40, textAlign: "center",
                                                color: theme.textMuted
                                            }}>
                                                Loading audit logs...
                                            </td>
                                        </tr>
                                    ) : filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={isTablet ? 4 : 5} style={{
                                                padding: 40, textAlign: "center",
                                                color: theme.textMuted
                                            }}>
                                                No logs found matching your filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedLogs.map(log => {
                                            const date = new Date(log.timestamp);
                                            const formattedDate = date.toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            });
                                            const formattedTime = date.toLocaleTimeString('en-US', {
                                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                                            });

                                            return (
                                                <tr
                                                    key={log.id}
                                                    style={{
                                                        borderBottom: `1px solid ${theme.divider}`,
                                                        transition: "background 0.2s",
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background =
                                                        theme.tableHover || (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                >
                                                    {/* Timestamp */}
                                                    <td style={tdStyle(isTablet)}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                            <Clock size={13} color={theme.textMuted} />
                                                            <span style={{
                                                                fontSize: 13, fontWeight: 600,
                                                                color: theme.textPrimary,
                                                                whiteSpace: "nowrap",
                                                            }}>
                                                                {formattedDate}
                                                            </span>
                                                        </div>
                                                        <div style={{
                                                            fontSize: 11, color: theme.textMuted,
                                                            marginTop: 4, marginLeft: 19,
                                                            whiteSpace: "nowrap",
                                                        }}>
                                                            {formattedTime}
                                                        </div>
                                                    </td>

                                                    {/* User */}
                                                    <td style={tdStyle(isTablet)}>
                                                        <div style={{
                                                            fontWeight: 600, color: theme.textPrimary,
                                                            fontSize: 13, whiteSpace: "nowrap",
                                                        }}>
                                                            {log.userDisplay}
                                                        </div>
                                                    </td>

                                                    {/* Action */}
                                                    <td style={tdStyle(isTablet)}>
                                                        <Badge type={getActionColor(log.action)}>
                                                            {log.action}
                                                        </Badge>
                                                    </td>

                                                    {/* Details — always its own column, truncated on tablet */}
                                                    <td style={tdStyle(isTablet)}>
                                                        <div
                                                            title={log.details}
                                                            style={{
                                                                fontSize: 13,
                                                                color: theme.textSecondary,
                                                                maxWidth: isTablet ? 160 : 280,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {log.details}
                                                        </div>
                                                    </td>

                                                    {/* IP Address — hidden on tablet to save space */}
                                                    {!isTablet && (
                                                        <td style={tdStyle(isTablet)}>
                                                            <code style={{
                                                                fontSize: 11, color: theme.textMuted,
                                                                background: theme.innerBg,
                                                                border: `1px solid ${theme.border}`,
                                                                padding: "3px 7px", borderRadius: 4,
                                                                whiteSpace: "nowrap",
                                                            }}>
                                                                {log.ip_address || "—"}
                                                            </code>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </Card>
            </div>
            </main>
        </div>
    );
}

// ─── Style helpers ──────────────────────────────────────────────────────────
const thStyle = (theme, isTablet) => ({
    padding: isTablet ? "12px 12px" : "14px 16px",
    fontSize: 11,
    fontWeight: 800,
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    textAlign: "left",
    whiteSpace: "nowrap",
});

const tdStyle = (isTablet) => ({
    padding: isTablet ? "12px 12px" : "14px 16px",
    verticalAlign: "middle",
});

// Mobile stacked row label style
const mobileLabel = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#94A3B8",
    minWidth: 48,
    flexShrink: 0,
};
