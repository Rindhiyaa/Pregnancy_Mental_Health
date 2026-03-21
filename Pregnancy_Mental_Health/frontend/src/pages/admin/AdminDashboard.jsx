import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { getAdminAnalytics, getUsers, deleteUser, updateUser, addAuditLog } from "../../utils/dummyData";
import {
  Users,
  UserCheck,
  ClipboardList,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Trash2,
  Edit,
  UserPlus,
  X
} from "lucide-react";
import { PageTitle, Divider, Card, Badge, PrimaryBtn } from "../../components/UI";
import { useTheme } from "../../ThemeContext";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClinicians: 0,
    totalPatients: 0,
    totalAssessments: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // FIX: Search state wired to search input
  const [search, setSearch] = useState("");
  // FIX: Role filter state wired to Filter button dropdown
  const [roleFilter, setRoleFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  // FIX: Edit modal state
  const [editUser, setEditUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const analytics = await getAdminAnalytics();
      const users = await getUsers();

      setStats({
        totalUsers: analytics.hospitalStats.patients + analytics.hospitalStats.clinicians,
        totalClinicians: analytics.hospitalStats.clinicians,
        totalPatients: analytics.hospitalStats.patients,
        totalAssessments: analytics.usageStats.reduce((acc, curr) => acc + curr.assessments, 0)
      });

      setAllUsers(users);
      setRecentUsers(users.slice(0, 8).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
        status: u.status.charAt(0).toUpperCase() + u.status.slice(1),
        joined: u.created,
      })));
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // FIX: Edit user handler - saves to localStorage
  const handleEdit = (user) => {
    setEditUser({ ...user });
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    try {
      await updateUser(editUser.id, { name: editUser.name, email: editUser.email });
      await addAuditLog(`Admin edited user: ${editUser.name}`);
      toast.success(`User ${editUser.name} updated successfully`);
      setEditUser(null);
      fetchAdminData();
    } catch {
      toast.error("Failed to update user");
    }
  };

  // FIX: Delete user handler - removes from localStorage with confirmation
  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        await deleteUser(user.id);
        await addAuditLog(`Admin deleted user: ${user.name}`);
        toast.success(`User ${user.name} deleted`);
        fetchAdminData();
      } catch {
        toast.error("Failed to delete user");
      }
    }
  };

  // FIX: Review Credentials - navigates to doctors page where credentials can be reviewed
  const handleReviewCredentials = () => {
    navigate('/admin/doctors');
    toast("Reviewing pending clinician credentials...", { icon: "🔍" });
  };

  // FIX: Apply search + role filter live
  const filteredUsers = recentUsers.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: <Users size={20} />, trend: "+12%", up: true, color: "#14B8A6", link: "/admin/patients" },
    { label: "Clinicians", value: stats.totalClinicians, icon: <Shield size={20} />, trend: "+2", up: true, color: "#0D9488", link: "/admin/doctors" },
    { label: "Patients", value: stats.totalPatients, icon: <UserCheck size={20} />, trend: "+10", up: true, color: "#063F47", link: "/admin/patients" },
    { label: "Assessments", value: stats.totalAssessments, icon: <ClipboardList size={20} />, trend: "+24%", up: true, color: "#2DD4BF", link: "/admin/analytics" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <AdminSidebar />

      <main style={{
        flex: 1,
        marginLeft: 260,
        padding: "40px 48px",
        width: "calc(100% - 260px)",
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <PageTitle
            title="Admin Console"
            subtitle="System-wide overview and user management"
          />
          <Badge type="info">System Version 1.2.0</Badge>
        </div>
        <Divider />

        {/* Stats Grid - FIX: stat cards are clickable and navigate to relevant pages */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 32 }}>
          {statCards.map((stat, i) => (
            <Card
              key={i}
              style={{ padding: "24px", cursor: "pointer", transition: "transform 0.15s" }}
              onClick={() => navigate(stat.link)}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `${stat.color}20`, color: stat.color,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {stat.icon}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 12, fontWeight: 700,
                  color: stat.up ? "#10B981" : "#EF4444"
                }}>
                  {stat.trend} {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: theme.textPrimary, marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: theme.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {stat.label}
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Area */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>

          {/* User Management Table */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: `1px solid ${theme.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.textPrimary }}>Recent User Signups</h3>
              <div style={{ display: "flex", gap: 12, position: "relative" }}>
                {/* FIX: Search input is now wired to search state */}
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: theme.textMuted }} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      padding: "8px 12px 8px 36px", borderRadius: 8,
                      border: `1px solid ${theme.divider}`, background: theme.pageBg,
                      fontSize: 13, width: 200, fontFamily: "inherit", outline: "none"
                    }}
                  />
                </div>
                {/* FIX: Filter button toggles a dropdown for role filtering */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowFilter(f => !f)}
                    style={{
                      padding: "8px 12px", borderRadius: 8, border: `1px solid ${roleFilter !== "All" ? theme.primary : theme.divider}`,
                      background: roleFilter !== "All" ? `${theme.primary}15` : "white",
                      display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer",
                      color: roleFilter !== "All" ? theme.primary : "inherit", fontWeight: roleFilter !== "All" ? 700 : 400
                    }}
                  >
                    <Filter size={14} /> {roleFilter === "All" ? "Filter" : roleFilter}
                  </button>
                  {showFilter && (
                    <div style={{
                      position: "absolute", right: 0, top: "110%", background: "white",
                      border: `1px solid ${theme.divider}`, borderRadius: 8, zIndex: 100,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 140
                    }}>
                      {["All", "Clinician", "Patient", "Doctor"].map(role => (
                        <button
                          key={role}
                          onClick={() => { setRoleFilter(role); setShowFilter(false); }}
                          style={{
                            display: "block", width: "100%", textAlign: "left",
                            padding: "10px 16px", border: "none", cursor: "pointer",
                            background: roleFilter === role ? `${theme.primary}15` : "white",
                            color: roleFilter === role ? theme.primary : theme.textPrimary,
                            fontWeight: roleFilter === role ? 700 : 400, fontSize: 13
                          }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => navigate('/admin/doctors')} style={{
                  padding: "8px 12px", borderRadius: 8, border: "none",
                  background: theme.primary, color: "white", display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: 600
                }}>
                  <UserPlus size={14} /> Add Doctor
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: theme.pageBg }}>
                    <th style={tableHeaderStyle(theme)}>User</th>
                    <th style={tableHeaderStyle(theme)}>Role</th>
                    <th style={tableHeaderStyle(theme)}>Status</th>
                    <th style={tableHeaderStyle(theme)}>Joined</th>
                    <th style={{ ...tableHeaderStyle(theme), textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: 32, textAlign: "center", color: theme.textMuted }}>No users found.</td></tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${theme.divider}` }}>
                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: 700, color: theme.textPrimary }}>{user.name}</div>
                          <div style={{ fontSize: 12, color: theme.textMuted }}>{user.email}</div>
                        </td>
                        <td style={tableCellStyle}>
                          <Badge type={user.role === "Clinician" || user.role === "Doctor" ? "info" : "success"}>{user.role}</Badge>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: user.status === "Active" ? "#10B981" : "#F59E0B" }} />
                            <span style={{ fontSize: 13, color: theme.textSecondary }}>{user.status}</span>
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          <span style={{ fontSize: 13, color: theme.textMuted }}>{user.joined}</span>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            {/* FIX: Edit button now opens an edit modal */}
                            <button
                              style={actionBtnStyle}
                              title="Edit User"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit size={16} />
                            </button>
                            {/* FIX: Delete button now calls handleDelete, removes from localStorage */}
                            <button
                              style={{ ...actionBtnStyle, color: "#EF4444", borderColor: "#FECACA" }}
                              title="Delete User"
                              onClick={() => handleDelete(user)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "16px 24px", textAlign: "center", borderTop: `1px solid ${theme.divider}` }}>
              <button onClick={() => navigate('/admin/doctors')} style={{ background: "none", border: "none", color: theme.primary, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                View All Doctors
              </button>
            </div>
          </Card>

          {/* System Health */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Card>
              <h3 style={{ margin: "0 0 20px 0", fontSize: 18, fontWeight: 700, color: theme.textPrimary }}>System Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <StatusRow label="Database" status="Operational" color="#10B981" />
                <StatusRow label="ML Prediction API" status="Operational" color="#10B981" />
                <StatusRow label="Email Service" status="Operational" color="#10B981" />
                <StatusRow label="Storage" status="82% Full" color="#F59E0B" />
              </div>
              <Divider style={{ margin: "20px 0" }} />
              <div style={{ fontSize: 13, color: theme.textMuted }}>
                Last backup: Today at 03:00 AM
              </div>
            </Card>

            <Card style={{ background: theme.heroGradient, color: "white" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 700 }}>Security Notice</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9, marginBottom: 20 }}>
                There are 3 pending clinician verifications. Please review their credentials before approving system access.
              </p>
              {/* FIX: Review Credentials button now navigates to Doctors page */}
              <button
                onClick={handleReviewCredentials}
                style={{
                  width: "100%", padding: "10px", borderRadius: 8,
                  background: "white", color: theme.primary, border: "none",
                  fontWeight: 700, cursor: "pointer"
                }}
              >
                Review Credentials
              </button>
            </Card>
          </div>

        </div>
      </main>

      {/* FIX: Edit User Modal */}
      {editUser && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 24px 50px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: theme.textPrimary }}>Edit User</h3>
              <button onClick={() => setEditUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Full Name</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.divider}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.divider}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={() => setEditUser(null)} style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${theme.divider}`, background: "white", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleEditSave} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: theme.primary, color: "white", cursor: "pointer", fontWeight: 600 }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tableHeaderStyle = (theme) => ({
  padding: "16px 24px",
  fontSize: 12,
  fontWeight: 700,
  color: theme.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: `1px solid ${theme.divider}`,
  textAlign: "left"
});

const tableCellStyle = {
  padding: "16px 24px",
  verticalAlign: "middle"
};

const actionBtnStyle = {
  padding: "6px",
  borderRadius: "6px",
  border: "1px solid #E5E7EB",
  background: "white",
  color: "#6B7280",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const StatusRow = ({ label, status, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: 14, fontWeight: 500, color: "#4B5563" }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 700, color: color }}>{status}</span>
  </div>
);
