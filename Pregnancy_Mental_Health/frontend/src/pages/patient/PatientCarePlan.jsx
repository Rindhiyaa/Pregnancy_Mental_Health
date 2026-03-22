import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../utils/api";
import {
  ClipboardList,
  AlertCircle,
  Stethoscope,
  CheckCircle2,
  Calendar,
  Phone,
  Clock,
  Heart,
  Sparkles,
  Smile,
  Loader2,
  Info,
  User
} from 'lucide-react';
import PatientSidebar from "../../components/PatientSidebar";
import { useTheme } from "../../ThemeContext";
import { PageTitle, Divider, Card, Badge, PrimaryBtn, OutlineBtn } from "../../components/UI";

const DUMMY_CAREPLAN = {
  last_updated: "18 March 2026",
  wellness_status: "extra-care",
  wellness_label: "Needs Extra Care",
  wellness_sub: "Dr. Priya is supporting you",
  doctor_recommendation:
    "You deserve extra support right now — and that is completely okay. " +
    "A specialist will help guide you through this phase. Keep attending " +
    "your follow-ups and practicing daily self-care.",
  doctor_name: "Dr. Priya",
  rec_date: "18 March 2026",
  action_steps: [
    "Attend all 3 scheduled follow-up appointments",
    "Contact the referred mental health specialist",
    "Practice daily breathing exercises (see Resources)",
    "Log your mood every day in the tracker",
    "Reach out to your support system — family or friends",
  ],
  followups: [
    { id: 1, type: "Follow-up #1", date: "25 Mar 2026", time: "10:00 AM", status: "upcoming" },
    { id: 2, type: "Follow-up #2", date: "08 Apr 2026", time: "10:00 AM", status: "upcoming" },
    { id: 3, type: "Follow-up #3", date: "22 Apr 2026", time: "10:00 AM", status: "upcoming" },
  ],
  specialist: {
    name: "Dr. Meena Sharma",
    role: "Psychiatrist",
    hospital: "City Hospital — Mental Health Dept",
    phone: "044-XXXXXXXX",
  },
};

