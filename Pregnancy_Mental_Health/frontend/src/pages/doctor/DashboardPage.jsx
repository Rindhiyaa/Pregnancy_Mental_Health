import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import { api } from "../../utils/api";
import DoctorSidebar from "../../components/DoctorSidebar";
import {
  Card,
  Badge,
  StatCard,
  Loader2
} from "../../components/UI";
import { getAvatarColor } from "../../utils/helpers";
import {
    AlertCircle,
    Clock,
    Users,
    Activity,
    Calendar,
    ChevronRight,
    TrendingUp,
    Zap,
    Download,
    Search,
    Bell,
    X
  } from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";
import ThemeToggle from "../../components/ThemeToggle";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    highRisk: 0,
    reviewedThisWeek: 0,
    todayAppointments: 0,
    totalPatients: 0
  });

  const [queue, setQueue] = useState([]);
  const [urgentCases, setUrgentCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  
  const fetchData = useCallback(
    async () => {
      try {
        setLoading(true);

        const [{ data: dashData }, notifRes, unreadRes] = await Promise.all([
          api.get("/doctor/dashboard"),
          api.get("/notifications"),
          api.get("/notifications/unread-count"),
        ]);

        const statsFromApi = dashData.stats || {};

        setStats({
          pending: statsFromApi.pending || 0,
          highRisk: statsFromApi.high || 0,
          reviewedThisWeek: statsFromApi.reviewed_week || 0,
          todayAppointments: statsFromApi.today_apps || 0,
          totalPatients: statsFromApi.total || 0
        });

        setUrgentCases(dashData.urgent_cases || []);
        setTrendData(dashData.trend || []);
        setDistributionData(
          dashData.distribution
            ? dashData.distribution.map((d) => ({
                name: d.name,
                value: d.value,
                color:
                  d.name.toLowerCase().includes("low")
                    ? theme.successText
                    : d.name.toLowerCase().includes("moderate")
                    ? theme.warningText
                    : theme.dangerText
              }))
            : []
        );

        const notifs = notifRes.data || [];
        setNotifications(Array.isArray(notifs) ? notifs : []);
        setUnreadCount(unreadRes.data?.count ?? 0);

        // submitted queue
        const { data: subData } = await api.get("/doctor/assessments", {
          params: { status: "submitted" }
        });
        const sortedQueue = Array.isArray(subData)
          ? subData.sort(
              (a, b) =>
                new Date(b.timestamp || b.created_at) -
                new Date(a.timestamp || a.created_at)
            )
          : [];
        setQueue(sortedQueue.slice(0, 5));

        // today's appointments
        try {
          const { data: appData } = await api.get("/doctor/appointments/today");
          setAppointments(Array.isArray(appData) ? appData : []);
        } catch {
          setAppointments([]);
        }
      } catch (err) {
        console.error("Dashboard data fetch failed:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    },
    [theme.successText, theme.warningText, theme.dangerText]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "N/A";
    const diff = new Date() - new Date(timestamp);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.filter(n => n.id !== id)); // remove
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all", {});
      setNotifications([]);  // clear list
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all notifications read", e);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: theme.pageBg
        }}
      >
        <Loader2 size={48} className="animate-spin" color={theme.primary} />
      </div>
    );
  }

  const displayName =
  user?.firstName || user?.lastName
    ? `Dr. ${user?.firstName || ""} ${user?.lastName || ""}`.trim()
    : "Doctor";

    const hour = new Date().getHours();
    const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: theme.pageBg
      }}
    >
      <DoctorSidebar />
      <main className="portal-main" style={{ background: theme.pageBg }}>
        {/* Hero Header */}
        <div
            className="dashboard-hero"
            style={{
                background: theme.heroGradient,
                color: "white",
                boxShadow: theme.shadowPremium,
                position: "relative",
                padding: 32,
                borderRadius: 24,
                marginBottom: 32,
                overflow: "visible"          // <— add this
            }}
            >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)"
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -40,
              left: "40%",
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)"
            }}
          />

          <div
            className="dashboard-hero-inner"
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap"
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: theme.fontHeading,
                  fontSize: 36,
                  fontWeight: 800,
                  margin: "0 0 8px 0",
                  color: "white"
                }}
              >
                {greeting},{" "}
                <span
                    style={{
                    color: theme.isDark ? "#2DD4BF" : "#22D3EE"
                    }}
                >
                    {displayName}
                </span>
              </h1>
              <p style={{ margin: 0, color: "white", fontSize: 14 }}>
                Clinical Command Center —{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </p>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    position: "relative",   // allow absolute children to overflow
                    overflow: "visible"
                }}
                >
                <div style={{ position: "relative" }}>
                    <Search
                    size={18}
                    style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "rgba(0, 0, 0, 1)"
                    }}
                    />
                    <input
                    type="text"
                    placeholder="Search clinical records..."
                    style={{
                        padding: "10px 10px 10px 40px",
                        borderRadius: 12,
                        border: "1px solid rgba(255, 255, 255, 0.89)",
                        background: "rgba(255, 255, 255, 0.89)",
                        color: "white",
                        width: 240,
                        outline: "none"
                    }}
                    />
                </div>

                {/* Notification bell + dropdown */}
                <div style={{ position: "relative", overflow: "visible" }}>
                    <button
                    onClick={() => setShowNotifications(v => !v)}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.6)",
                        background: "rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        position: "relative",
                        color: "white"
                    }}
                    >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span
                        style={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            minWidth: 16,
                            height: 16,
                            borderRadius: 999,
                            background: "#ef4444",
                            color: "white",
                            fontSize: 10,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 4px"
                        }}
                        >
                        {unreadCount}
                        </span>
                    )}
                    </button>

                    {showNotifications && (
                    <div
                        style={{
                        position: "absolute",
                        right: 0,
                        marginTop: 8,
                        width: 320,
                        maxHeight: 360,
                        overflowY: "auto",           // scroll inside panel
                        background: theme.cardBg,
                        borderRadius: 16,
                        boxShadow: theme.shadowPremium,
                        border: `1px solid ${theme.glassBorder}`,
                        zIndex: 50                  // above hero
                        }}
                    >
                        <div
                        style={{
                            padding: "10px 14px",
                            borderBottom: `1px solid ${theme.glassBorder}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}
                        >
                        <span
                            style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: theme.textPrimary
                            }}
                        >
                            Notifications
                        </span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                style={{
                                border: "none",
                                background: "none",
                                color: theme.primary,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer"
                                }}
                            >
                                Mark all read
                            </button>
                            )}
                            <button
                            onClick={() => setShowNotifications(false)}
                            style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                padding: 2,
                                color: theme.textMuted
                            }}
                            >
                            <X size={14} />
                            </button>
                        </div>
                        </div>

                        {notifications.length === 0 ? (
                        <div
                            style={{
                            padding: 16,
                            fontSize: 12,
                            color: theme.textMuted,
                            textAlign: "center"
                            }}
                        >
                            No notifications yet.
                        </div>
                        ) : (
                        notifications.map((n) => (
                            <div
                            key={n.id}
                            style={{
                                padding: "10px 14px",
                                borderBottom: `1px solid ${theme.glassBorder}`,
                                background: n.is_read ? "transparent" : theme.primary + "10",
                                cursor: "default"
                            }}
                            >
                            <div
                                style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: theme.textPrimary,
                                marginBottom: 4
                                }}
                            >
                                {n.title}
                            </div>
                            <div
                                style={{
                                fontSize: 12,
                                color: theme.textSecondary,
                                marginBottom: 6
                                }}
                            >
                                {n.message}
                            </div>
                            <div
                                style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: 11,
                                color: theme.textMuted
                                }}
                            >
                                <span>
                                {new Date(n.created_at).toLocaleString([], {
                                    dateStyle: "short",
                                    timeStyle: "short"
                                })}
                                </span>
                                {!n.is_read && (
                                <button
                                    onClick={() => handleMarkOneRead(n.id)}
                                    style={{
                                    border: "none",
                                    background: "none",
                                    color: theme.primary,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer"
                                    }}
                                >
                                    Mark read
                                </button>
                                )}
                            </div>
                            </div>
                        ))
                        )}
                    </div>
                    )}
                </div>

                <ThemeToggle inHeader={true} />
                </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid-4">
          <StatCard
            title="Today's Consults"
            value={stats.todayAppointments}
            icon={<Calendar size={24} />}
            trend="up"
            trendValue="8"
          />
          <StatCard
            title="Pending Reviews"
            value={stats.pending}
            icon={<Clock size={24} />}
            color="warning"
            trend="down"
            trendValue="2"
          />
          <StatCard
            title="High Risk Alerts"
            value={stats.highRisk}
            icon={<AlertCircle size={24} />}
            color="danger"
            trend="up"
            trendValue="1"
          />
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<Users size={24} />}
            color="success"
            trend="up"
            trendValue="12%"
          />
        </div>

        <div className="dashboard-grid">
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Weekly Trends */}
            <Card glass style={{ height: 400 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: theme.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}
                >
                  <TrendingUp size={20} color={theme.primary} />
                  Weekly Mental Health Trends
                </h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <Badge variant="success" size="sm">
                    Positive Recovery
                  </Badge>
                </div>
              </div>
              <div style={{ height: 300, width: "100%" }}>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient
                          id="colorScore"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={theme.primary}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={theme.primary}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={theme.glassBorder}
                      />
                      <XAxis
                        dataKey="name"
                        stroke={theme.textMuted}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke={theme.textMuted}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: theme.glassBg,
                          border: `1px solid ${theme.glassBorder}`,
                          borderRadius: 12,
                          backdropFilter: theme.glassBlur
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={theme.primary}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: 40,
                      color: theme.textMuted,
                      fontSize: 12
                    }}
                  >
                    No trend data available yet.
                  </div>
                )}
              </div>
            </Card>

            {/* Submission Queue */}
            <Card glass>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: theme.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}
                >
                  <Zap size={20} color={theme.primary} />
                  Submission Queue
                </h3>
                <button
                  onClick={() => navigate("/doctor/assessments")}
                  style={{
                    border: "none",
                    background: "none",
                    color: theme.primary,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  View Full Repository <ChevronRight size={16} />
                </button>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "0 8px"
                }}
              >
                <tbody>
                  {queue.length > 0 ? (
                    queue.map((a) => (
                      <tr
                        key={a.id}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          cursor: "pointer"
                        }}
                        onClick={() => navigate(`/doctor/review/${a.id}`)}
                      >
                        <td
                          style={{
                            padding: 16,
                            borderRadius: "12px 0 0 12px",
                            border: `1px solid ${theme.glassBorder}`,
                            borderRight: "none"
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background:
                                  getAvatarColor(a.patient_name) + "15",
                                color: getAvatarColor(a.patient_name),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800
                              }}
                            >
                              {a.patient_name?.charAt(0)}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: theme.textPrimary
                                }}
                              >
                                {a.patient_name}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: theme.textMuted
                                }}
                              >
                                {a.nurse_name || "Nurse Unit A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: 16,
                            borderTop: `1px solid ${theme.glassBorder}`,
                            borderBottom: `1px solid ${theme.glassBorder}`
                          }}
                        >
                          <Badge
                            variant={
                              a.risk_level?.toLowerCase() === "high"
                                ? "danger"
                                : a.risk_level?.toLowerCase() === "moderate"
                                ? "warning"
                                : "success"
                            }
                            size="sm"
                          >
                            {a.risk_level || "Normal"}
                          </Badge>
                        </td>
                        <td
                          style={{
                            padding: 16,
                            borderTop: `1px solid ${theme.glassBorder}`,
                            borderBottom: `1px solid ${theme.glassBorder}`
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: theme.textMuted,
                              fontWeight: 600
                            }}
                          >
                            {getTimeAgo(a.timestamp || a.created_at)}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: 16,
                            borderRadius: "0 12px 12px 0",
                            border: `1px solid ${theme.glassBorder}`,
                            borderLeft: "none",
                            textAlign: "right"
                          }}
                        >
                          <ChevronRight size={18} color={theme.textMuted} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          textAlign: "center",
                          padding: 48,
                          color: theme.textMuted
                        }}
                      >
                        <Activity
                          size={32}
                          style={{ margin: "0 auto 12px", opacity: 0.2 }}
                        />
                        <div style={{ fontWeight: 600 }}>
                          No pending reviews found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* High Risk Priority */}
            <Card
              style={{
                background: theme.dangerBg + "40",
                border: `1px solid ${theme.dangerText}30`
              }}
              glass
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  fontSize: 17,
                  fontWeight: 800,
                  color: theme.dangerText,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <AlertCircle size={20} /> High Risk Priority
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {urgentCases.length > 0 ? (
                  urgentCases.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: theme.glassBg,
                        padding: 14,
                        borderRadius: 16,
                        border: `1px solid ${theme.glassBorder}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: theme.textPrimary
                          }}
                        >
                          {p.patient_name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.dangerText,
                            fontWeight: 700
                          }}
                        >
                          Score: {p.score || p.epds_score}/30
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/doctor/review/${p.id}`)}
                        style={{
                          background: theme.dangerText,
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        Review
                      </button>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 20,
                      color: theme.dangerText,
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    No critical alerts today.
                  </div>
                )}
              </div>
            </Card>

            {/* Risk Distribution */}
            <Card glass>
              <h3
                style={{
                  margin: "0 0 20px 0",
                  fontSize: 18,
                  fontWeight: 800,
                  color: theme.textPrimary
                }}
              >
                Patient Breakdown
              </h3>
              <div style={{ height: 200, width: "100%" }}>
                {distributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={distributionData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: theme.glassBg,
                          border: `1px solid ${theme.glassBorder}`,
                          borderRadius: 12,
                          backdropFilter: theme.glassBlur
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: 40,
                      color: theme.textMuted,
                      fontSize: 12
                    }}
                  >
                    No distribution data available yet.
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginTop: 16
                }}
              >
                {distributionData.map((d) => (
                  <div key={d.name} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: d.color,
                        margin: "0 auto 6px"
                      }}
                    />
                    <div
                      style={{
                        fontSize: 10,
                        color: theme.textMuted,
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}
                    >
                      {d.name.split(" ")[0]}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: theme.textPrimary
                      }}
                    >
                      {d.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Today's Schedule */}
            <Card glass style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: theme.textPrimary
                  }}
                >
                  Today's Schedule
                </h3>
                <Calendar size={18} color={theme.textMuted} />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {appointments.length > 0 ? (
                  appointments.map((app) => (
                    <div
                      key={app.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: theme.primary,
                          width: 45,
                          background: theme.primary + "15",
                          padding: 4,
                          borderRadius: 6,
                          textAlign: "center"
                        }}
                      >
                        {app.time?.split(":")[0]}:
                        {app.time?.split(":")[1]?.split(" ")[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: theme.textPrimary,
                            fontSize: 13
                          }}
                        >
                          {app.patient_name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.textMuted
                          }}
                        >
                          {app.type || "Routine Consult"}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 20,
                      color: theme.textMuted,
                      fontSize: 12
                    }}
                  >
                    No appointments for today.
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate("/doctor/schedule")}
                style={{
                  width: "100%",
                  marginTop: 20,
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${theme.glassBorder}`,
                  background: "rgba(255,255,255,0.02)",
                  color: theme.textPrimary,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                View Calendar
              </button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
