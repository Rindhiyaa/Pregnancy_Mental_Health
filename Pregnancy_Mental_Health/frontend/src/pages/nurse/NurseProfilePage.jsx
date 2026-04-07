import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Loader2 } from "../../components/UI";
import { api, getErrorMessage } from "../../utils/api";
import toast from "react-hot-toast";
import {
  User, Mail, Phone, Shield, Clock, Hospital, Key,
  CheckCircle, Users, ClipboardList
} from "lucide-react";
import "../../styles/NurseProfile.css";

export default function NurseProfilePage() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    total_patients: 0,
    total_assessments: 0,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/nurse/profile");
        setProfile(data || null);
      } catch (err) {
        console.error("Failed to fetch nurse profile:", err);
      }
    };

    const fetchStats = async () => {
      try {
        const { data } = await api.get("/nurse/stats");
        setStats(data || {});
      } catch (err) {
        console.error("Failed to fetch profile stats:", err);
        toast.error("Failed to load profile stats");
      }
    };

    fetchProfile();
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
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password update error:", err);
      toast.error(getErrorMessage(err, "Failed to update password"));
    } finally {
      setLoading(false);
    }
  };

  const display = profile || user || {};

  const fullName =
    display.full_name ||
    display.fullName ||
    [display.first_name, display.last_name].filter(Boolean).join(" ") ||
    "Nurse";

  const InfoRow = ({ icon, label, value }) => (
    <div className="np-info-item">
      <div
        className="np-info-icon"
        style={{ background: `${theme.primary}10`, color: theme.primary }}
      >
        {icon}
      </div>
      <div className="np-info-content">
        <span className="np-info-label">{label}</span>
        <span className="np-info-value">{value || "Not updated yet"}</span>
      </div>
    </div>
  );

  return (
    <div className={`np-page ${theme.isDark ? "dark" : ""}`}>
      <NurseSidebar />

      <main className="np-main">
        <PageTitle
          title="My Profile"
          subtitle="Manage your clinical credentials and account security."
        />

        <div className="np-container">
          <div className="np-grid">
            <div className="np-card">
              <div className="np-avatar-section">
                <div className="np-avatar">
                  {fullName?.charAt(0) || "N"}
                </div>
                <div>
                  <div className="np-name">{fullName}</div>
                  <div className="np-badge-role">
                    {display.designation || "Staff Nurse"}
                  </div>
                  <div className="np-id">
                    {display.hospital_name && (
                      <>
                        {display.hospital_name}
                        {" • "}
                      </>
                    )}
                    ID: <span>RN-{display?.id?.toString().slice(-5) || "10294"}</span>
                  </div>
                </div>
              </div>

              <div className="np-info-grid">
                <InfoRow
                  icon={<Mail size={18} />}
                  label="Email Address"
                  value={display.email}
                />

                <InfoRow
                  icon={<Hospital size={18} />}
                  label="Hospital"
                  value={display.hospital_name}
                />

                <InfoRow
                  icon={<User size={18} />}
                  label="Department / Unit"
                  value={display.department}
                />

                <InfoRow
                  icon={<Phone size={18} />}
                  label="Phone Number"
                  value={display.phone_number}
                />

                <InfoRow
                    icon={<CheckCircle size={18} />}
                    label="Years of Experience"
                    value={display.years_of_experience}
                  />

                  {/* New field 2: Primary Unit / Ward */}
                  <InfoRow
                    icon={<Users size={18} />}
                    label="Primary Unit / Ward"
                    value={display.primary_unit || display.ward}
                  />
              </div>
            </div>

            <div className="np-card">
              <div className="np-pwd-title">
                <Key size={20} /> Change Password
              </div>
              <p className="np-pwd-subtitle">
                Update your account security periodically.
              </p>

              <form onSubmit={handlePasswordChange}>
                <div className="np-input-group">
                  <label className="np-label">Current Password</label>
                  <input
                    className="np-input"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="np-input-group">
                  <label className="np-label">New Password</label>
                  <input
                    className="np-input"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="np-input-group" style={{ marginBottom: 32 }}>
                  <label className="np-label">Confirm New Password</label>
                  <input
                    className="np-input"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="np-btn-submit">
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="np-stats-row">
            <div className="np-stat-card">
              <div
                className="np-stat-icon"
                style={{ background: `${theme.primary}20`, color: theme.primary }}
              >
                <Users size={24} />
              </div>
              <div className="np-stat-info">
                <span className="np-stat-label">Total Patients Registered</span>
                <span className="np-stat-val">{stats.total_patients ?? 0}</span>
              </div>
            </div>

            <div className="np-stat-card">
              <div
                className="np-stat-icon"
                style={{ background: `${theme.primary}20`, color: theme.primary }}
              >
                <ClipboardList size={24} />
              </div>
              <div className="np-stat-info">
                <span className="np-stat-label">Assessments Completed</span>
                <span className="np-stat-val">{stats.total_assessments ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}