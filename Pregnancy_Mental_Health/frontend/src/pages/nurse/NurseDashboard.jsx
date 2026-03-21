import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../utils/api";
import { dummyApi, USE_DUMMY_DATA, getAvatarColor } from "../../utils/dummyData";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
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
  Users
} from "lucide-react";

export default function NurseDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    new_patients_today: 0,
    pending_assessments: 0,
    waiting_review: 0,
    total_patients: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        if (USE_DUMMY_DATA) {
          const statsData = await dummyApi.getNurseStats();
          setStats(statsData);

          const patientsData = await dummyApi.getPatients({ limit: 20 });
          setRecentPatients(patientsData);
        } else {
          // Fetch all dashboard data from real API
          const res = await api.get("/nurse/dashboard");
          if (res.ok) {
            const data = await res.json();
            setStats(data.stats);
            setRecentPatients(data.recentPatients);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);


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
      <main style={{ flex: 1, marginLeft: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      <main style={{
        flex: 1,
        marginLeft: 260,
        padding: "40px 48px",
        width: "calc(100% - 260px)",
        boxSizing: "border-box",
        background: theme.pageBg
      }}>
        {/* Welcome Header */}
        <div style={{
          background: theme.heroGradient,
          padding: "40px",
          borderRadius: 24,
          color: "white",
          marginBottom: 32,
          position: "relative",
          boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.3)"
        }}>
          <h1 style={{
            fontFamily: theme.fontHeading,
            fontSize: 36, fontWeight: 800,
            margin: "0 0 12px 0"
          }}>
            Welcome back, {user?.fullName?.split(' ')[0]}! 👋
          </h1>
          {/* <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, maxWidth: 600, lineHeight: 1.6 }}>
            You have {stats.pending_assessments} pending drafts and {stats.waiting_review} assessments waiting for doctor review.
          </p> */}
        </div>

        {/* Stats Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
          marginBottom: 40
        }}>
          {[
            { label: "Total Patients", value: stats.total_patients, color: theme.primary, icon: <Users size={20} /> },
            { label: "Pending Drafts", value: stats.pending_assessments, color: theme.secondary, icon: <Clock size={20} /> },
            { label: "Waiting Review", value: stats.waiting_review, color: "#f59e0b", icon: <AlertCircle size={20} /> },
            { label: "Registered Today", value: stats.new_patients_today, color: "#10b981", icon: <UserPlus size={20} /> },
          ].map((s, idx) => (
            <Card key={idx} padding="24px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ background: `${s.color}15`, color: s.color, padding: 8, borderRadius: 10 }}>{s.icon}</div>
              </div>
              <div style={{ fontSize: 14, color: theme.textMuted, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: theme.text }}>{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Recent Patients - REFACTORED */}

         <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: theme.fontHeading, fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: 20 }}>
            <QuickAction icon={<UserPlus size={22} />} label="Register New Patient" to="/nurse/patients/new" color="#4f46e5" />
            <QuickAction icon={<ClipboardList size={22} />} label="Start New Assessment" to="/nurse/assessment/new" color="#ec4899" />
            <QuickAction icon={<Calendar size={22} />} label="Schedule Appointment" to="/nurse/appointments" color="#10b981" />
            <QuickAction icon={<FileText size={22} />} label="View Pending Drafts" to="/nurse/patients?filter=Draft" color="#f59e0b" />
          </div>
        </div>
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
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, 
                      background: getAvatarColor(p.name) + '15', color: getAvatarColor(p.name), 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 16, flexShrink: 0
                    }}>
                      {p.name?.charAt(0) || '?'}
                    </div>
                    <div style={{ fontWeight: 700, color: theme.text }}>{p.name}</div>
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: 14 }}>Week {p.pregnancy_week || '-'}</div>
                  <div style={{ color: theme.textMuted, fontSize: 14 }}>{p.assigned_doctor_name || 'Unassigned'}</div>
                  <div>
                    <Badge variant={p.status === 'Draft' ? 'warning' : 'success'}>
                      {['Draft', 'Pending', 'Active'].includes(p.status) ? p.status : 'Active'}
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