export default function PatientCarePlan() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const res = await api.get('/patient/dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.care_plan && data.risk_status) {
            setPlan({
              last_updated: data.care_plan.date,
              wellness_status: data.risk_status.level === 'High' ? 'extra-care' : (data.risk_status.level === 'Moderate' ? 'consistent' : 'feeling-well'),
              wellness_label: data.risk_status.level === 'High' ? 'Needs Extra Care' : (data.risk_status.level === 'Moderate' ? 'Stay Consistent' : 'Feeling Well'),
              wellness_sub: `Dr. ${data.doctor_info?.name || 'Assigned Clinician'} has a plan for you`,
              doctor_recommendation: data.care_plan.plan,
              doctor_name: `Dr. ${data.doctor_info?.name || 'Assigned Clinician'}`,
              rec_date: data.care_plan.date,
              action_steps: [
                "Attend all scheduled follow-up appointments",
                "Contact mental health specialist if recommended",
                "Practice daily breathing exercises (see Resources)",
                "Log your mood every day in the tracker"
              ],
              followups: [],
              specialist: DUMMY_CAREPLAN.specialist
            });

            const appRes = await api.get('/patient/appointments');
            if (appRes.ok) {
              const appData = await appRes.json();
              setPlan(prev => ({
                ...prev,
                followups: appData.map((app, idx) => ({
                  id: app.id,
                  type: app.type || `Follow-up #${idx + 1}`,
                  date: new Date(app.scheduled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                  time: new Date(app.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: app.status === 'completed' ? 'completed' : 'upcoming'
                }))
              }));
            }
          } else {
            setPlan(DUMMY_CAREPLAN);
          }
        } else {
          setPlan(DUMMY_CAREPLAN);
        }
      } catch (error) {
        console.error("Error fetching care plan:", error);
        setPlan(DUMMY_CAREPLAN);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchPlan();
    }
  }, [user?.email]);

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <PatientSidebar />
      <main style={{ flex: 1, marginLeft: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color={theme.primary} style={{ marginBottom: 16 }} />
          <div style={{ color: theme.textMuted, fontWeight: 500 }}>Loading your care plan...</div>
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
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
          <PageTitle
            title="My Care Plan"
            subtitle="Your personalized path to wellness"
          />
          <div style={{ fontSize: 12, color: theme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} /> Last updated: {plan?.last_updated || "N/A"}
          </div>
        </div>
        <Divider />

        {/* ── WELLNESS STATUS BANNER ── */}
        <Card style={{
          background: plan?.wellness_status === 'extra-care' ? theme.dangerBg : (plan?.wellness_status === 'consistent' ? theme.warningBg : theme.successBg),
          border: "none",
          padding: "32px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 32
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: theme.cardBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: `1px solid ${theme.border}`
          }}>
            {plan?.wellness_status === 'extra-care' ? <Heart size={32} color={theme.dangerText} /> :
              (plan?.wellness_status === 'consistent' ? <Sparkles size={32} color={theme.warningText} /> :
                <Smile size={32} color={theme.successText} />)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Current Wellness Status</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 4 }}>{plan?.wellness_label}</div>
            <div style={{ fontSize: 14, color: theme.textSecondary }}>{plan?.wellness_sub}</div>
          </div>
        </Card>

        {/* ── EMERGENCY STRIP ── */}
        <Card style={{ background: theme.primary, color: "white", padding: "16px 24px", marginBottom: 32, border: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <AlertCircle size={20} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Feeling overwhelmed right now? <span style={{ opacity: 0.9, fontWeight: 400 }}>Support is available 24/7.</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>iCall: 9152987821</div>
            <PrimaryBtn style={{ background: "white", color: theme.primary, padding: "8px 16px" }} onClick={() => window.location.href = "tel:9152987821"}>
              <Phone size={14} style={{ marginRight: 8, verticalAlign: "middle" }} /> Call Now
            </PrimaryBtn>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 32 }}>
          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Recommendation */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.primaryBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Stethoscope size={18} color={theme.primary} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Clinician's Recommendation</h3>
              </div>
              <div style={{ position: "relative", padding: "24px 32px", background: theme.primaryBg, borderRadius: 16 }}>
                <div style={{ fontSize: 24, color: theme.primary, opacity: 0.2, position: "absolute", top: 10, left: 15, fontFamily: "serif" }}>"</div>
                <p style={{ fontSize: 15, color: theme.textPrimary, lineHeight: 1.8, fontStyle: "italic", margin: 0, position: "relative", zIndex: 1 }}>
                  {plan?.doctor_recommendation || "Your clinician will provide a personalized recommendation after your assessment."}
                </p>
                <div style={{ fontSize: 24, color: theme.primary, opacity: 0.2, position: "absolute", bottom: -10, right: 15, fontFamily: "serif" }}>"</div>
              </div>
              <div style={{ textAlign: "right", marginTop: 16, fontSize: 14, fontWeight: 700, color: theme.primary }}>
                — {plan?.doctor_name}
              </div>
            </Card>

            {/* Action Steps */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.isDark ? "rgba(4, 120, 87, 0.2)" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={18} color={theme.isDark ? "#A7F3D0" : "#047857"} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Your Action Steps</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {plan?.action_steps?.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "16px", background: theme.innerBg, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: theme.primaryBg, color: theme.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 14, color: theme.textPrimary, lineHeight: 1.5 }}>{step}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Follow-up Schedule */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.isDark ? "rgba(29, 78, 216, 0.2)" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Calendar size={18} color={theme.isDark ? "#BFDBFE" : "#1D4ED8"} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Follow-up Schedule</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {plan?.followups?.map((f) => (
                  <div key={f.id} style={{ padding: "16px", borderRadius: 12, border: `1px solid ${theme.border}`, background: f.status === 'completed' ? theme.innerBg : theme.cardBg, opacity: f.status === 'completed' ? 0.7 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{f.type}</span>
                      <Badge type={f.status === 'completed' ? 'success' : 'primary'}>{f.status}</Badge>
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: theme.textMuted }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={14} /> {f.date}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={14} /> {f.time}</span>
                    </div>
                  </div>
                ))}
                {plan?.followups?.length === 0 && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: theme.textMuted, fontSize: 13, fontStyle: "italic" }}>No follow-ups scheduled yet.</div>
                )}
              </div>
            </Card>

            {/* Specialist Info */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.primaryBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={18} color={theme.primary} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Recommended Specialist</h3>
              </div>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: theme.primaryBg, color: theme.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, margin: "0 auto 16px" }}>
                  {plan?.specialist?.name?.charAt(4)}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>{plan?.specialist?.name}</div>
                <div style={{ fontSize: 13, color: theme.primary, fontWeight: 600, marginBottom: 16 }}>{plan?.specialist?.role}</div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 20 }}>{plan?.specialist?.hospital}</div>
                <PrimaryBtn style={{ width: "100%" }} onClick={() => window.location.href = `tel:${plan?.specialist?.phone}`}>
                  <Phone size={14} style={{ marginRight: 8, verticalAlign: "middle" }} /> Call Specialist
                </PrimaryBtn>
              </div>
            </Card>
          </div>
        </div>

      </main>
    </div>
  );
}



