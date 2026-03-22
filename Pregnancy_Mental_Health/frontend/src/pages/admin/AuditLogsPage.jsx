import React, { useState, useEffect } from 'react';
import { useTheme } from "../../ThemeContext";
import AdminSidebar from "../../components/AdminSidebar";
import { PageTitle, Divider, Card, Badge, Pagination } from "../../components/UI";
import { getAuditLogs } from "../../utils/dummyData";
import { Calendar, Clock, Search, Filter, Download, ChevronDown } from "lucide-react";
import { exportToPDF, exportToExcel, exportToCSV } from "../../utils/exportUtils";

export default function AuditLogsPage() {
    const { theme } = useTheme();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchUser, setSearchUser] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const data = await getAuditLogs();
        setLogs(data);
        setLoading(false);
    };

    const filteredLogs = logs.filter(log => {
        const matchesUser = log.user.toLowerCase().includes(searchUser.toLowerCase()) ||
            log.details.toLowerCase().includes(searchUser.toLowerCase());
        const matchesAction = actionFilter === "all" || log.action.toLowerCase() === actionFilter.toLowerCase();

        // Simple date string matching on YYYY-MM-DD
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

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
            <AdminSidebar />
            <main style={{ flex: 1, marginLeft: 260, padding: "40px 48px", boxSizing: "border-box" }}>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <PageTitle title="Audit Logs" subtitle="Comprehensive system-wide action tracking for security and compliance" />
                </div>
                <Divider style={{ marginBottom: 24 }} />

                <Card style={{ padding: 0, overflow: "hidden" }}>

                    {/* Custom Toolbar Layout with date picker in center */}
                    <div style={{
                        padding: "20px 24px",
                        borderBottom: `1px solid ${theme.border}`,
                        display: "flex",
                        gap: 16,
                        alignItems: "center",
                        background: theme.innerBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
                        flexWrap: "wrap",
                        justifyContent: "space-between"
                    }}>
                        {/* Search Input */}
                        <div style={{ position: "relative", flex: 1, maxWidth: 320, minWidth: 200 }}>
                            <Search size={18} style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: theme.textMuted
                            }} />
                            <input
                                type="text"
                                placeholder="Search user or details..."
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                style={{
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
                                }}
                            />
                        </div>

                        {/* Date Picker in Center */}
                        <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 8,
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)"
                        }}>
                            <Calendar size={18} color={theme.textMuted} />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                                style={selectStyle(theme)}
                            />
                        </div>

                        {/* Right-aligned group: Filter + Export + Clear */}
                        <div style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            flexWrap: "wrap",
                            marginLeft: "auto"
                        }}>
                            {/* Filter Dropdown */}
                            <div style={{ position: "relative" }}>
                                <button
                                    style={{
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
                                    }}
                                    onClick={() => {
                                        // Toggle filter dropdown - simplified for now
                                        const filters = [
                                            { label: "All Actions", value: "all" },
                                            { label: "User Created", value: "User Created" },
                                            { label: "Password Reset", value: "Password Reset" },
                                            { label: "Assessment Approved", value: "Assessment Approved" },
                                            { label: "Mood Logged", value: "Mood Logged" },
                                            { label: "System Action", value: "System Action" },
                                        ];
                                        // Simple filter implementation
                                        const newFilter = prompt("Enter filter value (all, User Created, Password Reset, etc.):", actionFilter);
                                        if (newFilter !== null) {
                                            setActionFilter(newFilter);
                                        }
                                    }}
                                >
                                    <Filter size={18} />
                                    Filter
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {/* Export Dropdown */}
                            <div style={{ position: "relative" }}>
                                <button
                                    style={{
                                        padding: "10px 22px",
                                        minWidth: 130,
                                        borderRadius: 8,
                                        background: theme.primary,
                                        color: "white",
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        position: "relative"
                                    }}
                                    onClick={() => {
                                        // Simple export implementation
                                        const exportType = prompt("Export as: PDF, Excel, or CSV?", "PDF");
                                        if (exportType) {
                                            if (exportType.toLowerCase() === 'pdf') {
                                                exportToPDF(
                                                    filteredLogs,
                                                    'Audit Logs',
                                                    [
                                                        { header: 'Timestamp', accessor: (item) => new Date(item.timestamp).toLocaleString() },
                                                        { header: 'User', accessor: 'user' },
                                                        { header: 'Action', accessor: 'action' },
                                                        { header: 'Details', accessor: 'details' },
                                                        { header: 'IP', accessor: 'ip' },
                                                    ],
                                                    'audit-logs'
                                                );
                                            } else if (exportType.toLowerCase() === 'excel') {
                                                exportToExcel(
                                                    filteredLogs.map(l => ({
                                                        Timestamp: new Date(l.timestamp).toLocaleString(),
                                                        User: l.user,
                                                        Action: l.action,
                                                        Details: l.details,
                                                        IP: l.ip,
                                                    })),
                                                    'Audit Logs',
                                                    'audit-logs'
                                                );
                                            } else if (exportType.toLowerCase() === 'csv') {
                                                exportToCSV(
                                                    filteredLogs.map(l => ({
                                                        Timestamp: new Date(l.timestamp).toLocaleString(),
                                                        User: l.user,
                                                        Action: l.action,
                                                        Details: l.details,
                                                        IP: l.ip,
                                                    })),
                                                    'audit-logs'
                                                );
                                            }
                                        }
                                    }}
                                >
                                    <Download size={18} />
                                    Export
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {/* Clear Button */}
                            {(searchUser || actionFilter !== 'all' || dateFilter) && (
                                <button
                                    onClick={() => { setSearchUser(""); setActionFilter("all"); setDateFilter(""); }}
                                    style={{ background: "none", border: "none", color: theme.primary, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ background: theme.tableHeaderBg || (theme.isDark ? theme.innerBg : "white"), borderBottom: `2px solid ${theme.divider}` }}>
                                    <th style={thStyle(theme)}>Timestamp</th>
                                    <th style={thStyle(theme)}>User</th>
                                    <th style={thStyle(theme)}>Action Type</th>
                                    <th style={thStyle(theme)}>Details</th>
                                    <th style={thStyle(theme)}>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>Loading audit logs...</td></tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>No logs found matching your filters.</td></tr>
                                ) : (
                                    paginatedLogs.map(log => {
                                        const date = new Date(log.timestamp);
                                        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                        const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                                        return (
                                            <tr key={log.id}
                                                style={{ borderBottom: `1px solid ${theme.divider}`, transition: "background 0.2s" }}
                                                onMouseEnter={e => e.currentTarget.style.background = theme.tableHover || (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            >
                                                <td style={tdStyle}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                        <Clock size={14} color={theme.textMuted} />
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{formattedDate}</span>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, marginLeft: 20 }}>{formattedTime}</div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: 600, color: theme.textPrimary, fontSize: 13 }}>{log.user}</div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <Badge type={getActionColor(log.action)}>{log.action}</Badge>
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ fontSize: 13, color: theme.textSecondary }}>{log.details}</div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <code style={{ fontSize: 12, color: theme.textMuted, background: theme.innerBg, border: `1px solid ${theme.border}`, padding: "4px 8px", borderRadius: 4 }}>
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
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </Card>

            </main>

            {/* Removed inline style */}
        </div>
    );
}

// Styles
const thStyle = (theme) => ({
    padding: "16px 24px", fontSize: 12, fontWeight: 800, color: theme.textSecondary,
    textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left"
});

const tdStyle = {
    padding: "16px 24px", verticalAlign: "middle"
};

const selectStyle = (theme) => ({
    padding: "10px", borderRadius: 8, border: `1px solid ${theme.border}`,
    fontSize: 14, background: theme.inputBg, color: theme.textPrimary, cursor: "pointer", fontFamily: "inherit", outline: "none"
});
