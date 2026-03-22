import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Badge, Loader2 } from "../../components/UI";
import { api } from "../../utils/api";
import { dummyApi, USE_DUMMY_DATA, getAvatarColor } from "../../utils/dummyData";
import toast from "react-hot-toast";
import { Search, Filter, PlusCircle, User, Phone, Calendar, Stethoscope, MessageSquare, MoreHorizontal, ChevronRight, ClipboardList } from "lucide-react";

export default function NursePatientsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const doctorId = searchParams.get('doctor');
  const initialFilter = searchParams.get('filter') || "All";
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState(initialFilter); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    // Reset to page 1 when filter or search changes
    setCurrentPage(1);
  }, [filter, searchQuery]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        if (USE_DUMMY_DATA) {
          const data = await dummyApi.getPatients({ limit: 50 });
          setPatients(data);
        } else {
          const res = await api.get("/nurse/patients");
          if (res.ok) {
            const data = await res.json();
            setPatients(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        toast.error("Failed to load patients");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery);
    
    const matchesDoctor = !doctorId || p.assigned_doctor_id === doctorId;

    if (!matchesDoctor) return false;

    if (filter === "All") return matchesSearch;
    if (filter === "Assessed") return matchesSearch && (p.last_assessment || p.last_assessment_date);
    if (filter === "Pending") return matchesSearch && p.status === "Pending";
    if (filter === "Draft") return matchesSearch && p.status === "Draft";
    return matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabStyle = (active) => ({
    padding: '10px 24px',
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    background: active ? theme.primary : theme.cardBg,
    color: active ? 'white' : theme.textMuted,
    border: active ? 'none' : `1.5px solid ${theme.border}`,
    transition: 'all 0.2s'
  });

  const labelStyle = {
    fontSize: 13,
    fontWeight: 800,
    color: theme.isDark ? "#FFFFFF" : theme.textSecondary,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4
  };
  const tableHeaderStyle = {
    padding: '16px 20px',
    textAlign: 'left',
    letterSpacing: 1,
    borderBottom: `1px solid ${theme.border}`,
    background: theme.tableHeaderBg || theme.cardBgSecondary
  };

  const tableRowStyle = {
    borderBottom: `1px solid ${theme.border}`,
    transition: 'background 0.2s',
    cursor: 'pointer'
  };

  const tableCellStyle = {
    padding: '20px',
    fontSize: 15,
    color: theme.text,
    verticalAlign: 'middle'
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <NurseSidebar />

      <main style={{ flex: 1, marginLeft: 260, padding: "40px 48px", width: "calc(100% - 260px)", boxSizing: "border-box" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <PageTitle title="Patients Directory" subtitle="Manage all registered mothers and their assessment status" />
          <button
            onClick={() => navigate("/nurse/patients/new")}
            style={{
              padding: '12px 24px', borderRadius: 12, border: 'none',
              background: theme.primary, color: 'white', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              boxShadow: `0 8px 20px -6px ${theme.primary}50`
            }}
          >
            <PlusCircle size={20} /> Register New Patient
          </button>
        </div>

        {/* Filters & Search */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 20 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {["All", "Assessed", "Pending", "Draft"].map(t => (
              <button key={t} onClick={() => setFilter(t)} style={tabStyle(filter === t)}>{t}</button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
            <input
              style={{
                width: '100%', padding: '12px 16px 12px 48px', borderRadius: 14,
                border: `1.5px solid ${theme.border}`, background: theme.inputBg, color: theme.text,
                fontSize: 15, outline: 'none', fontFamily: theme.fontBody
              }}
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Doctor Filter Indicator */}
        {doctorId && (
          <div style={{ 
            marginBottom: 24, padding: '14px 24px', borderRadius: 16, 
            background: `${theme.primary}08`, border: `1.5px dashed ${theme.primary}40`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 8, background: theme.primary, borderRadius: 10, color: 'white' }}>
                <Stethoscope size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: theme.textMuted, fontWeight: 600 }}>Filtering Patients for:</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>
                  {patients.find(p => p.assigned_doctor_id === doctorId)?.assigned_doctor_name || 'Assigned Doctor'}
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                searchParams.delete('doctor');
                setSearchParams(searchParams);
              }}
              style={{ 
                padding: '10px 20px', borderRadius: 12, border: 'none', 
                background: theme.primary, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                boxShadow: `0 4px 12px ${theme.primary}30`
              }}
            >
              Show All Patients
            </button>
          </div>
        )}

        <Card padding="0">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.tableHeaderBg || (theme.isDark ? theme.innerBg : theme.cardBgSecondary) }}>
                <th style={{ ...tableHeaderStyle, width: '60px', borderBottom: 'none' }}>S.No</th>
                <th style={tableHeaderStyle}>Patient Name</th>
                <th style={tableHeaderStyle}>Phone / Week</th>
                <th style={tableHeaderStyle}>Assigned Doctor</th>
                <th style={tableHeaderStyle}>Last Assessment</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '60px', textAlign: 'center' }}>
                    <Loader2 className="animate-spin" size={32} color={theme.primary} style={{ margin: '0 auto 16px' }} />
                    <div style={{ color: theme.textMuted }}>Loading patients...</div>
                  </td>
                </tr>
              ) : paginatedPatients.length > 0 ? paginatedPatients.map((p, idx) => (
                <tr key={`${p.id}-${idx}`} style={tableRowStyle} onMouseEnter={(e) => e.currentTarget.style.background = theme.tableHover || (theme.isDark ? 'rgba(255,255,255,0.03)' : theme.pageBg)} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => navigate(`/nurse/patients/${p.id}`)}>
                  <td style={{ ...tableCellStyle, fontWeight: 700, color: theme.textMuted }}>
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td style={tableCellStyle}>
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
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 600 }}>{p.phone || '-'}</div>
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Week {p.pregnancy_week || '-'}</div>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Stethoscope size={16} color={theme.textMuted} />
                      <span style={{ fontWeight: 600 }}>{p.assigned_doctor_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ color: theme.textMuted, fontSize: 14 }}>{p.last_assessment_date || p.last_assessment || 'No assessment yet'}</div>
                  </td>
                  <td style={tableCellStyle}>
                    <Badge variant={
                      p.status === 'Draft' ? 'warning' :
                        p.status === 'Pending' ? 'secondary' : 'success'
                    }>
                      {['Draft', 'Pending', 'Active'].includes(p.status) ? p.status : 'Active'}
                    </Badge>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => navigate(`/nurse/assessment/new?patient=${p.id}`)} title="New Assessment" style={{ padding: 8, borderRadius: 8, border: 'none', background: `${theme.secondary}15`, color: theme.secondary, cursor: 'pointer' }}><ClipboardList size={18} /></button>
                      <button onClick={() => navigate(`/nurse/messages?to=${p.id}`)} title="Send Message" style={{ padding: 8, borderRadius: 8, border: 'none', background: `${theme.primary}15`, color: theme.primary, cursor: 'pointer' }}><MessageSquare size={18} /></button>
                      <button onClick={() => navigate(`/nurse/patients/${p.id}`)} title="View Profile" style={{ padding: 8, borderRadius: 8, border: 'none', background: `${theme.textMuted}15`, color: theme.textMuted, cursor: 'pointer' }}><ChevronRight size={18} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '60px', textAlign: 'center', color: theme.textMuted }}>
                    No patients found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div style={{ 
              padding: '20px 40px', 
              borderTop: `1px solid ${theme.border}`, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 16,
              background: theme.cardBgSecondary
            }}>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(prev - 1, 1)); }}
                disabled={currentPage === 1}
                style={{ 
                  padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${theme.border}`, 
                  background: currentPage === 1 ? 'transparent' : theme.cardBg, 
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  color: currentPage === 1 ? theme.textMuted : theme.text,
                  fontWeight: 600, fontSize: 13
                }}
              >
                Previous
              </button>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>
                 Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(prev + 1, totalPages)); }}
                disabled={currentPage === totalPages}
                style={{ 
                  padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${theme.border}`, 
                  background: currentPage === totalPages ? 'transparent' : theme.cardBg, 
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  color: currentPage === totalPages ? theme.textMuted : theme.text,
                  fontWeight: 600, fontSize: 13
                }}
              >
                Next
              </button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}


