import React, { useState, useEffect } from 'react';
import { useTheme } from "../../ThemeContext";
import AdminSidebar from "../../components/AdminSidebar";
import { PageTitle, Divider, Card, Badge, Pagination } from "../../components/UI";
import { getUsers, addUser, updateUser, deleteUser, addAuditLog } from "../../utils/dummyData";
import { Search, Plus, Edit, Trash2, ShieldOff, KeyRound, CheckCircle, X, Shield } from "lucide-react";
import toast from "react-hot-toast";

export default function DoctorsPage() {
    const { theme } = useTheme();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "", email: "", phone: "", role: "doctor", specialization: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        setLoading(true);
        const data = await getUsers();
        setDoctors(data.filter(u => u.role === 'doctor'));
        setLoading(false);
    };

    const filteredDoctors = doctors.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
    const paginatedDoctors = filteredDoctors.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleCreateDoctor = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addUser({ ...formData, role: 'doctor' });
            toast.success(`Doctor ${formData.name} added successfully!`);
            setFormData({ name: "", email: "", phone: "", role: "doctor", specialization: "" });
            setShowModal(false);
            loadDoctors();
        } catch (err) {
            toast.error("Failed to add doctor");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuspend = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        await updateUser(id, { status: newStatus });
        toast.success(`Doctor ${newStatus === 'active' ? 'activated' : 'suspended'}`);
        loadDoctors();
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to permanently delete Dr. ${name}?`)) {
            await deleteUser(id);
            toast.success("Doctor record deleted");
            loadDoctors();
        }
    };

    const handleResetPassword = async (name) => {
        await addAuditLog(`Requested password reset for Dr. ${name}`);
        toast.success(`Reset link sent to ${name}`);
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
            <AdminSidebar />
            <main style={{ flex: 1, marginLeft: 260, padding: "40px 48px", boxSizing: "border-box" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <PageTitle title="Doctors Directory" subtitle="Manage hospital medical specialists and credentials" />
                    <button onClick={() => setShowModal(true)} style={primaryBtnStyle(theme)}>
                        <Plus size={18} /> Add Doctor
                    </button>
                </div>
                <Divider style={{ marginBottom: 24 }} />

                <Card style={{ padding: 0, overflow: "hidden" }}>
                    <div style={toolbarStyle(theme)}>
                        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
                            <Search size={18} style={searchIconStyle(theme)} />
                            <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={inputStyle(theme, true)} />
                        </div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr style={tableHeaderRowStyle(theme)}>
                                    <th style={thStyle(theme)}>Doctor Details</th>
                                    <th style={thStyle(theme)}>Specialization</th>
                                    <th style={thStyle(theme)}>Contact</th>
                                    <th style={thStyle(theme)}>Status</th>
                                    <th style={{ ...thStyle(theme), textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={loadingTdStyle(theme)}>Loading clinicians...</td></tr>
                                ) : filteredDoctors.length === 0 ? (
                                    <tr><td colSpan="5" style={loadingTdStyle(theme)}>No doctors found.</td></tr>
                                ) : (
                                    paginatedDoctors.map(doctor => (
                                        <tr key={doctor.id} style={tableRowStyle(theme, doctor.status)}>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 700, color: theme.textPrimary, fontSize: 14 }}>Dr. {doctor.name}</div>
                                                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>ID: {doctor.id}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <Badge type="info">{doctor.specialization || "General Medicine"}</Badge>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ fontSize: 13, color: theme.textSecondary }}>{doctor.email}</div>
                                                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{doctor.phone}</div>
                                            </td>
                                            <td style={tdStyle}>
                                                <StatusBadge status={doctor.status} />
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: "right" }}>
                                                <ActionButtons
                                                    onReset={() => handleResetPassword(doctor.name)}
                                                    onSuspend={() => handleSuspend(doctor.id, doctor.status)}
                                                    onDelete={() => handleDelete(doctor.id, doctor.name)}
                                                    status={doctor.status}
                                                />
                                            </td>
                                        </tr>
                                    ))
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

            {showModal && (
                <Modal onClose={() => setShowModal(false)} title="Add New Doctor" theme={theme}>
                    <form onSubmit={handleCreateDoctor}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Full Name *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle(theme)} placeholder="Jane Smith" />
                            </div>
                            <div>
                                <label style={labelStyle}>Specialization</label>
                                <input type="text" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} style={inputStyle(theme)} placeholder="e.g. Obstetrics & Gynecology" />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={labelStyle}>Email Address *</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle(theme)} placeholder="jane@hospital.com" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone Number *</label>
                                    <input required type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle(theme)} placeholder="+1 234 567 8900" />
                                </div>
                            </div>
                        </div>
                        <div style={modalFooterStyle}>
                            <button type="button" onClick={() => setShowModal(false)} style={secondaryBtnStyle(theme)}>Cancel</button>
                            <button type="submit" disabled={submitting} style={primaryBtnStyle(theme)}>{submitting ? "Adding..." : "Add Doctor"}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// Sub-components for cleaner code
const StatusBadge = ({ status }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: status === "active" ? "#10B981" : "#EF4444" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: status === "active" ? "#10B981" : "#EF4444" }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    </div>
);

const ActionButtons = ({ onReset, onSuspend, onDelete, status }) => (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button onClick={onReset} title="Reset Password" style={actionBtnStyle}><KeyRound size={16} /></button>
        <button onClick={onSuspend} title={status === 'active' ? "Suspend" : "Activate"} style={actionBtnStyle}>
            {status === 'active' ? <ShieldOff size={16} color="#F59E0B" /> : <CheckCircle size={16} color="#10B981" />}
        </button>
        <button onClick={onDelete} title="Delete" style={{ ...actionBtnStyle, color: "#EF4444", borderColor: "#FECACA" }}><Trash2 size={16} /></button>
    </div>
);

const Modal = ({ children, title, onClose, theme }) => (
    <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
            <div style={modalHeaderStyle(theme)}>
                <h2 style={{ margin: 0, fontSize: 18, color: theme.textPrimary }}>{title}</h2>
                <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted }}>
                    <X size={20} />
                </button>
            </div>
            <div style={{ padding: "24px" }}>{children}</div>
        </div>
    </div>
);

// Modular Styles
const primaryBtnStyle = (theme) => ({
    background: theme.primary, color: "white", padding: "10px 16px", borderRadius: 8, border: "none",
    display: "flex", alignItems: "center", gap: 8, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)"
});

const secondaryBtnStyle = (theme) => ({
    padding: "10px 16px", borderRadius: 8, border: `1px solid ${theme.divider}`, background: "white", cursor: "pointer", fontWeight: 600
});

const toolbarStyle = (theme) => ({
    padding: "20px 24px", borderBottom: `1px solid ${theme.divider}`, display: "flex", gap: 16, alignItems: "center", background: "#f8fafc"
});

const searchIconStyle = (theme) => ({
    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: theme.textMuted
});

const inputStyle = (theme, isSearch) => ({
    width: "100%", padding: isSearch ? "10px 12px 10px 40px" : "10px 12px", borderRadius: 8,
    border: `1px solid ${theme.divider}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box"
});

const tableStyle = { width: "100%", borderCollapse: "collapse", textAlign: "left" };

const tableHeaderRowStyle = (theme) => ({ background: "white", borderBottom: `2px solid ${theme.divider}` });

const thStyle = (theme) => ({ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" });

const tdStyle = { padding: "16px 24px", verticalAlign: "middle" };

const tableRowStyle = (theme, status) => ({ borderBottom: `1px solid ${theme.divider}`, background: status === 'suspended' ? '#fef2f2' : 'white' });

const loadingTdStyle = (theme) => ({ padding: 40, textAlign: "center", color: theme.textMuted });

const actionBtnStyle = { background: "white", border: "1px solid #E2E8F0", padding: 6, borderRadius: 6, color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 };

const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };

const modalContentStyle = { background: "white", borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 24px 50px rgba(0,0,0,0.15)", overflow: "hidden" };

const modalHeaderStyle = (theme) => ({ padding: "20px 24px", borderBottom: `1px solid ${theme.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" });

const modalFooterStyle = { marginTop: 32, display: "flex", gap: 12, justifyContent: "flex-end" };
