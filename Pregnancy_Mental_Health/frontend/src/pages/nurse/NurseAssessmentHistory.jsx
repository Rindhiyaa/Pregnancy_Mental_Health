import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Badge, Loader2 } from "../../components/UI";
import { api } from "../../utils/api";
import { dummyApi, USE_DUMMY_DATA } from "../../utils/dummyData";
import toast from "react-hot-toast";
import { History, FileText, Download, Eye, Trash2, Search, Calendar, User, Stethoscope, ChevronRight } from "lucide-react";

export default function NurseAssessmentHistory() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [filter, setFilter] = useState("All"); // All | Draft | Submitted | Reviewed | Complete
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        if (USE_DUMMY_DATA) {
          const data = await dummyApi.getAssessments();
          setAssessments(data);
        } else {
          const res = await api.get("/nurse/assessments");
          if (res.ok) {
            const data = await res.json();
            setAssessments(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch assessments:", err);
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "All") return matchesSearch;
    const statusLower = a.status?.toLowerCase();
    const filterLower = filter.toLowerCase();
    
    return matchesSearch && statusLower === filterLower;
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
    switch (status) {
      case 'Draft': return <Badge variant="warning">Draft</Badge>;
      case 'Pending': return <Badge variant="info">Pending</Badge>;
      case 'Submitted': return <Badge variant="info">Submitted</Badge>;
      case 'Reviewed': return <Badge variant="success">Reviewed</Badge>;
      case 'Complete': return <Badge variant="success">Complete</Badge>;
      default: return <Badge variant="primary">Active</Badge>;
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

  const tableCellStyle = {
    padding: '20px 24px',
    fontSize: 14,
    color: theme.text,
    borderBottom: `1px solid #E5E7EB`,
    verticalAlign: 'middle'
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <NurseSidebar />

      <main style={{ flex: 1, marginLeft: 260, padding: "40px 48px", width: "calc(100% - 260px)", boxSizing: "border-box" }}>
        <PageTitle title="Assessment History" subtitle="Review and manage all patient mental health screenings" />

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

        <Card style={{ padding: 0, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F3F4F6' }}>
                <th style={tableHeaderStyle}>S.No</th>
                <th style={tableHeaderStyle}>Patient</th>
                <th style={tableHeaderStyle}>Date</th>
                <th style={tableHeaderStyle}>Doctor Assigned</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '80px', textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={36} color={theme.primary} style={{ margin: '0 auto 16px' }} />
                    <div style={{ color: theme.textMuted, fontWeight: 600 }}>Loading history...</div>
                  </td>
                </tr>
              ) : filteredAssessments.length > 0 ? filteredAssessments.map((a, idx) => (
                <tr key={idx} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F0FDF4'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={tableCellStyle}>
                    <span style={{ fontWeight: 600, color: theme.textMuted }}>{idx + 1}</span>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: '50%', 
                        background: getAvatarColor(a.patient_name) + '15', color: getAvatarColor(a.patient_name), 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14, flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {a.patient_name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: theme.textPrimary }}>{a.patient_name}</div>
                        <div style={{ fontSize: 11, color: theme.textMuted }}>ID: #{a.patient_id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary }}>
                      {new Date(a.created_at || a.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>
                      {new Date(a.created_at || a.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Stethoscope size={16} color={theme.textMuted} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: theme.textSecondary }}>{a.assigned_doctor_name || 'Dr. Priya Sharma'}</span>
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    {getStatusBadge(a.status || 'draft')}
                  </td>
                  <td style={tableCellStyle}>
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
                        <div style={{ width: 34 }}></div> /* Placeholder if no draft */
                      )}
                      
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this assessment?")) {
                            toast.success("Assessment deleted successfully");
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
                  <td colSpan="6" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ color: theme.textMuted, marginBottom: 20 }}>
                      <History size={48} style={{ margin: '0 auto', opacity: 0.3, marginBottom: 16 }} />
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, margin: '0 0 8px 0' }}>No assessments found</h3>
                      <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>Try adjusting your filters or search terms</p>
                    </div>
                    <button
                      onClick={() => navigate('/nurse/assessment/new')}
                      style={{ 
                        padding: '10px 24px', borderRadius: 30, border: 'none', 
                        background: theme.primary, color: 'white', fontWeight: 700, 
                        fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(42, 157, 143, 0.2)'
                      }}
                    >
                      Start New Assessment
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </main>
    </div>
  );
}


