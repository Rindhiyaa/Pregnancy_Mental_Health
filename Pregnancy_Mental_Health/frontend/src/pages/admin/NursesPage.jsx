import React, { useState, useEffect } from 'react';
import { useTheme } from "../../ThemeContext";
import AdminLayout from "../../components/AdminLayout";
import FilterToolbar from "../../components/FilterToolbar";
import { PageTitle, Divider, Card, Badge, Pagination } from "../../components/UI";
//import { getUsers, addUser, updateUser, deleteUser, addAuditLog } from "../../utils/dummyData";
import { exportNursesToPDF, exportNursesToExcel, exportNursesToCSV } from "../../utils/exportUtils";
import { Plus, Trash2, ShieldOff, KeyRound, CheckCircle, X, UserCheck, Heart, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { api, addAuditLog, getErrorMessage } from "../../utils/api";

export default function NursesPage() {
    const { theme }  = useTheme();
    const { isMobile, isTablet, isDesktop } = useBreakpoint();

    const [nurses, setNurses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", role: "nurse", ward: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [activeFilter, setActiveFilter] = useState("All");

    useEffect(() => { loadNurses(); }, []);

    const loadNurses = async () => {
        setLoading(true);
        try {
          const { data } = await api.get("/admin/clinicians");
          const clinicians = Array.isArray(data) ? data : [];
          const nursesOnly = clinicians.filter((u) => u.role === "nurse");
      
          const mapped = nursesOnly.map((u) => ({
            id: u.id,
            name: `${u.first_name} ${u.last_name || ""}`.trim(),
            email: u.email,
            phone: u.phone_number || "",
            status: u.is_active ? "active" : "suspended",
            ward: "", // fill later if backend supports it
            joinDate: u.member_since || u.created_at || null,
          }));
      
          setNurses(mapped);
        } catch (err) {
          console.error("loadNurses error", err);
          toast.error("Failed to load nurses");
        } finally {
          setLoading(false);
        }
      };

      const filteredNurses = nurses.filter((u) => {
        const matchesSearch =
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase());
        if (activeFilter === "All") return matchesSearch;
        if (activeFilter === "Active") return matchesSearch && u.status === "active";
        if (activeFilter === "Suspended")
          return matchesSearch && u.status === "suspended";
        return matchesSearch;
      });

    const filterOptions = [
        { value: "All", label: "All Nurses", icon: Heart },
        { value: "Active", label: "Active", icon: UserCheck },
        { value: "Suspended", label: "Suspended", icon: UserX },
    ];

    const handlePDFExport = () => { exportNursesToPDF(filteredNurses); toast.success("PDF exported!"); };
    const handleExcelExport = () => { exportNursesToExcel(filteredNurses); toast.success("Excel exported!"); };
    const handleCSVExport = () => { exportNursesToCSV(filteredNurses); toast.success("CSV exported!"); };

    const totalPages = Math.ceil(filteredNurses.length / itemsPerPage);
    const paginatedNurses = filteredNurses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

   const handleCreateNurse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
        const rawName = (formData.name || "").trim();
        const base = rawName.split(" ")[0].toLowerCase();
        const email = `nurse.${base}@ppdrisk.com`;

        const { data: created } = await api.post("/admin/users", {
        first_name: rawName,
        last_name: "",
        email,
        phone_number: formData.phone,
        password: "TempPass123!",
        role: "nurse",
        });

        try {
        await addAuditLog(
            "User Created",
            `Created nurse ${created.first_name} ${created.last_name || ""} (ID ${created.id})`
        );
        } catch (logErr) {
        console.warn("Audit log failed", logErr);
        }

        toast.success(`Nurse ${rawName} added successfully!`);
        setFormData({ name: "", email: "", phone: "", role: "nurse" });
        setShowModal(false);
        loadNurses();
    } catch (err) {
        console.error(err);
        toast.error(getErrorMessage(err, "Failed to add nurse"));
    } finally {
        setSubmitting(false);
    }
    };

    const handleSuspend = async (id, currentStatus) => {
        const newIsActive = currentStatus !== "active";
        try {
          await api.patch(`/admin/users/${id}/status?is_active=${newIsActive}`);
          toast.success(`Account ${newIsActive ? "activated" : "suspended"}`);
          loadNurses();
        } catch (err) {
          console.error(err);
          toast.error(getErrorMessage(err, "Failed to update status"));
        }
      };
      
      const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete ${name}?`))
          return;
        try {
          await api.delete(`/admin/users/${id}`);
          toast.success("User record deleted");
          loadNurses();
        } catch (err) {
          console.error(err);
          toast.error(getErrorMessage(err, "Failed to delete user"));
        }
      };
      
      const handleResetPassword = async (nurse) => {
        if (!window.confirm(`Reset password for ${nurse.name}?`)) return;
      
        try {
          const { data } = await api.post(
            `/admin/users/${nurse.id}/reset-password`
          );
          console.log("Reset response:", data);
      
          try {
            await addAuditLog(
              "Password Reset",
              `Reset password for ${nurse.name} (ID ${nurse.id})`
            );
          } catch (logErr) {
            console.warn("Audit log failed", logErr);
          }
      
          toast.success("Password reset successfully");
        } catch (err) {
          console.error(err);
          toast.error(getErrorMessage(err, "Failed to reset password"));
        }
      };

    return (
        <AdminLayout pageTitle="Nurses Directory">

            {/* ── Page Header ── */}
            <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "flex-start" : "center",
                gap: isMobile ? 12 : 0,
                marginBottom: 24,
            }}>
                <PageTitle
                    title="Nurses Directory"
                    subtitle={isMobile
                        ? "Manage nursing staff"
                        : "Manage hospital nursing staff and ward assignments"
                    }
                />
                <button
                    onClick={() => setShowModal(true)}
                    style={{
                        ...primaryBtnStyle(theme),
                        alignSelf: isMobile ? "flex-start" : "auto",
                        fontSize: isMobile ? 13 : 14,
                        padding: isMobile ? "8px 14px" : "10px 16px",
                    }}
                >
                    <Plus size={16} />
                    {isMobile ? "Add" : "Add Nurse"}
                </button>
            </div>

            <Divider style={{ marginBottom: 16 }} />

            <Card style={{ padding: 0, overflow: "visible" }}>

                <FilterToolbar
                    searchValue={search}
                    onSearchChange={setSearch}
                    filters={filterOptions}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onPDFExport={handlePDFExport}
                    onExcelExport={handleExcelExport}
                    onCSVExport={handleCSVExport}
                    placeholder="Search by name or email..."
                />

                {/* ── MOBILE: Stacked card rows ── */}
                {isMobile ? (
                    <div style={{ padding: "8px 0" }}>
                        {loading ? (
                            <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>
                                Loading nursing staff...
                            </div>
                        ) : filteredNurses.length === 0 ? (
                            <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>
                                No nurses found.
                            </div>
                        ) : (
                            paginatedNurses.map(nurse => (
                                <div
                                    key={nurse.id}
                                    style={{
                                        padding: "12px 14px",
                                        borderBottom: `1px solid ${theme.divider}`,
                                        background: nurse.status === 'suspended'
                                            ? (theme.isDark ? '#451a1a' : '#fef2f2')
                                            : theme.cardBg,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                    }}
                                >
                                    {/* Name + Status */}
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}>
                                        <div>
                                            <div style={{
                                                fontWeight: 700, color: theme.textPrimary, fontSize: 14,
                                            }}>
                                                {nurse.name}
                                            </div>
                                            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                                                ID: {nurse.id}
                                            </div>
                                        </div>
                                        <StatusBadge status={nurse.status} theme={theme} />
                                    </div>

                                    {/* Ward */}
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <span style={mobileLabelStyle}>Ward</span>
                                        <Badge type="warning">
                                            {nurse.ward || "General Ward"}
                                        </Badge>
                                    </div>

                                    {/* Contact */}
                                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                        <span style={{ ...mobileLabelStyle, paddingTop: 1 }}>Contact</span>
                                        <div>
                                            <div style={{ fontSize: 13, color: theme.textSecondary }}>
                                                {nurse.email}
                                            </div>
                                            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                                                {nurse.phone}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{
                                        display: "flex", gap: 8,
                                        justifyContent: "flex-end",
                                        paddingTop: 4,
                                        borderTop: `1px solid ${theme.divider}`,
                                    }}>
                                        <ActionButtons
                                            onReset={() => handleResetPassword(nurse.name)}
                                            onSuspend={() => handleSuspend(nurse.id, nurse.status)}
                                            onDelete={() => handleDelete(nurse.id, nurse.name)}
                                            status={nurse.status}
                                            theme={theme}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // ── TABLET + DESKTOP: Standard table ──
                    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                        <table style={{
                            width: "100%", borderCollapse: "collapse",
                            textAlign: "left",
                            minWidth: isTablet ? 580 : 720,
                        }}>
                            <thead>
                                <tr style={tableHeaderRowStyle(theme)}>
                                    <th style={thStyle(theme, isTablet)}>Nurse Details</th>
                                    <th style={thStyle(theme, isTablet)}>Ward / Unit</th>
                                    {/* Contact hidden on tablet — shown inside Nurse Details */}
                                    {!isTablet && <th style={thStyle(theme, isTablet)}>Contact</th>}
                                    <th style={thStyle(theme, isTablet)}>Status</th>
                                    <th style={{ ...thStyle(theme, isTablet), textAlign: "right" }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={isTablet ? 4 : 5} style={loadingTdStyle(theme)}>
                                            Loading nursing staff...
                                        </td>
                                    </tr>
                                ) : filteredNurses.length === 0 ? (
                                    <tr>
                                        <td colSpan={isTablet ? 4 : 5} style={loadingTdStyle(theme)}>
                                            No nurses found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedNurses.map(nurse => (
                                        <tr
                                            key={nurse.id}
                                            style={{
                                                ...tableRowStyle(theme, nurse.status),
                                                transition: "background 0.2s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background =
                                                theme.tableHover || (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                                            onMouseLeave={e => e.currentTarget.style.background =
                                                nurse.status === 'suspended'
                                                    ? (theme.isDark ? '#451a1a' : '#fef2f2')
                                                    : theme.cardBg}
                                        >
                                            {/* Nurse Details */}
                                            <td style={tdStyle(isTablet)}>
                                                <div style={{
                                                    fontWeight: 700, color: theme.textPrimary,
                                                    fontSize: isTablet ? 13 : 14,
                                                }}>
                                                    {nurse.name}
                                                </div>
                                                <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
                                                    ID: {nurse.id}
                                                </div>
                                                {/* On tablet: fold email into this cell */}
                                                {isTablet && (
                                                    <div style={{
                                                        fontSize: 11, color: theme.textSecondary,
                                                        marginTop: 3,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        maxWidth: 160,
                                                    }}>
                                                        {nurse.email}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Ward */}
                                            <td style={tdStyle(isTablet)}>
                                                <Badge type="warning">
                                                    {nurse.ward || "General Ward"}
                                                </Badge>
                                            </td>

                                            {/* Contact — desktop only */}
                                            {!isTablet && (
                                                <td style={tdStyle(isTablet)}>
                                                    <div style={{
                                                        fontSize: 13, color: theme.textSecondary,
                                                        whiteSpace: "nowrap",
                                                    }}>
                                                        {nurse.email}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 12, color: theme.textMuted, marginTop: 4,
                                                    }}>
                                                        {nurse.phone}
                                                    </div>
                                                </td>
                                            )}

                                            {/* Status */}
                                            <td style={tdStyle(isTablet)}>
                                                <StatusBadge status={nurse.status} theme={theme} />
                                            </td>

                                            {/* Actions */}
                                            <td style={{ ...tdStyle(isTablet), textAlign: "right" }}>
                                            <ActionButtons
                                                onReset={() => handleResetPassword(nurse)}
                                                onSuspend={() => handleSuspend(nurse.id, nurse.status)}
                                                onDelete={() => handleDelete(nurse.id, nurse.name)}
                                                status={nurse.status}
                                                theme={theme}
                                            />
                                            </td>
                                        </tr>
                                    ))
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

            {/* ── Add Nurse Modal ── */}
            {showModal && (
                <Modal
                    onClose={() => setShowModal(false)}
                    title="Add New Nurse"
                    theme={theme}
                    isMobile={isMobile}
                >
                    <form onSubmit={handleCreateNurse}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={labelStyle(theme)}>Full Name *</label>
                                <input
                                    required type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={inputStyle(theme)}
                                    placeholder="Jane Doe"
                                />
                            </div>
                            <div>
                                <label style={labelStyle(theme)}>Ward / Department</label>
                                <input
                                    type="text"
                                    value={formData.ward}
                                    onChange={e => setFormData({ ...formData, ward: e.target.value })}
                                    style={inputStyle(theme)}
                                    placeholder="e.g. Maternity Ward B"
                                />
                            </div>
                            {/* Email + Phone: side by side on desktop, stacked on mobile */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                                gap: 16,
                            }}>
                                <div>
                                    <label style={labelStyle(theme)}>Email Address *</label>
                                    <input
                                        required type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        style={inputStyle(theme)}
                                        placeholder="jane@hospital.com"
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle(theme)}>Phone Number *</label>
                                    <input
                                        required type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        style={inputStyle(theme)}
                                        placeholder="+1 234 567 8900"
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{
                            marginTop: 24,
                            display: "flex",
                            gap: 12,
                            justifyContent: "flex-end",
                            flexDirection: isMobile ? "column-reverse" : "row",
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                style={{
                                    ...secondaryBtnStyle(theme),
                                    width: isMobile ? "100%" : "auto",
                                    justifyContent: "center",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    ...primaryBtnStyle(theme),
                                    width: isMobile ? "100%" : "auto",
                                    justifyContent: "center",
                                    opacity: submitting ? 0.7 : 1,
                                }}
                            >
                                {submitting ? "Adding..." : "Add Nurse"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AdminLayout>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatusBadge = ({ status, theme }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
            background: status === "active" ? theme.successText : theme.dangerText,
        }} />
        <span style={{
            fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            color: status === "active" ? theme.successText : theme.dangerText,
        }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    </div>
);

const ActionButtons = ({ onReset, onSuspend, onDelete, status, theme }) => (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button onClick={onReset} title="Reset Password" style={actionBtnStyle(theme)}>
            <KeyRound size={15} />
        </button>
        <button
            onClick={onSuspend}
            title={status === 'active' ? "Suspend" : "Activate"}
            style={actionBtnStyle(theme)}
        >
            {status === 'active'
                ? <ShieldOff size={15} color={theme.warningText} />
                : <CheckCircle size={15} color={theme.successText} />
            }
        </button>
        <button
            onClick={onDelete}
            title="Delete"
            style={{
                ...actionBtnStyle(theme),
                color: theme.dangerText,
                borderColor: theme.dangerText + '40',
            }}
        >
            <Trash2 size={15} />
        </button>
    </div>
);

const Modal = ({ children, title, onClose, theme, isMobile }) => (
    <div style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
        padding: isMobile ? "16px" : 0,
    }}>
        <div style={{
            background: theme.cardBg,
            borderRadius: isMobile ? 12 : 16,
            width: "100%", maxWidth: 500,
            boxShadow: theme.shadowPremium,
            overflow: "hidden",
            border: `1px solid ${theme.border}`,
        }}>
            <div style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${theme.border}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: theme.innerBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
            }}>
                <h2 style={{
                    margin: 0, fontSize: isMobile ? 16 : 18,
                    color: theme.textPrimary, fontWeight: 700,
                }}>
                    {title}
                </h2>
                <button
                    onClick={onClose}
                    style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted }}
                >
                    <X size={20} />
                </button>
            </div>
            <div style={{ padding: isMobile ? "16px" : "24px" }}>
                {children}
            </div>
        </div>
    </div>
);

// ─── Style helpers ────────────────────────────────────────────────────────────

const primaryBtnStyle = (theme) => ({
    background: theme.primary, color: "white",
    padding: "10px 16px", borderRadius: 8, border: "none",
    display: "flex", alignItems: "center", gap: 8,
    fontWeight: 600, cursor: "pointer",
    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
    whiteSpace: "nowrap",
});

const secondaryBtnStyle = (theme) => ({
    padding: "10px 16px", borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.cardBg, color: theme.textPrimary,
    cursor: "pointer", fontWeight: 600,
    display: "flex", alignItems: "center",
});

const inputStyle = (theme) => ({
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${theme.border}`,
    fontSize: 16,               // prevents iOS zoom
    fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
    background: theme.inputBg, color: theme.textPrimary,
});

