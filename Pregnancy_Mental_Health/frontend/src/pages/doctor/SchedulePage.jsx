import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import DoctorSidebar from "../../components/DoctorSidebar";
import { api } from "../../utils/api";
import toast from "react-hot-toast";
import { PageTitle, Loader2 } from "../../components/UI";
import {
    Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight,
    User, CheckCircle, XCircle, AlertTriangle, FileText,
    Search, CheckSquare, Ban, Stethoscope, AlertCircle, X
} from "lucide-react";
import { getAvatarColor } from "../../utils/helpers";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    pending:   { label: "Pending",   color: "#F59E0B", bg: "#FEF3C7" },
    confirmed: { label: "Confirmed", color: "#10B981", bg: "#D1FAE5" },
    completed: { label: "Completed", color: "#6366F1", bg: "#EDE9FE" },
    cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEE2E2" },
    "no-show": { label: "No-Show",   color: "#6B7280", bg: "#F3F4F6" },
};
const RISK_CONFIG = {
    "High Risk":     { color: "#EF4444", bg: "#FEE2E2", label: "High" },
    "High":          { color: "#EF4444", bg: "#FEE2E2", label: "High" },
    "Moderate Risk": { color: "#F59E0B", bg: "#FEF3C7", label: "Moderate" },
    "Medium Risk":   { color: "#F59E0B", bg: "#FEF3C7", label: "Moderate" },
    "Medium":        { color: "#F59E0B", bg: "#FEF3C7", label: "Moderate" },
    "Low Risk":      { color: "#10B981", bg: "#D1FAE5", label: "Low" },
    "Low":           { color: "#10B981", bg: "#D1FAE5", label: "Low" },
};
const getRisk   = (l) => RISK_CONFIG[l]   || { color: "#6B7280", bg: "#F3F4F6", label: l || "Unknown" };
const getStatus = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.pending;
const fmtDate   = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtTime   = (t) => {
    if (!t) return "—";
    const [h, m] = t.split(":");
    const hr = parseInt(h, 10);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
};

