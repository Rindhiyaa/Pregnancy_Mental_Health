import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import { api, addAuditLog } from "../../utils/api";
import {
  Users, UserCheck, ClipboardList, Activity,
  TrendingUp, TrendingDown, Search, Filter,
  MoreVertical, Shield, Trash2, Edit, UserPlus, X, Menu,
} from "lucide-react";
import {
  PageTitle, Divider, Card, Badge, PrimaryBtn, Pagination,
} from "../../components/UI";
import ThemeToggle from "../../components/ThemeToggle";
import { useTheme } from "../../ThemeContext";
import toast from "react-hot-toast";

// ─── Responsive hook ───────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1440
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

export default function AdminDashboard() {
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClinicians: 0,
    totalPatients: 0,
    totalAssessments: 0,
    trends: {
      users: "0",
      clinicians: "0",
      patients: "0",
      assessments: "0"
    }
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();

    const wsUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/^http/, "ws").replace(/\/$/, "") + "/ws"
      : `ws://${window.location.hostname}:8000/ws`;
      
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "user_deleted") {
          fetchAdminData();
        } else if (data.type === "NEW_RECOVERY_REQUEST") {
          console.log("🔔 New recovery request received via WS:", data);
          toast.success(`New password recovery request from ${data.email}`, {
            icon: '🔔',
            duration: 6000,
            onClick: () => navigate("/admin/recovery")
          });
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Close sidebar when resizing to desktop — handled by AdminSidebar now

  const fetchAdminData = async () => {
    try {
      const { data } = await api.get("/admin/dashboard");
      setStats({
        totalUsers: data.totalUsers,
        totalClinicians: data.totalClinicians,
        totalPatients: data.totalPatients,
        totalAssessments: data.totalAssessments,
        trends: data.trends || {
          users: "0",
          clinicians: "0",
          patients: "0",
          assessments: "0"
        }
      });
      setRecentUsers(data.recentUsers);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user) => {
  if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) return;

  try {
    await api.delete(`/admin/users/${user.id}`);

    try {
      await addAuditLog(
        "User Deleted",
        `Deleted user ${user.name} (ID ${user.id})`
      );
    } catch (logErr) {
      console.warn("Audit log failed", logErr);
    }

    toast.success(`User ${user.name} deleted`);
  } catch (err) {
    console.error(err);
    toast.error("Failed to delete user");
  } finally {
    fetchAdminData();
  }
};

  // const handleReviewCredentials = () => {
  //   navigate("/admin/doctors");
  //   toast("Reviewing pending clinician credentials...", { icon: "🔍" });
  // };

  const filteredUsers = recentUsers.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      roleFilter === "All" || u.role.toLowerCase() === roleFilter.toLowerCase();
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: <Users size={20} />, trend: stats.trends.users, up: !stats.trends.users.startsWith('-'), color: "#14B8A6", link: "/admin/patients" },
    { label: "Clinicians", value: stats.totalClinicians, icon: <Shield size={20} />, trend: stats.trends.clinicians, up: !stats.trends.clinicians.startsWith('-'), color: "#0D9488", link: "/admin/doctors" },
    { label: "Patients", value: stats.totalPatients, icon: <UserCheck size={20} />, trend: stats.trends.patients, up: !stats.trends.patients.startsWith('-'), color: "#063F47", link: "/admin/patients" },
    { label: "Assessments", value: stats.totalAssessments, icon: <ClipboardList size={20} />, trend: stats.trends.assessments, up: !stats.trends.assessments.startsWith('-'), color: "#2DD4BF", link: "/admin/analytics" },
  ];

  // ─── Layout values derived from breakpoint ─────────────────────────────────
  const SIDEBAR_WIDTH = 240;
  const statGridCols = isDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: theme.pageBg, fontFamily: theme.fontBody }}>

      {/* ── Sidebar ── */}
      <AdminSidebar />

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        minWidth: 0,
        height: "100vh",
        overflowY: "auto",
        background: theme.pageBg,
        paddingTop: !isDesktop ? "56px" : 0,
      }}>
        <div style={{ padding: isMobile ? "16px" : isTablet ? "24px 28px" : "40px 48px" }}>

        {/* ── Hero Header ── */}
        <div style={{
          background: theme.heroGradient,
          padding: isMobile ? "24px 20px" : "40px",
          borderRadius: isMobile ? 16 : 24,
          color: "white",
          marginBottom: 32,
          position: "relative",
          overflow: "hidden",
          boxShadow: theme.shadowPremium,
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ position: "absolute", bottom: -40, left: "40%", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

          <div style={{
            position: "relative", zIndex: 1,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? 16 : 0,
          }}>
            <div>
              <h1 style={{
                fontFamily: theme.fontHeading,
                fontSize: isMobile ? 24 : isTablet ? 28 : 36,
                fontWeight: 800,
                margin: "0 0 8px 0",
                color: "white",
              }}>
                Welcome back,{" "}
                <span style={{ color: theme.isDark ? "#2DD4BF" : "#22D3EE" }}>Admin</span>
              </h1>
              <p style={{ margin: 0, color: "white", fontSize: isMobile ? 13 : 14 }}>
                System-wide overview and user management
              </p>
            </div>
            {/* Hide ThemeToggle here on mobile — shown in top bar instead */}
            {!isMobile && (
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                
                <ThemeToggle inHeader={true} />
              </div>
            )}
            {/* Show badge on mobile below title */}
            {isMobile && <Badge variant="warning">System Version 1.2.0</Badge>}
          </div>
        </div>

        <Divider />

        {/* ── Stat Cards Grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: statGridCols,
          gap: isMobile ? 12 : 24,
          marginBottom: 32,
        }}>
          {statCards.map((stat, i) => (
            <Card
              key={i}
              style={{ padding: isMobile ? "16px" : "24px", cursor: "pointer", transition: "transform 0.15s" }}
              onClick={() => navigate(stat.link)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${stat.color}20`, color: stat.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {stat.icon}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, fontWeight: 700,
                  color: stat.up ? "#10B981" : "#EF4444",
                  background: stat.up ? "#10B98115" : "#EF444415",
                  padding: '4px 8px', borderRadius: 20
                }}>
                  {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.trend}
                </div>
              </div>
              <div style={{
                fontSize: isMobile ? 22 : 28,
                fontWeight: 800, color: theme.textPrimary, marginBottom: 4,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: isMobile ? 10 : 13,
                color: theme.textSecondary, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {stat.label}
              </div>
            </Card>
          ))}
        </div>

        {/* ── Main Content: Table full width ── */}
        <div style={{ width: "100%" }}>

          {/* ── User Management Table ── */}
          <Card style={{ padding: 0, overflow: "hidden", minWidth: 0 }}>
            {/* Table Header: Search + Filter + Add */}
            <div style={{
              padding: isMobile ? "16px" : "24px",
              borderBottom: `1px solid ${theme.divider}`,
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "stretch" : "center",
              gap: 12,
            }}>
              <h3 style={{
                margin: 0, fontSize: isMobile ? 15 : 18,
                fontWeight: 700, color: theme.textPrimary,
                flexShrink: 0,
              }}>
                Recent User Signups
              </h3>

              {/* Controls row: wraps on small screens */}
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                justifyContent: isMobile ? "stretch" : "flex-end",
              }}>
                {/* Search */}
                <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
                  <Search size={15} style={{
                    position: "absolute", left: 10, top: "50%",
                    transform: "translateY(-50%)", color: theme.textMuted,
                  }} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      padding: "8px 12px 8px 32px",
                      borderRadius: 8,
                      border: `1px solid ${theme.divider}`,
                      background: theme.pageBg,
                      fontSize: 13, width: isMobile ? "100%" : 180,
                      fontFamily: "inherit", outline: "none",
                      boxSizing: "border-box",
                      color: theme.textPrimary,
                    }}
                  />
                </div>

                {/* Filter */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowFilter((f) => !f)}
                    style={{
                      padding: "8px 12px", borderRadius: 8,
                      border: `1px solid ${roleFilter !== "All" ? theme.primary : theme.divider}`,
                      background: roleFilter !== "All" ? `${theme.primary}15` : theme.cardBg,
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 13, cursor: "pointer",
                      color: roleFilter !== "All" ? theme.primary : theme.textPrimary,
                      fontWeight: roleFilter !== "All" ? 700 : 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Filter size={14} />
                    {roleFilter === "All" ? "Filter" : roleFilter}
                  </button>
                  {showFilter && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "110%",
                      background: "white",
                      border: `1px solid ${theme.divider}`,
                      borderRadius: 8,
                      zIndex: 100,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                      minWidth: 140,
                    }}
                  >
                    {["All", "Doctor", "Nurse", "Patient"].map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setRoleFilter(role);
                          setShowFilter(false);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 16px",
                          border: "none",
                          cursor: "pointer",
                          background:
                            roleFilter === role ? `${theme.primary}15` : "white",
                          color:
                            roleFilter === role ? theme.primary : theme.textPrimary,
                          fontWeight: roleFilter === role ? 700 : 400,
                          fontSize: 13,
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
                </div>

                {/* Add Doctor */}
                <button
                  onClick={() => navigate("/admin/doctors")}
                  style={{
                    padding: "8px 12px", borderRadius: 8, border: "none",
                    background: theme.primary, color: "white",
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, cursor: "pointer", fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  <UserPlus size={14} />
                  {isMobile ? "Add" : "Add Doctor"}
                </button>
              </div>
            </div>

             {/* Scrollable table wrapper — critical for mobile */}
             <div className="portal-table-wrap">
              <table className="portal-table" style={{ borderColor: theme.divider }}>
                <thead>
                  <tr style={{ background: theme.tableHeaderBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9"), borderColor: theme.divider }}>
                    <th style={{ color: theme.textSecondary }}>User</th>
                    <th style={{ color: theme.textSecondary, textAlign: "center" }}>Role</th>
                    <th style={{ color: theme.textSecondary }}>Status</th>
                    {!isMobile && <th style={{ color: theme.textSecondary }}>Joined</th>}
                    <th style={{ color: theme.textSecondary, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isMobile ? 4 : 5}
                        style={{ padding: 32, textAlign: "center", color: theme.textMuted }}
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        style={{ borderBottom: `1px solid ${theme.divider}`, transition: "background 0.2s" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            theme.tableHover || (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"))
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={tableCellStyle(isMobile)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ position: "relative" }}>
                              <div style={{ 
                                width: 32, height: 32, borderRadius: 8, 
                                background: theme.primary + "15", color: theme.primary,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 800, fontSize: 12
                              }}>
                                {user.name.charAt(0)}
                              </div>
                              <div style={{
                                position: "absolute", bottom: -2, right: -2,
                                width: 10, height: 10, borderRadius: "50%",
                                border: `2px solid ${theme.cardBg}`,
                                background: user.isOnline ? "#10B981" : "#94A3B8",
                                boxShadow: user.isOnline ? "0 0 4px #10B981" : "none"
                              }} title={user.isOnline ? "Online" : "Offline"} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: theme.textPrimary, fontSize: isMobile ? 13 : 14 }}>
                                {user.role.toLowerCase() === "doctor" ? `Dr. ${user.name}` : user.name}
                              </div>
                              <div style={{
                                fontSize: 11, color: theme.textMuted,
                                maxWidth: isMobile ? 120 : "unset",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td style={{ ...tableCellStyle(isMobile), textAlign: "center" }}>
                          <Badge
                            type={
                              user.role === "Clinician" || user.role === "Doctor"
                                ? "warning"
                                : "success"
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        
                        <td style={tableCellStyle(isMobile)}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{
                              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                              background: user.status === "Suspended" ? "#EF4444" : (user.isOnline ? "#10B981" : "#94A3B8"),
                              boxShadow: user.status !== "Suspended" && user.isOnline ? "0 0 6px #10B981" : "none"
                            }} />
                            <span style={{ 
                              fontSize: 12, 
                              fontWeight: 700, 
                              color: user.status === "Suspended" ? "#EF4444" : (user.isOnline ? "#10B981" : theme.textMuted) 
                            }}>
                              {user.status === "Suspended" ? "Suspended" : (user.isOnline ? "Active" : "Offline")}
                            </span>
                          </div>
                        </td>
                        {/* Hide "Joined" column on mobile to save space */}
                        {!isMobile && (
                          <td style={tableCellStyle(isMobile)}>
                            <span style={{ fontSize: 13, color: theme.textMuted }}>{user.joined}</span>
                          </td>
                        )}
                        <td style={tableCellStyle(isMobile)}>
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              style={{
                                ...actionBtnStyle(theme),
                                color: "#EF4444",
                                borderColor: theme.isDark ? "#742A2A" : "#FECACA",
                              }}
                              title="Delete User"
                              onClick={() => handleDelete(user)}
                            >
                              <Trash2 size={15} />
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

            <div style={{
              padding: "14px 24px",
              textAlign: "center",
              borderTop: `1px solid ${theme.border}`,
            }}>
              <button
                onClick={() => navigate("/admin/doctors")}
                style={{
                  background: "none", border: "none",
                  color: theme.primary, fontWeight: 700,
                  cursor: "pointer", fontSize: 13,
                }}
              >
                View All Doctors
              </button>
            </div>
          </Card>
        </div>
        </div>
      </main>
    </div>
  );
}

// ─── Style helpers ─────────────────────────────────────────────────────────────
const tableHeaderStyle = (theme) => ({
  padding: "14px 16px",
  fontSize: 11,
  fontWeight: 800,
  color: theme.textSecondary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: `1px solid ${theme.divider}`,
  textAlign: "left",
  whiteSpace: "nowrap",
});

const tableCellStyle = (isMobile) => ({
  padding: isMobile ? "12px 12px" : "16px 16px",
  verticalAlign: "middle",
});

const actionBtnStyle = (theme) => ({
  padding: "6px",
  borderRadius: "6px",
  border: `1px solid ${theme.border}`,
  background: theme.cardBg,
  color: theme.textSecondary,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 30,
  minHeight: 30,
});

const StatusRow = ({ label, status, color }) => {
  const { theme } = useTheme();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: theme.textSecondary }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{status}</span>
    </div>
  );
};