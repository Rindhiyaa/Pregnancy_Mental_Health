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
import { PageTitle, Divider, Card, Badge, PrimaryBtn, Pagination } from "../../components/UI";
import ThemeToggle from "../../components/ThemeToggle";
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        {/* Hero Header */}
        <div style={{
          background: theme.heroGradient,
          padding: "40px",
          borderRadius: 24,
          color: "white",
          marginBottom: 32,
          position: "relative",
          overflow: "hidden",
          boxShadow: theme.shadowPremium
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ position: "absolute", bottom: -40, left: "40%", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ 
                fontFamily: theme.fontHeading, 
                fontSize: 36, fontWeight: 800, 
                margin: "0 0 8px 0" 
              }}>
                Welcome back, <span style={{ color: theme.isDark ? '#2DD4BF' : '#22D3EE' }}>Admin</span>
              </h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>System-wide overview and user management</p>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Badge variant="warning">System Version 1.2.0</Badge>
              <ThemeToggle inHeader={true} />
            </div>
          </div>
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
              <div style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                      background: roleFilter !== "All" ? `${theme.primary}15` : theme.cardBg,
                      display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer",
                      color: roleFilter !== "All" ? theme.primary : theme.textPrimary, fontWeight: roleFilter !== "All" ? 700 : 400
                    }}
                  >
                    <Filter size={14} /> {roleFilter === "All" ? "Filter" : roleFilter}
                  </button>
                  {showFilter && (
                    <div style={{
                      position: "absolute", right: 0, top: "110%", background: theme.cardBg,
                      border: `1px solid ${theme.border}`, borderRadius: 8, zIndex: 100,
                      boxShadow: theme.isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.1)", minWidth: 140
                    }}>
                      {["All", "Clinician", "Patient", "Doctor"].map(role => (
                        <button
                          key={role}
                          onClick={() => { setRoleFilter(role); setShowFilter(false); }}
                          onMouseEnter={e => e.currentTarget.style.background = roleFilter === role ? `${theme.primary}25` : (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc")}
                          onMouseLeave={e => e.currentTarget.style.background = roleFilter === role ? `${theme.primary}15` : theme.cardBg}
                          style={{
                            display: "block", width: "100%", textAlign: "left",
                            padding: "10px 16px", border: "none", cursor: "pointer",
                            background: roleFilter === role ? `${theme.primary}15` : theme.cardBg,
                            color: roleFilter === role ? theme.primary : theme.textPrimary,
                            fontWeight: roleFilter === role ? 700 : 400, fontSize: 13,
                            transition: "background 0.2s"
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
                  <tr style={{ background: theme.tableHeaderBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9") }}>
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
                    paginatedUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        style={{ 
                          borderBottom: `1px solid ${theme.divider}`,
                          transition: "background 0.2s" 
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = theme.tableHover || (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: 700, color: theme.textPrimary }}>{user.name}</div>
                          <div style={{ fontSize: 12, color: theme.textMuted }}>{user.email}</div>
                        </td>
                        <td style={tableCellStyle}>
                          <Badge type={user.role === "Clinician" || user.role === "Doctor" ? "warning" : "success"}>{user.role}</Badge>
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
                              style={actionBtnStyle(theme)}
                              title="Edit User"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit size={16} />
                            </button>
                            {/* FIX: Delete button now calls handleDelete, removes from localStorage */}
                            <button
                              style={{ ...actionBtnStyle(theme), color: "#EF4444", borderColor: theme.isDark ? "#742A2A" : "#FECACA" }}
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
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />

            <div style={{ padding: "16px 24px", textAlign: "center", borderTop: `1px solid ${theme.border}` }}>
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
                  background: theme.cardBg, color: theme.primary, border: "none",
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
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 16, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 24px 50px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.cardBgSecondary }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: theme.textPrimary }}>Edit User</h3>
              <button onClick={() => setEditUser(null)} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>Full Name</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textPrimary, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.textPrimary, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={() => setEditUser(null)} style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.textPrimary, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
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
  fontWeight: 800,
  color: theme.textSecondary,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  borderBottom: `1px solid ${theme.divider}`,
  textAlign: "left"
});

const tableCellStyle = {
  padding: "16px 24px",
  verticalAlign: "middle"
};

const actionBtnStyle = (theme) => ({
  padding: "6px",
  borderRadius: "6px",
  border: `1px solid ${theme.border}`,
  background: theme.cardBg,
  color: theme.textMuted,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
});

const StatusRow = ({ label, status, color }) => {
  const { theme } = useTheme();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: theme.textSecondary }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: color }}>{status}</span>
    </div>
  );
};