// ─── Mini Calendar Dropdown ────────────────────────────────────────────────────
const CalendarDropdown = ({ selectedDate, onSelect, onClose, theme }) => {
    const [navDate, setNavDate] = useState(selectedDate ? new Date(selectedDate + "T00:00:00") : new Date());

    const calDays = (() => {
        const y = navDate.getFullYear(), m = navDate.getMonth();
        const firstDay = new Date(y, m, 1).getDay();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= new Date(y, m + 1, 0).getDate(); i++) days.push(new Date(y, m, i));
        return days;
    })();

    return (
        <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 999,
            background: theme.cardBg || "#fff", borderRadius: 16, padding: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: `1px solid ${theme.glassBorder}`,
            width: 260,
        }}>
            {/* Quick filters */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {[
                    { label: "Today",     offset: 0 },
                    { label: "Tomorrow",  offset: 1 },
                    { label: "This Week", offset: null },
                ].map(({ label, offset }) => (
                    <button key={label} onClick={() => {
                        if (offset === null) { onSelect("week"); onClose(); return; }
                        const d = new Date(); d.setDate(d.getDate() + offset);
                        onSelect(d.toISOString().split("T")[0]); onClose();
                    }} style={{
                        padding: "5px 12px", borderRadius: 8, border: `1px solid ${theme.glassBorder}`,
                        background: "transparent", color: theme.textPrimary, cursor: "pointer",
                        fontWeight: 700, fontSize: 11,
                    }}>{label}</button>
                ))}
                <button onClick={() => { onSelect(null); onClose(); }} style={{
                    padding: "5px 12px", borderRadius: 8, border: `1px solid ${theme.glassBorder}`,
                    background: "transparent", color: theme.textMuted, cursor: "pointer", fontWeight: 700, fontSize: 11,
                }}>All Dates</button>
            </div>

            {/* Month nav */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <button onClick={() => setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1))}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.textMuted, display: "flex" }}>
                    <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 800, color: theme.textPrimary }}>
                    {navDate.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1))}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: theme.textMuted, display: "flex" }}>
                    <ChevronRight size={16} />
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                {["S","M","T","W","T","F","S"].map((d, i) => (
                    <div key={i} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: theme.textMuted }}>{d}</div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {calDays.map((date, idx) => {
                    const ds = date?.toISOString().split("T")[0];
                    const isToday    = date && date.toDateString() === new Date().toDateString();
                    const isSelected = ds === selectedDate;
                    return (
                        <div key={idx} onClick={() => date && (onSelect(ds), onClose())}
                            style={{
                                height: 30, borderRadius: 6, display: "flex", alignItems: "center",
                                justifyContent: "center", cursor: date ? "pointer" : "default", fontSize: 11,
                                background: isSelected ? theme.primary : isToday ? theme.primary + "18" : "transparent",
                                color: isSelected ? "white" : isToday ? theme.primary : theme.textSecondary,
                                fontWeight: isToday || isSelected ? 800 : 400,
                            }}>
                            {date?.getDate()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const SchedulePage = () => {
    const { theme } = useTheme();
    const navigate  = useNavigate();
    const calRef    = useRef(null);

    const today = new Date().toISOString().split("T")[0];

    const [loading, setLoading]           = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [selected, setSelected]         = useState(null);
    const [filter, setFilter]             = useState("upcoming");
    const [searchQ, setSearchQ]           = useState("");
    const [dateFilter, setDateFilter]     = useState(null); // null = all, "week" = this week, or "YYYY-MM-DD"
    const [calOpen, setCalOpen]           = useState(false);
    const [updatingId, setUpdatingId]     = useState(null);

    // Close calendar on outside click
    useEffect(() => {
        const handler = (e) => { if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
    
            const { data } = await api.get("/doctor/appointments");
    
            console.log("API DATA:", data);  // 🔍 debug
    
            setAppointments(data || []);
            setSelected(data?.find(a => a.date === today) || data?.[0] || null);
    
        } catch (err) {
            console.error("Error loading appointments:", err.message);
            toast.error("Failed to load appointments");
    
            setAppointments([]);
            setSelected(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Status update ──────────────────────────────────────────────────────────
    const updateStatus = async (appt, newStatus) => {
        setUpdatingId(appt.id);
        try {
            const res = await api.patch(`/doctor/appointments/${appt.id}/status`, { status: newStatus });
            if (!res.response.ok) throw new Error();
            if (!window.confirm("Mark this appointment as completed?")) return;
            toast.success(`Marked as ${newStatus}`);
        } catch (_) {
            toast.success(`Marked as ${newStatus} (mock)`);
        }
        const updated = { ...appt, status: newStatus };
        setAppointments(prev => prev.map(a => a.id === appt.id ? updated : a));
        if (selected?.id === appt.id) setSelected(updated);
        setUpdatingId(null);
    };

    const [modalOpen, setModalOpen] = useState(false);

    // ── Derived stats ──────────────────────────────────────────────────────────
    const todayCount     = appointments.filter(a => a.date === today).length;
    const pendingCount   = appointments.filter(a => a.status === "pending").length;
    const highRiskToday  = appointments.filter(a => a.date === today && (a.risk_level || "").toLowerCase().includes("high")).length;
    const completedCount = appointments.filter(a => a.status === "completed").length;

    // ── Filtering ──────────────────────────────────────────────────────────────
    const getWeekRange = () => {
        const start = new Date(); start.setDate(start.getDate() - start.getDay());
        const end   = new Date(start); end.setDate(end.getDate() + 6);
        return [start.toISOString().split("T")[0], end.toISOString().split("T")[0]];
    };

    const filtered = appointments.filter(a => {
        if (searchQ && !a.patient_name?.toLowerCase().includes(searchQ.toLowerCase())) return false;
        if (dateFilter === "week") {
            const [ws, we] = getWeekRange();
            if (a.date < ws || a.date > we) return false;
        } else if (dateFilter) {
            if (a.date !== dateFilter) return false;
        }
        if (filter === "pending")   return a.status === "pending";
        if (filter === "confirmed") return a.status === "confirmed";
        if (filter === "completed") return a.status === "completed";
        if (filter === "cancelled") return a.status === "cancelled" || a.status === "no-show";
        if (filter === "upcoming")  return a.date >= today && !["completed","cancelled"].includes(a.status);
        return true;
    }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    // ── Date button label ──────────────────────────────────────────────────────
    const dateBtnLabel = (() => {
        if (!dateFilter)             return "All Dates";
        if (dateFilter === "week")   return "This Week";
        if (dateFilter === today)    return `Today · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
        return new Date(dateFilter + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    })();

    if (loading) return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: theme.pageBg }}>
            <Loader2 size={48} className="animate-spin" color={theme.primary} />
        </div>
    );

    const card = {
        background: "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 16,
        border: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        ...(theme.isDark && {
            background: "rgba(26, 36, 51, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }),
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg }}>
            <DoctorSidebar />
            <main className="portal-main" style={{ background: theme.pageBg }}>

                {/* ── Header: Title + Calendar button ── */}
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <PageTitle title="Appointments Overview" subtitle="Clinical schedule — confirm, review, and action patient appointments" />
                    <div ref={calRef} style={{ position: "relative" }}>
                        <button onClick={() => setCalOpen(o => !o)} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
                            background: theme.primary, color: "white", border: "none",
                            boxShadow: `0 4px 14px ${theme.primary}40`,
                        }}>
                            <CalendarIcon size={15} /> {dateBtnLabel}
                        </button>
                        {calOpen && (
                            <CalendarDropdown
                                selectedDate={typeof dateFilter === "string" && dateFilter !== "week" ? dateFilter : null}
                                onSelect={setDateFilter}
                                onClose={() => setCalOpen(false)}
                                theme={theme}
                            />
                        )}
                    </div>
                </header>

                {/* ── KPI Cards ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                    {[
                        { icon: <CalendarIcon size={18} />, label: "Today's Appointments", value: todayCount,     accent: theme.primary },
                        { icon: <AlertCircle  size={18} />, label: "Pending Confirmation",  value: pendingCount,   accent: "#F59E0B" },
                        { icon: <AlertTriangle size={18} />,label: "High-Risk Today",        value: highRiskToday,  accent: "#EF4444" },
                        { icon: <CheckCircle  size={18} />, label: "Completed",              value: completedCount, accent: "#10B981" },
                    ].map(({ icon, label, value, accent }) => (
                        <div key={label} style={{ ...card, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: accent + "20", display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
                                {icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, lineHeight: 1 }}>{value}</div>
                                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main: Table (left) + Patient Details (right, sticky top) ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }}>

                    {/* ── Left: Table + Filter bar ── */}
                    <div>
                        {/* Filter bar */}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, background: theme.cardBg, border: `1px solid ${theme.glassBorder}`, borderRadius: 10, padding: "8px 14px", flex: 1, minWidth: 160 }}>
                                <Search size={14} color={theme.textMuted} />
                                <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                                    placeholder="Search patient name..."
                                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: theme.textPrimary, fontSize: 13 }} />
                                {searchQ && <button onClick={() => setSearchQ("")} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, display: "flex" }}><X size={13} /></button>}
                            </div>
                            <div style={{ position: "relative" }}>
                                <select value={filter} onChange={e => setFilter(e.target.value)} style={{
                                    padding: "9px 32px 9px 12px", borderRadius: 10, fontFamily: "inherit",
                                    border: `1px solid ${filter !== "upcoming" ? theme.primary + "60" : theme.glassBorder}`,
                                    background: filter !== "upcoming" ? theme.primary + "10" : theme.cardBg,
                                    color: filter !== "upcoming" ? theme.primary : theme.textPrimary,
                                    fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none",
                                    appearance: "none", WebkitAppearance: "none",
                                }}>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">No-Show / Cancelled</option>
                                    <option value="all">All</option>
                                </select>
                                <ChevronRight size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%) rotate(90deg)", color: theme.textMuted, pointerEvents: "none" }} />
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ ...card, overflow: "hidden" }}>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                                    <thead>
                                        <tr style={{ background: theme.tableHeaderBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"), borderBottom: `2px solid ${theme.glassBorder}` }}>
                                            {["Patient", "Date", "Time", "Type", "Risk", "Status"].map(h => (
                                                <th key={h} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: theme.textMuted }}>
                                                    <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
                                                    <div style={{ fontWeight: 700, fontSize: 14 }}>No appointments found</div>
                                                    <div style={{ fontSize: 12, marginTop: 4 }}>Try changing the date or status filter</div>
                                                </td>
                                            </tr>
                                        ) : filtered.map(appt => {
                                            const risk   = getRisk(appt.risk_level);
                                            const status = getStatus(appt.status);
                                            const active = selected?.id === appt.id;
                                            return (
                                                <tr key={appt.id} onClick={() => setSelected(appt)} style={{
                                                    borderBottom: `1px solid ${theme.glassBorder}`,
                                                    background: active ? theme.primary + "08" : "transparent",
                                                    borderLeft: `3px solid ${active ? theme.primary : "transparent"}`,
                                                    cursor: "pointer", transition: "background 0.15s",
                                                }}
                                                onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = active ? theme.primary + "08" : "transparent"; }}
                                                >
                                                    <td style={{ padding: "11px 14px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                                                                background: getAvatarColor(appt.patient_name) + "25",
                                                                color: getAvatarColor(appt.patient_name),
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                fontWeight: 800, fontSize: 13 }}>
                                                                {appt.patient_name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary, whiteSpace: "nowrap" }}>{appt.patient_name}</div>
                                                                <div style={{ fontSize: 11, color: theme.textMuted }}>
                                                                    {[appt.patient_age && `Age ${appt.patient_age}`, appt.pregnancy_week && `Wk ${appt.pregnancy_week}`].filter(Boolean).join(" · ")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "11px 14px", fontSize: 12, color: theme.textPrimary, whiteSpace: "nowrap" }}>{fmtDate(appt.date)}</td>
                                                    <td style={{ padding: "11px 14px", fontSize: 12, color: theme.textMuted, whiteSpace: "nowrap" }}>{fmtTime(appt.time)}</td>
                                                    <td style={{ padding: "11px 14px" }}>
                                                        <div style={{ fontSize: 12, color: theme.textPrimary, whiteSpace: "nowrap" }}>{appt.type}</div>
                                                        {appt.urgency && appt.urgency !== "Routine" && (
                                                            <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "#FEE2E2", padding: "1px 6px", borderRadius: 20, display: "inline-block", marginTop: 2 }}>{appt.urgency}</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "11px 14px" }}>
                                                        {appt.risk_level
                                                            ? <span style={{ fontSize: 11, fontWeight: 700, color: risk.color, background: risk.bg, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{risk.label} Risk</span>
                                                            : <span style={{ color: theme.textMuted, fontSize: 12 }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: "11px 14px" }}>
                                                        <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: status.bg, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{status.label}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Patient Details Card (sticky) ── */}
                    <div style={{
                        position: "sticky", top: 16,
                        borderRadius: 20,
                        overflow: "hidden",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
                        border: theme.isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
                        background: theme.isDark ? "#111827" : "#ffffff",
                    }}>
                        {!selected ? (
                            <div style={{ padding: "48px 32px", textAlign: "center" }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#e0f2fe,#bae6fd)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                    <User size={24} color="#0284c7" />
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: theme.isDark ? "#94A3B8" : "#374151", marginBottom: 6 }}>No appointment selected</div>
                                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Click any row in the table to view patient details</div>
                            </div>
                        ) : (() => {
                            const risk   = getRisk(selected.risk_level);
                            const status = getStatus(selected.status);
                            return (
                                <>
                                    {/* ── Hero header with gradient ── */}
                                    <div style={{
                                        padding: "24px 24px 20px",
                                        background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
                                        position: "relative", overflow: "hidden",
                                    }}>
                                        {/* Decorative circles */}
                                        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                                        <div style={{ position: "absolute", bottom: -30, left: "30%", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

                                        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 16 }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                                                background: "rgba(255,255,255,0.15)",
                                                border: "2px solid rgba(255,255,255,0.3)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontWeight: 900, fontSize: 22, color: "white",
                                                letterSpacing: "-0.5px",
                                            }}>
                                                {selected.patient_name?.charAt(0)}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: "white", letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {selected.patient_name}
                                                </div>
                                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3, fontWeight: 500 }}>
                                                    {[selected.patient_age && `Age ${selected.patient_age}`, selected.pregnancy_week && `Week ${selected.pregnancy_week}`].filter(Boolean).join("  ·  ")}
                                                </div>
                                                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: "rgba(255,255,255,0.92)", padding: "3px 10px", borderRadius: 99 }}>{status.label}</span>
                                                    {selected.risk_level && (
                                                        <span style={{ fontSize: 11, fontWeight: 700, color: risk.color, background: "rgba(255,255,255,0.92)", padding: "3px 10px", borderRadius: 99 }}>{risk.label} Risk</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Score cards ── */}
                                    <div style={{ padding: "16px 20px 0", display: "flex", gap: 10 }}>
                                        <div style={{
                                            flex: 1, padding: "14px 12px", borderRadius: 14, textAlign: "center",
                                            background: risk.bg,
                                            border: `1px solid ${risk.color}22`,
                                        }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: risk.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>PPD Risk</div>
                                            <div style={{ fontSize: 20, fontWeight: 900, color: risk.color, letterSpacing: "-0.5px" }}>{risk.label}</div>
                                            {selected.risk_score != null && (
                                                <div style={{ fontSize: 11, color: risk.color, opacity: 0.7, marginTop: 2, fontWeight: 600 }}>{selected.risk_score.toFixed(1)}%</div>
                                            )}
                                        </div>
                                        {selected.epds_score != null && (
                                            <div style={{
                                                flex: 1, padding: "14px 12px", borderRadius: 14, textAlign: "center",
                                                background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                                                border: "1px solid #fde68a",
                                            }}>
                                                <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>EPDS</div>
                                                <div style={{ fontSize: 20, fontWeight: 900, color: "#78350f", letterSpacing: "-0.5px" }}>
                                                    {selected.epds_score}<span style={{ fontSize: 12, fontWeight: 500, color: "#92400e" }}>/30</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: "#92400e", opacity: 0.8, marginTop: 2, fontWeight: 600 }}>
                                                    {selected.epds_score >= 13 ? "Likely depression" : selected.epds_score >= 10 ? "Borderline" : "Normal"}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Quick info rows ── */}
                                    <div style={{ padding: "14px 20px 0" }}>
                                        {[
                                            ["Date",  fmtDate(selected.date)],
                                            ["Time",  fmtTime(selected.time)],
                                            ["Type",  selected.type],
                                            ["Dept.", selected.department],
                                        ].map(([label, val]) => (
                                            <div key={label} style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                padding: "9px 0",
                                                borderBottom: `1px solid ${theme.isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`,
                                            }}>
                                                <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{label}</span>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: theme.isDark ? "#F1F5F9" : "#111827", maxWidth: "55%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val || "—"}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── View Full Details button ── */}
                                    <div style={{ padding: "16px 20px 20px" }}>
                                        <button
                                            onClick={() => setModalOpen(true)}
                                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(13,148,136,0.45)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(13,148,136,0.3)"; }}
                                            style={{
                                                width: "100%", padding: "13px 0", borderRadius: 14, border: "none",
                                                background: "linear-gradient(135deg, #0f766e, #14b8a6)",
                                                color: "white", fontWeight: 800, fontSize: 14,
                                                cursor: "pointer", letterSpacing: "0.01em",
                                                boxShadow: "0 6px 18px rgba(13,148,136,0.3)",
                                                transition: "all 0.2s ease",
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                            }}>
                                            View Full Details
                                            <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* ── Full Details Modal ── */}
                    {modalOpen && selected && (() => {
                        const risk    = getRisk(selected.risk_level);
                        const status  = getStatus(selected.status);
                        const factors = selected.top_risk_factors || [];
                        return (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
                                onClick={() => setModalOpen(false)}>
                                <div style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", borderRadius: 20, background: theme.isDark ? "#1a2433" : "#ffffff", boxShadow: "0 24px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}
                                    onClick={e => e.stopPropagation()} className="hide-scrollbar">

                                    {/* Modal header */}
                                    <div style={{ padding: "20px 24px", background: "linear-gradient(135deg,#0EA5A4,#14B8A6)", display: "flex", alignItems: "center", gap: 14 }}>
                                        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "white", flexShrink: 0 }}>
                                            {selected.patient_name?.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 17, fontWeight: 800, color: "white" }}>{selected.patient_name}</div>
                                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                                                {[selected.patient_age && `Age ${selected.patient_age}`, selected.pregnancy_week && `Week ${selected.pregnancy_week}`].filter(Boolean).join(" · ")}
                                            </div>
                                            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: "rgba(255,255,255,0.9)", padding: "2px 9px", borderRadius: 20 }}>{status.label}</span>
                                                {selected.risk_level && <span style={{ fontSize: 11, fontWeight: 700, color: risk.color, background: "rgba(255,255,255,0.9)", padding: "2px 9px", borderRadius: 20 }}>{risk.label} Risk</span>}
                                            </div>
                                        </div>
                                        <button onClick={() => setModalOpen(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "6px 10px", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>✕</button>
                                    </div>

                                    {/* Appointment Info */}
                                    <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9" }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Appointment Info</div>
                                        {[
                                            ["Date",         fmtDate(selected.date)],
                                            ["Time",         fmtTime(selected.time)],
                                            ["Type",         selected.type],
                                            ["Urgency",      selected.urgency],
                                            ["Department",   selected.department],
                                            selected.submitted_by_nurse ? ["Submitted by", selected.submitted_by_nurse] : null,
                                        ].filter(Boolean).map(([label, val]) => (
                                            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, borderBottom: "1px solid #F8FAFC" }}>
                                                <span style={{ color: "#94A3B8", fontWeight: 500 }}>{label}</span>
                                                <span style={{ color: theme.isDark ? "#F1F5F9" : "#1E293B", fontWeight: 700 }}>{val || "—"}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Clinical Summary */}
                                    <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9" }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Clinical Summary</div>
                                        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                                            <div style={{ flex: 1, padding: 14, borderRadius: 12, textAlign: "center", background: `linear-gradient(135deg,${risk.bg},${risk.bg}cc)`, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                                                <div style={{ fontSize: 10, fontWeight: 700, color: risk.color, textTransform: "uppercase", marginBottom: 4 }}>PPD Risk</div>
                                                <div style={{ fontSize: 22, fontWeight: 800, color: risk.color }}>{risk.label}</div>
                                                {selected.risk_score != null && <div style={{ fontSize: 11, color: risk.color + "bb", marginTop: 2 }}>{selected.risk_score.toFixed(1)}%</div>}
                                            </div>
                                            {selected.epds_score != null && (
                                                <div style={{ flex: 1, padding: 14, borderRadius: 12, textAlign: "center", background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                                                    <div style={{ fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase", marginBottom: 4 }}>EPDS Score</div>
                                                    <div style={{ fontSize: 22, fontWeight: 800, color: "#78350F" }}>{selected.epds_score}<span style={{ fontSize: 13, fontWeight: 500 }}>/30</span></div>
                                                    <div style={{ fontSize: 11, color: "#92400E", marginTop: 2 }}>{selected.epds_score >= 13 ? "Likely depression" : selected.epds_score >= 10 ? "Borderline" : "Normal"}</div>
                                                </div>
                                            )}
                                        </div>
                                        {factors.length > 0 && (
                                            <>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Top Risk Factors</div>
                                                {factors.slice(0, 5).map((f, i) => {
                                                    const name   = typeof f === "object" ? (f.feature || f.name || `Factor ${i+1}`) : f;
                                                    const impact = typeof f === "object" ? (f.shap_value || null) : null;
                                                    return (
                                                        <div key={i} style={{ marginBottom: 10 }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                                <span style={{ fontSize: 12, color: theme.isDark ? "#CBD5E1" : "#334155", fontWeight: 600 }}>{name}</span>
                                                                {impact != null && <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 700 }}>+{impact.toFixed(2)}</span>}
                                                            </div>
                                                            <div style={{ height: 5, borderRadius: 99, background: "#F1F5F9" }}>
                                                                <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#EF4444,#F59E0B)", width: `${Math.min((impact || 0.3) * 100, 100)}%`, transition: "width 0.4s ease" }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {selected.notes && (
                                        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9" }}>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Clinical Notes</div>
                                            <p style={{ fontSize: 13, color: theme.isDark ? "#CBD5E1" : "#475569", margin: 0, lineHeight: 1.65 }}>{selected.notes}</p>
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                                        {selected.assessment_id && (
                                            <button onClick={() => { setModalOpen(false); navigate(`/doctor/review/${selected.assessment_id}`); }}
                                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                                                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                                                style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#0EA5A4,#14B8A6)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 6px 18px rgba(20,184,166,0.3)", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                                <FileText size={16} /> Open Assessment
                                            </button>
                                        )}
                                        {selected.patient_id && (
                                            <button onClick={() => { setModalOpen(false); navigate(`/doctor/patients/${selected.patient_id}`); }}
                                                onMouseEnter={e => e.currentTarget.style.background = "#E2E8F0"}
                                                onMouseLeave={e => e.currentTarget.style.background = "#F1F5F9"}
                                                style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: "#F1F5F9", color: "#334155", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                                <User size={16} /> View Patient Profile
                                            </button>
                                        )}
                                        {selected.status !== "completed" && (
                                            <button
                                                onClick={() => {
                                                    updateStatus(selected, "completed");
                                                    setModalOpen(false);
                                                }}
                                                disabled={updatingId === selected.id}
                                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                                                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                                                style={{
                                                    width: "100%",
                                                    padding: 13,
                                                    borderRadius: 12,
                                                    border: "none",
                                                    background: "linear-gradient(135deg,#16A34A,#22C55E)",
                                                    color: "white",
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    cursor: "pointer",
                                                    boxShadow: "0 6px 18px rgba(34,197,94,0.3)",
                                                    transition: "all 0.2s ease",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 8,
                                                    opacity: updatingId === selected.id ? 0.6 : 1
                                                }}
                                            >
                                                <CheckCircle size={16} />
                                                {updatingId === selected.id ? "Updating..." : "Mark as Completed"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </main>
        </div>
    );
};

export default SchedulePage;
