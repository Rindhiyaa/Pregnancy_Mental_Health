import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Badge, Loader2, LoadingState } from "../../components/UI";
import { api } from "../../utils/api";
import useContentWidth from "../../hooks/useContentWidth";
import toast from "react-hot-toast";
import { History, FileText, Download, Eye, Trash2, Search, Calendar, User, Stethoscope, ChevronRight } from "lucide-react";

export default function NurseAssessmentHistory() {
  const { theme } = useTheme();
  const { ref: mainRef, width: contentWidth, isMobile, isTablet } = useContentWidth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [filter, setFilter] = useState("All"); // All | Draft | Submitted | Reviewed | Complete
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/nurse/assessments");
      setAssessments(data || []);
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAssessments();
  }, []);

  // Poll every 30 seconds for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAssessments();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

    const filteredAssessments = assessments.filter(a => {
      const matchesSearch = a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (filter === "All") return true;
      const statusLower = (a.status || "").toLowerCase();
      const filterLower = filter.toLowerCase();
      return statusLower === filterLower;
    });

  const tabStyle = (active) => ({
    padding: '10px 20px',
    borderRadius: 30,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    background: active ? theme.primary : '#F9FAFB',
    color: active ? 'white' : theme.textSecondary,
    border: active ? 'none' : `1.5px solid #E5E7EB`,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: active ? '0 4px 12px rgba(42, 157, 143, 0.2)' : 'none'
  });

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case 'draft': return <Badge variant="warning">Draft</Badge>;
      case 'pending': return <Badge variant="info">Pending</Badge>;
      case 'submitted': return <Badge variant="info">Submitted</Badge>;
      case 'reviewed': return <Badge variant="success">Reviewed</Badge>;
      case 'complete': return <Badge variant="success">Completed</Badge>;
      case 'assigned': return <Badge variant="primary">Assigned to Doctor</Badge>;
      // for records that are in nurse side but not yet seen/completed by doctor
      default: return <Badge variant="primary">Appointment scheduled</Badge>;
    }
  };

  const tableHeaderStyle = {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 800,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: `1px solid #E5E7EB`
  };

  const AVATAR_COLORS = [
    '#0D9488', '#0891B2', '#4F46E5', '#7C3AED', 
    '#C026D3', '#DB2777', '#E11D48', '#EA580C', 
    '#D97706', '#65A30D', '#059669', '#10B981'
  ];

  const getAvatarColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    const charCode = name.charCodeAt(0);
    return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
  };

  const tableCellStyle = (isTablet) => ({
    padding: isTablet ? "12px 12px" : "20px 24px",
    fontSize: 14,
    color: theme.text,
    borderBottom: `1px solid #E5E7EB`,
    verticalAlign: 'middle'
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <NurseSidebar />

      <main ref={mainRef} className="portal-main" style={{ background: theme.pageBg, fontFamily: theme.fontBody }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <PageTitle title="Assessment History" subtitle="Review and manage all patient mental health screenings" />
        {/* Add refresh button */}
         <button
            onClick={fetchAssessments}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              border: 'none',
              background: theme.primary,
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Refresh
          </button>
        </div>

        {/* Filter Tabs & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 24px', gap: 20 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {["All", "Draft", "Submitted", "Reviewed", "Complete"].map(t => (
              <button key={t} onClick={() => setFilter(t)} style={tabStyle(filter === t)}>{t}</button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: 350 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
            <input
              style={{
                width: '100%', padding: '12px 16px 12px 48px', borderRadius: 24,
                border: `1.5px solid #E5E7EB`, background: '#F9FAFB',
                fontSize: 14, outline: 'none', fontFamily: theme.fontBody,
                transition: 'all 0.2s ease'
              }}
              placeholder="Search by patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = theme.primary}
              onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
        </div>

        <Card style={{ padding: 0, overflow: 'visible', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {isMobile ? (
            <div style={{ padding: "8px 0" }}>
              {loading ? (
                <LoadingState 
                  size={36} 
                  message="Loading history..." 
                />
              ) : filteredAssessments.length > 0 ? (
                filteredAssessments.map((a, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "14px 16px",
                      borderBottom: `1px solid ${theme.divider}`,
                      background: theme.cardBg,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 36, height: 36, borderRadius: '50%', 
                          background: getAvatarColor(a.patient_name) + '15', color: getAvatarColor(a.patient_name), 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 14, flexShrink: 0,
                        }}>
                          {a.patient_name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: theme.textPrimary, fontSize: 14 }}>
                            {a.patient_name}
                          </div>
                          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                            #{idx + 1}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(a.status)}
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={mobileLabelStyle}>Date</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary }}>
                        {a.created_at && new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={mobileLabelStyle}>Doctor</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Stethoscope size={16} color={theme.textMuted} />
                        <span style={{ fontSize: 13, color: theme.textSecondary }}>
                          Dr. {a.doctor_name || "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                        paddingTop: 4,
                        borderTop: `1px solid ${theme.divider}`,
                      }}
                    >
                      {a.status?.toLowerCase() === 'draft' ? (
                        <button
                          onClick={() => navigate(`/nurse/assessment/edit/${a.id}`)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: 'none',
                            background: theme.primary, color: 'white', fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <FileText size={14} />
                          Continue
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/nurse/assessment/view/${a.id}`)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: `1px solid ${theme.border}`,
                            background: theme.cardBg, color: theme.textSecondary, fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                          }}
                        >
                          <FileText size={14} />
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '80px', textAlign: 'center', color: theme.textMuted }}>
                  No assessment history found.
                </div>
              )}
            </div>
          ) : (
          <div className="portal-table-wrap">
          <table className="portal-table" style={{ 
            borderColor: theme.border,
            minWidth: isTablet ? 600 : 750,
          }}>
            <thead>
              <tr style={{ background: theme.cardBgSecondary || '#F3F4F6', borderColor: theme.border }}>
                <th style={{ ...tableHeaderStyle, color: theme.textMuted }}>S.No</th>
                <th style={{ ...tableHeaderStyle, color: theme.textMuted }}>Patient</th>
                {!isTablet && <th style={{ ...tableHeaderStyle, color: theme.textMuted }}>Date</th>}
                <th style={{ ...tableHeaderStyle, color: theme.textMuted }}>Doctor Assigned</th>
                <th style={{ ...tableHeaderStyle, color: theme.textMuted }}>Status</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right', color: theme.textMuted }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isTablet ? 5 : 6} style={{ padding: 0, border: 'none' }}>
                    <LoadingState 
                      size={36} 
                      message="Loading history..." 
                    />
                  </td>
                </tr>
              ) : filteredAssessments.length > 0 ? filteredAssessments.map((a, idx) => (
                <tr key={idx} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F0FDF4'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={tableCellStyle(isTablet)}>
                    <span style={{ fontWeight: 600, color: theme.textMuted }}>{idx + 1}</span>
                  </td>
                  <td style={tableCellStyle(isTablet)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ 
                          width: 36, height: 36, borderRadius: '50%', 
                          background: getAvatarColor(a.patient_name) + '15', color: getAvatarColor(a.patient_name), 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 14, flexShrink: 0,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          {a.patient_name?.charAt(0)}
                        </div>
                        {/* Online Status Dot */}
                        <div 
                          style={{
                            position: "absolute",
                            bottom: -1,
                            right: -1,
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            border: "2px solid white",
                            background: a.patient_is_online ? "#10b981" : "#94a3b8",
                            boxShadow: a.patient_is_online ? "0 0 6px #10b981" : "none",
                            zIndex: 1,
                          }}
                          title={a.patient_is_online ? "Active Now" : "Offline"}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: isTablet ? 13 : 15, color: theme.textPrimary }}>{a.patient_name}</div>
                        <div style={{ fontSize: 11, color: theme.textMuted }}>ID: #{a.patient_id}</div>
                        {isTablet && (
                          <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2 }}>
                            {a.created_at && new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {!isTablet && (
                  <td style={tableCellStyle(isTablet)}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary }}>
                      {a.created_at && new Date(a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>
                      {new Date(a.created_at || a.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  )}
                  <td style={tableCellStyle(isTablet)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Stethoscope size={16} color={theme.textMuted} />
                        <span style={{ fontWeight: 600, fontSize: 14, color: theme.textSecondary }}>
                         Dr. {a.assigned_doctor || 'Unassigned'}
                        </span>
                    </div>
                  </td>
                  <td style={tableCellStyle(isTablet)}>
                    {getStatusBadge(a.status)}
                  </td>
                  <td style={{ ...tableCellStyle(isTablet), textAlign: "right" }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {a.status?.toLowerCase() === 'draft' ? (
                        <button
                          onClick={() => navigate(`/nurse/assessment/new?draft=${a.id}`)}
                          style={{ padding: 8, borderRadius: 8, border: 'none', background: '#F0FDF4', color: '#166534', cursor: 'pointer' }}
                          title="Continue Draft"
                        >
                          <FileText size={18} />
                        </button>
                      ) : (
                        <div style={{ width: 34 }}></div>
                      )}
                      
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm("Are you sure you want to delete this assessment?")) return;
                          try {
                            const res = await api.delete(`/nurse/assessments/${a.id}`);
                            if (res.ok) {
                              setAssessments(prev => prev.filter(x => x.id !== a.id));
                              toast.success("Assessment deleted successfully");
                            } else {
                              const err = await res.json().catch(() => ({}));
                              toast.error(err.detail || "Failed to delete assessment");
                            }
                          } catch (err) {
                            console.error("Delete failed:", err);
                            toast.error("Failed to delete assessment");
                          }
                        }}
                        style={{ padding: 8, borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#991B1B', cursor: 'pointer' }}
                        title="Delete Assessment"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isTablet ? 5 : 6} style={{ padding: '80px', textAlign: 'center', color: theme.textMuted }}>
                    No assessment history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
        </Card>
      </main>
    </div>
  );
}

const mobileLabelStyle = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#94A3B8",
  minWidth: 48,
  flexShrink: 0,
};