import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import DoctorSidebar from "../../components/DoctorSidebar";
import { PageTitle, Loader2 } from "../../components/UI";
import { api } from "../../utils/api";
import { USE_DUMMY_DATA, dummyApi } from "../../utils/dummyData";
import toast from "react-hot-toast";
import {
    User, Mail, Phone, ShieldCheck, ClipboardCheck, AlertTriangle,
    Briefcase, Award, Key
} from "lucide-react";
import "../../styles/NurseProfile.css"; // Using NurseProfile CSS for consistent styling

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
                        assessments_reviewed: 128, 
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
        <div className="np-info-item">
            <div className="np-info-icon" style={{ background: `${theme.primary}10`, color: theme. primary }}>
                {icon}
            </div>
            <div className="np-info-content">
                <span className="np-info-label">{label}</span>
                <span className="np-info-value">{value || 'Verification Pending'}</span>
            </div>
        </div>
    );

    return (
        <div className={`np-page ${theme.isDark ? "dark" : ""}`}>
            <DoctorSidebar />

            <main className="np-main">
                <PageTitle
                    title="Professional Credentials"
                    subtitle="Manage your clinical profile, medical licenses, and portal security settings."
                />

                <div className="np-container">
                    <div className="np-grid">

                        {/* Left: Profile Information Card */}
                        <div className="np-card">
                            <div className="np-avatar-section">
                                <div className="np-avatar">
                                    {user?.fullName?.charAt(0) || "D"}
                                </div>
                                <div>
                                    <div className="np-name">{user?.fullName || "Dr. Sarah Johnson"}</div>
                                    <div className="np-role">
                                        <div className="np-badge-role">Senior Perinatal Specialist</div>
                                        <div className="np-id">ID: <span>MD-{user?.id?.toString().slice(-5).toUpperCase() || '88120'}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="np-info-grid">
                                <InfoRow icon={<Mail size={20} />} label="Clinical Email" value={user?.email} />
                                <InfoRow icon={<Briefcase size={20} />} label="Unit / Dept" value={user?.department || "Mental Health Unit"} />
                                <InfoRow icon={<Phone size={20} />} label="Secured Line" value={user?.phone || '+91 81482 82009'} />
                                <InfoRow icon={<ShieldCheck size={20} />} label="License Hash" value="TMC-551-229-88" />
                                <InfoRow icon={<Award size={20} />} label="Board Certification" value="Medical Council Ver. 2024" />
                                <InfoRow icon={<User size={20} />} label="Privileges" value="Full Clinical Authority" />
                            </div>


                        </div>

                        {/* Right: Security Settings Card */}
                        <div className="np-card np-card-right">
                            <div className="np-pwd-title">
                                <Key size={20} /> Security Update
                            </div>
                            <p className="np-pwd-subtitle">Authorize a password rotation for clinical access.</p>

                            <form onSubmit={handlePasswordChange}>
                                <div className="np-input-group">
                                    <label className="np-label">Current Credentials</label>
                                    <input
                                        type="password"
                                        className="np-input"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="np-input-group">
                                    <label className="np-label">New Clinical Password</label>
                                    <input
                                        type="password"
                                        className="np-input"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="np-input-group" style={{ marginBottom: 32 }}>
                                    <label className="np-label">Confirm Rotation</label>
                                    <input
                                        type="password"
                                        className="np-input"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>

                                <button type="submit" className="np-btn-submit" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Validate & Update Password"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Clinical System Metrics (Moved Outside) */}
                    <div className="np-stats-row">
                        <div className="np-stat-card">
                            <div className="np-stat-icon" style={{ background: `${theme.primary}20`, color: theme.primary }}>
                                <ClipboardCheck size={24} />
                            </div>
                            <div className="np-stat-info">
                                <span className="np-stat-label">Reviews Matrix</span>
                                <span className="np-stat-val">{stats.assessments_reviewed}</span>
                            </div>
                        </div>
                        <div className="np-stat-card">
                            <div className="np-stat-icon" style={{ background: `${theme.dangerText}20`, color: theme.dangerText }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div className="np-stat-info">
                                <span className="np-stat-label">Urgency Allocation</span>
                                <span className="np-stat-val">{stats.high_risk_cases}</span>
                            </div>
                        </div>
                        <div className="np-stat-card">
                            <div className="np-stat-icon" style={{ background: `${theme.warningText}20`, color: theme.warningText }}>
                                <User size={24} />
                            </div>
                            <div className="np-stat-info">
                                <span className="np-stat-label">Patient Queue</span>
                                <span className="np-stat-val">{stats.patients_assigned}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
