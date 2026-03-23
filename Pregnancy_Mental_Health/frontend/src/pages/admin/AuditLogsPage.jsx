import React, { useState, useEffect } from 'react';
import { useTheme } from "../../ThemeContext";
import AdminSidebar from "../../components/AdminSidebar";
import { PageTitle, Divider, Card, Badge, Pagination } from "../../components/UI";
import { getAuditLogs } from "../../utils/dummyData";
import { Calendar, Clock, Search, Filter, Download, ChevronDown, Menu, X } from "lucide-react";
import { exportToPDF, exportToExcel, exportToCSV } from "../../utils/exportUtils";
import ThemeToggle from "../../components/ThemeToggle";

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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [searchUser, setSearchUser] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => { loadLogs(); }, []);

    useEffect(() => {
        if (isDesktop) setSidebarOpen(false);
    }, [isDesktop]);

    useEffect(() => {
        const handler = () => { setShowFilterMenu(false); setShowExportMenu(false); };
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const data = await getAuditLogs();
        setLogs(data);
        setLoading(false);
    };

    const filteredLogs = logs.filter(log => {
        const matchesUser =
            log.user.toLowerCase().includes(searchUser.toLowerCase()) ||
            log.details.toLowerCase().includes(searchUser.toLowerCase());
        const matchesAction =
            actionFilter === "all" || log.action.toLowerCase() === actionFilter.toLowerCase();
        const logDate = log.timestamp.split('T')[0];
        const matchesDate = !dateFilter || logDate === dateFilter;
        return matchesUser && matchesAction && matchesDate;
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
        return 'warning';
    };

    const handleExport = (type) => {
        setShowExportMenu(false);
        const columns = [
            { header: 'Timestamp', accessor: (item) => new Date(item.timestamp).toLocaleString() },
            { header: 'User', accessor: 'user' },
            { header: 'Action', accessor: 'action' },
            { header: 'Details', accessor: 'details' },
            { header: 'IP', accessor: 'ip' },
        ];
        const mapped = filteredLogs.map(l => ({
            Timestamp: new Date(l.timestamp).toLocaleString(),
            User: l.user,
            Action: l.action,
            Details: l.details,
            IP: l.ip,
        }));
        if (type === 'pdf') exportToPDF(filteredLogs, 'Audit Logs', columns, 'audit-logs');
        else if (type === 'excel') exportToExcel(mapped, 'Audit Logs', 'audit-logs');
        else if (type === 'csv') exportToCSV(mapped, 'audit-logs');
    };

    const SIDEBAR_WIDTH = 260;
    const mainMarginLeft = isDesktop ? SIDEBAR_WIDTH : 0;
    const mainPadding = isMobile ? "16px" : isTablet ? "24px 28px" : "40px 48px";
    const mainWidth = isDesktop ? `calc(100% - ${SIDEBAR_WIDTH}px)` : "100%";

    const filterOptions = [
        { label: "All Actions", value: "all" },
        { label: "User Created", value: "User Created" },
        { label: "Password Reset", value: "Password Reset" },
        { label: "Assessment Approved", value: "Assessment Approved" },
        { label: "Mood Logged", value: "Mood Logged" },
        { label: "System Action", value: "System Action" },
    ];

    return (
        <div style={{
            display: "flex", minHeight: "100vh",
            background: theme.pageBg, fontFamily: theme.fontBody
        }}>

            {/* ── Mobile overlay backdrop ── */}
            {!isDesktop && sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 200, backdropFilter: "blur(2px)",
                    }}
                />
            )}

            {/* ── Sidebar drawer ── */}
            <div style={{
                position: "fixed",
                top: 0, left: 0, bottom: 0,
                zIndex: 300, width: SIDEBAR_WIDTH,
                transform: isDesktop
                    ? "translateX(0)"
                    : sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 0.3s ease",
            }}>
                <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* ── Main content ── */}
            <main style={{
                flex: 1,
                marginLeft: mainMarginLeft,
                padding: mainPadding,
                width: mainWidth,
                boxSizing: "border-box",
                minWidth: 0,
                background: theme.pageBg,
                fontFamily: theme.fontBody,
            }}>

                {/* ── Mobile top bar ── */}
                {!isDesktop && (
                    <div style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16, padding: "8px 0",
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
                            Audit Logs
                        </span>
                        <ThemeToggle />
                    </div>
                )}

                {/* ── Page Title ── */}
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 24,
                }}>
                    <PageTitle
                        title="Audit Logs"
                        subtitle={isMobile
                            ? "System action tracking"
                            : "Comprehensive system-wide action tracking for security and compliance"
                        }
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
                            {(searchUser || actionFilter !== 'all' || dateFilter) && (
                                <button
                                    onClick={() => {
                                        setSearchUser("");
                                        setActionFilter("all");
                                        setDateFilter("");
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
                                                    {log.user}
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
                                                    {log.ip}
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
                            <table style={{
                                width: "100%", borderCollapse: "collapse",
                                textAlign: "left",
                                minWidth: isTablet ? 680 : 800, // ensures scroll kicks in before columns collapse
                            }}>
                                <thead>
                                    <tr style={{
                                        background: theme.tableHeaderBg || (theme.isDark ? theme.innerBg : "white"),
                                        borderBottom: `2px solid ${theme.divider}`,
                                    }}>
                                        <th style={thStyle(theme, isTablet)}>Timestamp</th>
                                        <th style={thStyle(theme, isTablet)}>User</th>
                                        <th style={thStyle(theme, isTablet)}>Action Type</th>
                                        <th style={thStyle(theme, isTablet)}>Details</th>
                                        <th style={thStyle(theme, isTablet)}>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} style={{
                                                padding: 40, textAlign: "center",
                                                color: theme.textMuted
                                            }}>
                                                Loading audit logs...
                                            </td>
                                        </tr>
                                    ) : filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{
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
                                                            {log.user}
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

                                                    {/* IP — always its own column */}
                                                    <td style={tdStyle(isTablet)}>
                                                        <code style={{
                                                            fontSize: 11, color: theme.textMuted,
                                                            background: theme.innerBg,
                                                            border: `1px solid ${theme.border}`,
                                                            padding: "3px 7px", borderRadius: 4,
                                                            whiteSpace: "nowrap",
                                                        }}>
                                                            {log.ip}
                                                        </code>
                                                    </td>
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