const tableHeaderRowStyle = (theme) => ({
    background: theme.tableHeaderBg || (theme.isDark ? theme.innerBg : "#f8fafc"),
    borderBottom: `2px solid ${theme.border}`,
});

const thStyle = (theme, isTablet) => ({
    padding: isTablet ? "12px 12px" : "14px 16px",
    fontSize: 11, fontWeight: 800,
    color: theme.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    textAlign: "left",
    whiteSpace: "nowrap",
});

const tdStyle = (isTablet) => ({
    padding: isTablet ? "12px 12px" : "14px 16px",
    verticalAlign: "middle",
});

const tableRowStyle = (theme, status) => ({
    borderBottom: `1px solid ${theme.border}`,
    background: status === 'suspended'
        ? (theme.isDark ? '#451a1a' : '#fef2f2')
        : theme.cardBg,
});

const loadingTdStyle = (theme) => ({
    padding: 40, textAlign: "center", color: theme.textMuted,
});

const actionBtnStyle = (theme) => ({
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    padding: 6, borderRadius: 6,
    color: theme.textSecondary,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    minWidth: 30, minHeight: 30,
});

const labelStyle = (theme) => ({
    display: "block", fontSize: 12, fontWeight: 800,
    color: theme.textSecondary, marginBottom: 6,
    textTransform: "uppercase", letterSpacing: "0.02em",
});

const mobileLabelStyle = {
    fontSize: 10, fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#94A3B8",
    minWidth: 48, flexShrink: 0,
};
