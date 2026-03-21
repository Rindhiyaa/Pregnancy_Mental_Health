import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import DoctorSidebar from "../../components/DoctorSidebar";
import { PageTitle, Card, Badge, Loader2 } from "../../components/UI";
import { api } from "../../utils/api";
import { USE_DUMMY_DATA, dummyApi } from "../../utils/dummyData";
import toast from "react-hot-toast";
import {
    User, Mail, Phone, Shield, Clock, Hospital, Key, LogOut,
    CheckCircle, ClipboardCheck, AlertTriangle, ShieldCheck,
    Briefcase, Calendar, Award
} from "lucide-react";

export default function DoctorProfilePage() {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        assessments_reviewed: 42,
        high_risk_cases: 5,
        patients_assigned: 12
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (USE_DUMMY_DATA) {
                    const dashboard = await dummyApi.getDoctorDashboard();
                    setStats({
                        assessments_reviewed: 128, // High impact number for demo
                        high_risk_cases: dashboard.stats.high,
                        patients_assigned: dashboard.stats.total
                    });
                } else {
                    const res = await api.get("/doctor/stats");
                    if (res.ok) setStats(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch clinical stats:", err);
            }
        };
        fetchStats();
    }, []);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return toast.error("Validation Error: Passwords do not match");
        }

        setLoading(true);
        try {
            const res = await api.post("/change-password", passwordData);
            if (res.ok) {
                toast.success("Security credentials updated successfully");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                const err = await res.json();
                toast.error(err.detail || "Authentication update failed");
            }
        } catch (err) {
            toast.error("An error occurred during security update");
        } finally {
            setLoading(false);
        }
    };

    const InfoRow = ({ icon, label, value }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: theme.primary + '15', color: theme.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{icon}</div>
            <div>
                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary }}>{value || 'Verification Pending'}</div>
            </div>
        </div>
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg }}>
            <DoctorSidebar />

            <main style={{ flex: 1, marginLeft: 260, padding: "40px", boxSizing: "border-box" }}>
                <header style={{ marginBottom: 40 }}>
                    <PageTitle
                        title="Professional Credentials"
                        subtitle="Manage your clinical profile, medical licenses, and portal security settings."
                    />
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Medical Profile Card */}
                        <Card glass style={{ padding: 40 }}>
                            <div style={{
                                display: 'flex', gap: 32, alignItems: 'center',
                                marginBottom: 40, borderBottom: `1px solid ${theme.glassBorder}`,
                                paddingBottom: 40
                            }}>
                                <div style={{
                                    width: 100, height: 100, borderRadius: 28,
                                    background: theme.primary + '20', color: theme.primary,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 40, fontWeight: 800, border: `2px solid ${theme.primary}40`,
                                    boxShadow: `0 8px 32px ${theme.primary}20`
                                }}>
                                    {user?.fullName?.charAt(0) || "D"}
                                </div>
                                <div>
                                    <div style={{ fontSize: "32px", fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.02em' }}>
                                        {user?.fullName || "Dr. Sarah Johnson"}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
                                        <Badge variant="primary" size="lg">Senior Perinatal Specialist</Badge>
                                        <div style={{ fontSize: 13, color: theme.textMuted, fontWeight: 600 }}>
                                            ID: <span style={{ color: theme.textPrimary }}>MD-{user?.id?.toString().slice(-5).toUpperCase() || '88120'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                <div>
                                    <InfoRow icon={<Mail size={20} />} label="Clinical Email" value={user?.email} />
                                    <InfoRow icon={<Phone size={20} />} label="Secured Line" value={user?.phone || '+91 81482 82009'} />
                                    <InfoRow icon={<Award size={20} />} label="Board Certification" value="Medical Council Ver. 2024" />
                                </div>
                                <div>
                                    <InfoRow icon={<Briefcase size={20} />} label="Unit / Dept" value={user?.department || "Mental Health Unit"} />
                                    <InfoRow icon={<ShieldCheck size={20} />} label="License Hash" value="TMC-551-229-88" />
                                    <InfoRow icon={<CheckCircle size={20} />} label="Privileges" value="Full Clinical Authority" />
                                </div>
                            </div>
                        </Card>

                        {/* Health System Metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                            <Card glass style={{ padding: 24, textAlign: 'center' }}>
                                <div style={{
                                    background: theme.primary + '15', color: theme.primary,
                                    padding: 12, borderRadius: 14, width: 'fit-content',
                                    margin: '0 auto 16px', border: `1px solid ${theme.primary}30`
                                }}>
                                    <ClipboardCheck size={24} />
                                </div>
                                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Reviews Matrix</div>
                                <div style={{ fontSize: "28px", fontWeight: 900, color: theme.textPrimary }}>{stats.assessments_reviewed}</div>
                            </Card>
                            <Card glass style={{ padding: 24, textAlign: 'center' }}>
                                <div style={{
                                    background: theme.dangerText + '15', color: theme.dangerText,
                                    padding: 12, borderRadius: 14, width: 'fit-content',
                                    margin: '0 auto 16px', border: `1px solid ${theme.dangerText}30`
                                }}>
                                    <AlertTriangle size={24} />
                                </div>
                                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Urgency Allocation</div>
                                <div style={{ fontSize: "28px", fontWeight: 900, color: theme.textPrimary }}>{stats.high_risk_cases}</div>
                            </Card>
                            <Card glass style={{ padding: 24, textAlign: 'center' }}>
                                <div style={{
                                    background: theme.warningText + '15', color: theme.warningText,
                                    padding: 12, borderRadius: 14, width: 'fit-content',
                                    margin: '0 auto 16px', border: `1px solid ${theme.warningText}30`
                                }}>
                                    <User size={24} />
                                </div>
                                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Patient Queue</div>
                                <div style={{ fontSize: "28px", fontWeight: 900, color: theme.textPrimary }}>{stats.patients_assigned}</div>
                            </Card>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {/* Security Card */}
                        <Card glass style={{ padding: 40 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.textPrimary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Key size={22} color={theme.primary} /> Security Update
                            </h3>
                            <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 32, fontWeight: 600 }}>Authorize a password rotation for clinical access.</p>

                            <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: 24 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 800, color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Current Credentials</label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '14px', borderRadius: 14, background: theme.glassBg, border: `1px solid ${theme.glassBorder}`, color: theme.textPrimary, outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 800, color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>New Clinical Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '14px', borderRadius: 14, background: theme.glassBg, border: `1px solid ${theme.glassBorder}`, color: theme.textPrimary, outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 800, color: theme.textSecondary, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Confirm Rotation</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        required
                                        placeholder="••••••••"
                                        style={{ width: '100%', padding: '14px', borderRadius: 14, background: theme.glassBg, border: `1px solid ${theme.glassBorder}`, color: theme.textPrimary, outline: 'none' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%', padding: 16, borderRadius: 16, border: 'none',
                                        background: theme.primary, color: 'white', fontWeight: 800,
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        boxShadow: `0 8px 24px ${theme.primary}40`, marginTop: 8
                                    }}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Validate & Update Password"}
                                </button>
                            </form>
                        </Card>

                        <button
                            onClick={logout}
                            style={{
                                width: '100%', padding: 18, borderRadius: 18,
                                border: `1px solid ${theme.glassBorder}`, background: 'rgba(255,255,255,0.02)',
                                color: theme.dangerText, fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                                transition: 'all 0.2s', fontSize: 15, backdropFilter: theme.glassBlur
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = theme.dangerText; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = theme.glassBorder; }}
                        >
                            <LogOut size={20} /> Terminate Clinical Session
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
