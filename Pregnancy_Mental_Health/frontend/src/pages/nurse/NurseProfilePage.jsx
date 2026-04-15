import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Badge, Loader2 } from "../../components/UI";
import { api, getErrorMessage } from "../../utils/api";
//import { dummyApi, USE_DUMMY_DATA } from "../../utils/dummyData";
import toast from "react-hot-toast";
import { User, Mail, Phone, Shield, Clock, Hospital, Key, LogOut, CheckCircle, Users, ClipboardList } from "lucide-react";
import "../../styles/NurseProfile.css";

export default function NurseProfilePage() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_patients: 0,
    total_assessments: 0
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/nurse/stats");
        setStats(data || {});
      } catch (err) {
        console.error("Failed to fetch profile stats:", err);
        toast.error("Failed to load profile stats");
      }
    };
    fetchStats();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      await api.post("/change-password", passwordData);
      toast.success("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("Password update error:", err);
      toast.error(getErrorMessage(err, "Failed to update password"));
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
      <div style={{ background: `${theme.primary}10`, color: theme.primary, padding: 10, borderRadius: 12 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, color: theme.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>{value || 'N/A'}</div>
      </div>
    </div>
  );

  return (
    <div className={`np-page ${theme.isDark ? "dark" : ""}`}>
      <NurseSidebar />

      <main className="np-main">
        <PageTitle title="My Profile" subtitle="Manage your clinical credentials and account security" />

        <div className="np-container">
          <div className="np-grid">

            {/* Left: Profile Information Card */}
            <div className="np-card">
              <div className="np-avatar-section">
                <div className="np-avatar">
                  {user?.fullName?.charAt(0) || "N"}
                </div>
                <div>
                  <div className="np-name">{user?.fullName || "Nurse"}</div>
                  <div className="np-badge">Certified Registered Nurse</div>
                  <div className="np-id">ID: RN-{user?.id?.toString().slice(0, 5) || '10294'}</div>
                </div>
              </div>

              <div className="np-info-grid">
                <div className="np-info-item">
                  <div className="np-info-icon"><Mail size={18} /></div>
                  <div className="np-info-content">
                    <span className="np-info-label">Email Address</span>
                    <span className="np-info-value">{user?.email || "nurse@example.com"}</span>
                  </div>
                </div>

                <div className="np-info-item">
                  <div className="np-info-icon"><Hospital size={18} /></div>
                  <div className="np-info-content">
                    <span className="np-info-label">Hospital Assignment</span>
                    <span className="np-info-value">City General Hospital</span>
                  </div>
                </div>

                <div className="np-info-item">
                  <div className="np-info-icon"><Phone size={18} /></div>
                  <div className="np-info-content">
                    <span className="np-info-label">Phone Number</span>
                    <span className="np-info-value">{user?.phone || "+91 98765 43210"}</span>
                  </div>
                </div>

                <div className="np-info-item">
                  <div className="np-info-icon"><Clock size={18} /></div>
                  <div className="np-info-content">
                    <span className="np-info-label">Shift Timings</span>
                    <span className="np-info-value">09:00 AM - 05:00 PM</span>
                  </div>
                </div>

                <div className="np-info-item">
                  <div className="np-info-icon"><Shield size={18} /></div>
                  <div className="np-info-content">
                    <span className="np-info-label">Registration No</span>
                    <span className="np-info-value">RN-2024-9128</span>
                  </div>
                </div>

                <div className="np-info-item">
                  <div className="np-info-icon"><CheckCircle size={18} /></div>
                  <div className="np-info-content">
                    <span className="np-info-label">Status</span>
                    <div style={{ marginTop: 2 }}><span className="np-status-active">Active / On Duty</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Change Password Card */}
            <div className="np-card">
              <div className="np-pwd-title">
                <Key size={20} /> Change Password
              </div>
              <p className="np-pwd-subtitle">Update your account security periodically.</p>

              <form onSubmit={handlePasswordChange}>
                <div className="np-input-group">
                  <label className="np-label">Current Password</label>
                  <input className="np-input" type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required placeholder="••••••••" />
                </div>
                <div className="np-input-group">
                  <label className="np-label">New Password</label>
                  <input className="np-input" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required placeholder="••••••••" />
                </div>
                <div className="np-input-group" style={{ marginBottom: 32 }}>
                  <label className="np-label">Confirm New Password</label>
                  <input className="np-input" type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required placeholder="••••••••" />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="np-btn-submit"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
                </button>
              </form>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="np-stats-row">
            <div className="np-stat-card">
              <div className="np-stat-icon"><Users size={24} /></div>
              <div className="np-stat-info">
                <span className="np-stat-label">Total Patients Registered</span>
                <span className="np-stat-val">{stats.total_patients}</span>
              </div>
            </div>

            <div className="np-stat-card">
              <div className="np-stat-icon"><ClipboardList size={24} /></div>
              <div className="np-stat-info">
                <span className="np-stat-label">Assessments Completed</span>
                <span className="np-stat-val">{stats.total_assessments}</span>
              </div>
            </div>
          </div>

         
          

        </div>
      </main>
    </div>
  );
}


