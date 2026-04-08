import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../utils/api";
import { getAvatarColor } from "../../utils/helpers";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import ThemeToggle from "../../components/ThemeToggle";
import { PageTitle, Divider, Card, Badge, Loader2 } from "../../components/UI";
import toast from "react-hot-toast";

import {
  PlusCircle,
  ClipboardList,
  Calendar,
  FileText,
  ArrowRight,
  Trash2,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Bell,
  X,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function NurseDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    new_patients_today: 0,
    pending_assessments: 0,
    waiting_review: 0,
    total_patients: 0,
    trends: {
      total_patients: "0",
      pending_assessments: "0",
      waiting_review: "0",
      new_patients_today: "0"
    }
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [{ data: dashData }, notifRes, unreadRes] = await Promise.all([
          api.get("/nurse/dashboard"),
          api.get("/notifications"),
          api.get("/notifications/unread-count"),
        ]);

        const dashboardInfo = dashData || {};
        setStats({
          new_patients_today: dashboardInfo.stats?.new_patients_today ?? 0,
          pending_assessments: dashboardInfo.stats?.pending_assessments ?? 0,
          waiting_review: dashboardInfo.stats?.waiting_review ?? 0,
          total_patients: dashboardInfo.stats?.total_patients ?? 0,
          trends: dashboardInfo.stats?.trends || {
            total_patients: "0",
            pending_assessments: "0",
            waiting_review: "0",
            new_patients_today: "0"
          }
        });
        setRecentPatients(Array.isArray(dashboardInfo.recentPatients) ? dashboardInfo.recentPatients : []);

        const notifs = notifRes.data || [];

        const unreadNotifs = notifs.filter(n => !n.is_read); // ✅ filter

        setNotifications(unreadNotifs);
        setUnreadCount(unreadRes.data?.count ?? 0);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        toast.error("Failed to load nurse dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleMarkOneRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all", {});
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all notifications read", e);
    }
  };

  

  const QuickAction = ({ icon, label, to, color }) => (
    <Link to={to} style={{ textDecoration: 'none', flex: 1 }}>
      <Card padding="20px" hover style={{ display: 'flex', alignItems: 'center', gap: 16, height: '100%' }}>
        <div style={{
          background: `${color}15`,
          color: color,
          padding: 12,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <div style={{ fontWeight: 700, color: theme.text, fontSize: 15 }}>{label}</div>
      </Card>
    </Link>
  );

  const WorkflowStep = ({ number, label, description, isLast }) => (
    <div style={{ flex: 1, position: 'relative', textAlign: 'center' }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: theme.primary, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px auto', fontWeight: 800, fontSize: 18,
        position: 'relative', zIndex: 2
      }}>
        {number}
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.4 }}>{description}</div>
      {!isLast && (
        <div style={{
          position: 'absolute', top: 20, left: 'calc(50% + 25px)',
          width: 'calc(100% - 50px)', height: 2,
          background: theme.border, zIndex: 1
        }} />
      )}
    </div>
  );

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <NurseSidebar />
      <main className="portal-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color={theme.primary} style={{ marginBottom: 16 }} />
          <div style={{ color: theme.textMuted, fontWeight: 500 }}>Loading Nurse Portal...</div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <NurseSidebar />

      <main className="portal-main" style={{ background: theme.pageBg }}>
        {/* Welcome Header */}
        <div
          style={{
            background: theme.heroGradient,
            padding: "32px 40px",
            borderRadius: 24,
            color: "white",
            marginBottom: 32,
            position: "relative",
            boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.3)",
            overflow: "visible"
          }}
        >
          <div
            style={{
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
                  fontSize: 32,
                  fontWeight: 800,
                  margin: "0 0 8px 0",
                  color: "white"
                }}
              >
                Welcome back, {user?.fullName?.split(" ")[0]}! 👋
              </h1>
              <p style={{ color: "white", fontSize: 14, margin: 0 }}>
                You have {stats.pending_assessments} drafts and {stats.waiting_review} assessments awaiting doctor review.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                position: "relative",
                overflow: "visible"
              }}
            >
              {/* Notification bell */}
              <div style={{ position: "relative" }}>
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
                      marginTop: 24,
                      width: 320,
                      maxHeight: 360,
                      overflowY: "auto",
                      background: theme.cardBg,
                      borderRadius: 16,
                      boxShadow: theme.shadowPremium,
                      border: `1px solid ${theme.glassBorder}`,
                      zIndex: 100
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
                            background: n.is_read
                              ? "transparent"
                              : theme.primary + "10",
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
                            {n.is_read !== true && (
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

        {/* Stats Row */}
        <div className="stats-grid-4" style={{ marginBottom: 40 }}>
          {[
            { label: "Total Patients", value: stats.total_patients, color: theme.primary, icon: <Users size={20} />, trend: stats.trends.total_patients },
            { label: "Pending Drafts", value: stats.pending_assessments, color: theme.secondary, icon: <Clock size={20} />, trend: stats.trends.pending_assessments },
            { label: "Waiting Review", value: stats.waiting_review, color: "#f59e0b", icon: <AlertCircle size={20} />, trend: stats.trends.waiting_review },
            { label: "Registered Today", value: stats.new_patients_today, color: "#10b981", icon: <UserPlus size={20} />, trend: stats.trends.new_patients_today },
          ].map((s, idx) => (
            <Card key={idx} padding="24px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ background: `${s.color}15`, color: s.color, padding: 8, borderRadius: 10 }}>{s.icon}</div>
                {s.trend && s.trend !== "0" && (
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 4, 
                    fontSize: 12, fontWeight: 700, 
                    color: s.trend.startsWith('-') ? theme.dangerText : theme.successText,
                    background: s.trend.startsWith('-') ? `${theme.dangerText}15` : `${theme.successText}15`,
                    padding: '4px 8px', borderRadius: 20
                  }}>
                    {s.trend.startsWith('-') ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    {s.trend}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 14, color: theme.textMuted, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: theme.text }}>{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: theme.fontHeading, fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: 20 }}>
            <QuickAction icon={<UserPlus size={22} />} label="Register New Patient" to="/nurse/patients/new" color="#4f46e5" />
            <QuickAction icon={<ClipboardList size={22} />} label="Start New Assessment" to="/nurse/assessment/new" color="#ec4899" />
            <QuickAction icon={<Calendar size={22} />} label="Schedule Appointment" to="/nurse/appointments" color="#10b981" />
            <QuickAction icon={<FileText size={22} />} label="View Pending Drafts" to="/nurse/patients?filter=Draft" color="#f59e0b" />
          </div>
        </div>

        {/* Recent Patients Table - FIXED VERSION */}
        <div style={{ marginBottom: 40 }}>
          <Card padding="32px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontFamily: theme.fontHeading, fontSize: 20, fontWeight: 800, margin: "0 0 4px 0" }}>Recent Patients</h3>
                <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>View and manage recently registered mothers</p>
              </div>
              <Link to="/nurse/patients" style={{ color: theme.primary, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>View All Patients</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recentPatients.length > 0 ? recentPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((p, idx) => (
                <div key={`${p.id}-${idx}`} style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1.5fr 1fr 1.5fr 1fr 40px',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: 16,
                  background: theme.cardBgSecondary,
                  border: `1px solid ${theme.border}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/nurse/patients/${p.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{ fontWeight: 600, color: theme.textMuted }}>{(currentPage - 1) * itemsPerPage + idx + 1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ 
                        width: 40, height: 40, borderRadius: 10, 
                        background: getAvatarColor(p.name) + '15', color: getAvatarColor(p.name), 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 16, flexShrink: 0
                      }}>
                        {p.name?.charAt(0) || '?'}
                      </div>
                      {/* Online Status Dot - ONLY on avatar */}
                      <div 
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          border: "3px solid white",
                          background: p.is_online ? "#10b981" : "#94a3b8",
                          boxShadow: p.is_online ? "0 0 8px #10b981" : "none",
                          zIndex: 1,
                        }}
                        title={p.is_online ? "Active Now" : "Offline"}
                      />
                    </div>
                    <div style={{ fontWeight: 700, color: theme.text }}>{p.name}</div>
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: 14 }}>Week {p.pregnancy_week || '-'}</div>
                  <div style={{ color: theme.textMuted, fontSize: 14 }}>Dr. {p.assigned_doctor || 'Unassigned'}</div>
                  <div>
                    {/* Status Badge - Patient workflow status ONLY */}
                    <Badge variant={p.status === 'Draft' ? 'warning' : p.status === 'Pending' ? 'secondary' : p.status === 'Registered' ? 'info' : 'success'}>
                      {p.status || 'Registered'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Link to={`/nurse/patients/${p.id}`} style={{ color: theme.textMuted }} onClick={(e) => e.stopPropagation()}>
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>
                  No recent patients found.
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {recentPatients.length > itemsPerPage && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 32 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(prev - 1, 1)); }}
                  disabled={currentPage === 1}
                  style={{ 
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, 
                    background: currentPage === 1 ? theme.cardBgSecondary : 'white', 
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    color: currentPage === 1 ? theme.textMuted : theme.text,
                    fontWeight: 600, fontSize: 13
                  }}
                >
                  Previous
                </button>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
                  Page {currentPage} of {Math.ceil(recentPatients.length / itemsPerPage)}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(prev + 1, Math.ceil(recentPatients.length / itemsPerPage))); }}
                  disabled={currentPage === Math.ceil(recentPatients.length / itemsPerPage)}
                  style={{ 
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, 
                    background: currentPage === Math.ceil(recentPatients.length / itemsPerPage) ? theme.cardBgSecondary : 'white', 
                    cursor: currentPage === Math.ceil(recentPatients.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                    color: currentPage === Math.ceil(recentPatients.length / itemsPerPage) ? theme.textMuted : theme.text,
                    fontWeight: 600, fontSize: 13
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}