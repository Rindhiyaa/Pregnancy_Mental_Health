import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Loader2, HeartPulse, Activity, Smile,
  ChevronDown, ChevronUp, Calendar, Clock,
  CheckCircle, User, Info, MessageCircle, ArrowRight
} from "lucide-react";
import PatientSidebar from "../../components/PatientSidebar";
import { api } from "../../utils/api";
import { useTheme } from "../../ThemeContext";
import { PageTitle, Divider, Card, Badge, PrimaryBtn, Pagination } from "../../components/UI";

// ── DUMMY DATA (shows full UI until API connects) ── 
const DUMMY_ASSESSMENTS = [
  {
    id: 1,
    date: "18 March 2026",
    short_date: "18 Mar",
    wellness_status: "extra-care",
    wellness_label: "Needs Extra Care",
    score: 77.1,
    epds_total: 21,
    doctor_name: "Dr. Priya",
    doctor_agrees: true,
    plan: "Refer to mental health specialist immediately. Weekly counseling sessions recommended.",
    status: "finalized",
    epds_questions: [
      { q: "Able to laugh and see funny side", answer: "Not at all", score: 3 },
      { q: "Looked forward with enjoyment", answer: "Hardly at all", score: 3 },
      { q: "Blamed myself unnecessarily", answer: "Yes, most of the time", score: 3 },
      { q: "Anxious or worried for no reason", answer: "Yes, very often", score: 3 },
      { q: "Scared or panicky for no reason", answer: "Yes, quite a lot", score: 2 },
      { q: "Things getting on top of me", answer: "Yes, mostly not coping", score: 3 },
      { q: "Difficulty sleeping due to unhappiness", answer: "Yes, most of the time", score: 2 },
      { q: "Felt sad or miserable", answer: "Yes, most of the time", score: 3 },
      { q: "Unhappy enough to cry", answer: "Yes, most of the time", score: 2 },
      { q: "Thought of harming myself", answer: "Never", score: 0 },
    ],
    clinical_factors: {
      sleep_quality: "Poor",
      appetite: "Reduced",
      social_support: "Weak",
      partner_support: "Poor",
      anxiety_level: "Severe",
      financial_stress: true,
      previous_depression: true,
    },
    followups: [
      { type: "Follow-up 1", date: "25 Mar 2026", time: "10:00 AM", status: "upcoming" },
      { type: "Follow-up 2", date: "08 Apr 2026", time: "10:00 AM", status: "upcoming" },
      { type: "Follow-up 3", date: "22 Apr 2026", time: "10:00 AM", status: "upcoming" },
    ],
  },
  {
    id: 2,
    date: "01 March 2026",
    short_date: "01 Mar",
    wellness_status: "consistent",
    wellness_label: "Stay Consistent",
    score: 52.3,
    epds_total: 14,
    doctor_name: "Dr. Priya",
    doctor_agrees: true,
    plan: "Continue current routine. Attend follow-up as scheduled.",
    status: "finalized",
    epds_questions: [
      { q: "Able to laugh and see funny side", answer: "Not quite as much", score: 1 },
      { q: "Looked forward with enjoyment", answer: "Rather less than usual", score: 1 },
      { q: "Blamed myself unnecessarily", answer: "Yes, sometimes", score: 2 },
      { q: "Anxious or worried for no reason", answer: "Hardly ever", score: 1 },
      { q: "Scared or panicky for no reason", answer: "Yes, sometimes", score: 2 },
      { q: "Things getting on top of me", answer: "Yes, sometimes not coping", score: 2 },
      { q: "Difficulty sleeping due to unhappiness", answer: "Not very often", score: 1 },
      { q: "Felt sad or miserable", answer: "Not very often", score: 1 },
      { q: "Unhappy enough to cry", answer: "Only occasionally", score: 2 },
      { q: "Thought of harming myself", answer: "Never", score: 0 },
    ],
    clinical_factors: {
      sleep_quality: "Fair",
      appetite: "Normal",
      social_support: "Moderate",
      partner_support: "Good",
      anxiety_level: "Moderate",
      financial_stress: false,
      previous_depression: true,
    },
    followups: [
      { type: "Follow-up 1", date: "10 Mar 2026", time: "10:00 AM", status: "completed" },
    ],
  },
];

export default function PatientResults() {
  const { theme } = useTheme();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const WELLNESS_CONFIG = {
    "extra-care": { label: "Needs Extra Care", color: theme.dangerText, bg: theme.dangerBg, icon: HeartPulse },
    "consistent": { label: "Stay Consistent", color: theme.warningText, bg: theme.warningBg, icon: Activity },
    "feeling-well": { label: "Feeling Well", color: theme.successText, bg: theme.successBg, icon: Smile },
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const cfg = WELLNESS_CONFIG[payload[0].payload.wellness_status];
    return (
      <Card style={{ padding: "10px 14px", border: `1px solid ${theme.divider}`, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: cfg?.color }}>
          {cfg?.label}
        </div>
      </Card>
    );
  };

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await api.get("/patient/assessments");
        if (res.ok) {
          const data = await res.json();
          const riskToWellness = {
            'high': 'extra-care',
            'moderate': 'consistent',
            'low': 'feeling-well'
          };
          const normalized = data?.length ? data.map(a => {
            const riskLevel = a.risk_level?.toLowerCase().split(' ')[0];
            const wellnessStatus = a.wellness_status || riskToWellness[riskLevel] || 'feeling-well';

            return {
              ...a,
              date: a.date || new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
              short_date: a.short_date || new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
              wellness_status: wellnessStatus,
              score: a.score || a.risk_score || 0,
              epds_total: a.epds_total || (a.raw_data ? Object.keys(a.raw_data).filter(k => k.startsWith('epds_')).reduce((acc, k) => acc + a.raw_data[k], 0) : 0),
              doctor_name: a.doctor_name || a.clinician_name || "Assigned Clinician",
              epds_questions: a.epds_questions || (a.raw_data ? Object.keys(a.raw_data).filter(k => k.startsWith('epds_')).map((k, i) => ({
                q: `Question ${i + 1}`,
                answer: "Reported",
                score: a.raw_data[k]
              })) : []),
              clinical_factors: a.clinical_factors || {
                sleep_quality: a.raw_data?.epds_7 > 1 ? "Poor" : "Good",
                appetite: "Normal",
                social_support: a.raw_data?.support_during_pregnancy === "No" ? "Weak" : "Strong",
                partner_support: "Good",
                anxiety_level: "Normal",
                financial_stress: false,
                previous_depression: a.raw_data?.depression_before_pregnancy === "Yes"
              },
              plan: a.plan || "Follow standard care plan.",
              followups: a.followups && a.followups.length > 0 ? a.followups : [
                { 
                  type: "Follow-up", 
                  date: new Date(new Date(a.created_at || new Date()).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
                  time: "10:00 AM"
                }
              ]
            };
          }) : DUMMY_ASSESSMENTS;
          setAssessments(normalized);
        } else {
          setAssessments(DUMMY_ASSESSMENTS);
        }
      } catch {
        setAssessments(DUMMY_ASSESSMENTS);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  const trendData = [...assessments].map(a => ({
    date: a.short_date,
    score: a.score,
    wellness_status: a.wellness_status,
  })).reverse();

  const latest = assessments[0];

  const totalPages = Math.ceil(assessments.length / itemsPerPage);
  const paginatedAssessments = assessments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <PatientSidebar />
      <main style={{ flex: 1, marginLeft: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color={theme.primary} style={{ marginBottom: 16 }} />
          <div style={{ color: theme.textMuted, fontWeight: 500 }}>Loading your results...</div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <PatientSidebar />

      <main style={{
        flex: 1,
        marginLeft: 260,
        padding: "40px 48px",
        width: "calc(100% - 260px)",
        boxSizing: "border-box",
        background: theme.pageBg
      }}>

        <PageTitle
          title="My Results"
          subtitle="Your complete wellness assessment history"
        />
        <Divider />

        {/* ── SUMMARY ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: theme.primary, marginBottom: 4 }}>{assessments.length}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Assessments</div>
          </Card>
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 4 }}>
              {latest?.short_date ?? "—"}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Latest Submission</div>
          </Card>
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 4 }}>
              {assessments.filter(a => a.status === "finalized" || a.status === "completed").length}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Clinician Reviewed</div>
          </Card>
        </div>

        {/* ── ASSESSMENT LIST ── */}
        <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, marginBottom: 20 }}>Assessment History</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {paginatedAssessments.map((a) => (
            <Card key={a.id} style={{ padding: 0, overflow: "hidden" }}>
              <div
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>{a.short_date.split(' ')[1]}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary }}>{a.short_date.split(' ')[0]}</div>
                  </div>
                  <div style={{ height: 32, width: 1, background: theme.divider }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary }}>Assessment completed</span>
                      {a.status === "finalized" && <Badge type="info" size="sm">Clinician Reviewed</Badge>}
                    </div>
                    <div style={{ fontSize: 13, color: theme.textMuted }}>
                      Completed on {a.date} • Reviewed by <strong>Dr. {a.doctor_name || "Care Team"}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ color: theme.primary }}>
                  {expanded === a.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expanded === a.id && (
                <div style={{ padding: "0 24px 24px 24px", borderTop: `1px solid ${theme.divider}` }}>
                  <div style={{ paddingTop: 24, maxWidth: "800px" }}>
                    
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <MessageCircle size={18} color={theme.primary} /> Doctor's Message
                    </h4>
                    <Card style={{ background: theme.primaryBg, border: "none", marginBottom: 32 }}>
                      <p style={{ fontSize: 15, color: theme.primaryText, lineHeight: 1.6, margin: 0 }}>
                        "We recommend a follow-up visit to discuss your wellbeing and provide support."
                      </p>
                    </Card>

                    <h4 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle size={18} color={theme.success} /> Care Plan & Next Steps
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px", background: theme.pageBg, borderRadius: 12 }}>
                      {a.followups && a.followups.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: theme.textPrimary, fontWeight: 700 }}>
                            <div style={{ background: theme.primary + "20", padding: "4px", borderRadius: "50%", display: "flex" }}>
                                <Calendar size={18} color={theme.primary} /> 
                            </div>
                            Meeting Scheduled: {a.followups[0].date} at {a.followups[0].time}
                          </div>
                      )}
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: theme.textSecondary, fontWeight: 500 }}>
                        <div style={{ background: theme.success + "20", padding: "4px", borderRadius: "50%", display: "flex" }}>
                            <CheckCircle size={18} color={theme.success} /> 
                        </div>
                        Attend scheduled follow-up
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: theme.textSecondary, fontWeight: 500 }}>
                        <div style={{ background: theme.success + "20", padding: "4px", borderRadius: "50%", display: "flex" }}>
                            <CheckCircle size={18} color={theme.success} /> 
                        </div>
                        Practice relaxation techniques
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: theme.textSecondary, fontWeight: 500 }}>
                        <div style={{ background: theme.success + "20", padding: "4px", borderRadius: "50%", display: "flex" }}>
                            <CheckCircle size={18} color={theme.success} /> 
                        </div>
                        Reach out if you feel overwhelmed
                      </div>
                    </div>

                    <PrimaryBtn style={{ marginTop: 24, width: "fit-content" }} onClick={() => window.print()}>
                      Print Summary
                    </PrimaryBtn>

                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* ── HELP FOOTER ── */}
        <div style={{
          marginTop: 40,
          padding: "28px 32px",
          background: theme.primaryBg,
          borderRadius: 16,
          border: `1.5px solid ${theme.primary}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: theme.primary + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MessageCircle size={22} color={theme.primary} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Questions? Message your care team</div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>Your clinician is here to support you every step of the way.</div>
            </div>
          </div>
          <PrimaryBtn onClick={() => window.location.href = "/patient/messages"}>
            <MessageCircle size={16} style={{ verticalAlign: "middle", marginRight: 8 }} /> Message Now
          </PrimaryBtn>
        </div>
      </main>
    </div>
  );
}



