
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

import ThemeToggle from "../../components/ThemeToggle";
import { api } from "../../utils/api";
import { useNavigate, NavLink } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Phone,
  ArrowRight,
  Loader2,
  Calendar,
  Heart,
  TrendingUp,
  MessageCircle,
  ClipboardList
} from 'lucide-react';
import PatientSidebar from "../../components/PatientSidebar";
import { useTheme } from "../../ThemeContext";
import { PageTitle, Divider, Card, PrimaryBtn, OutlineBtn, Badge } from "../../components/UI";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/patient/dashboard');
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    if (user?.email) {
      fetchDashboard();
    }
  }, [user?.email]);

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <PatientSidebar />
      <main className="portal-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color={theme.primary} style={{ marginBottom: 16 }} />
          <div style={{ color: theme.textMuted, fontWeight: 500 }}>Loading your portal...</div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <PatientSidebar />

      <main className="portal-main" style={{ background: theme.pageBg }}>
        {/* Welcome Header */}
        <div style={{
          background: theme.heroGradient,
          padding: "40px",
          borderRadius: 24,
          color: "white",
          marginBottom: 32,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{
                fontFamily: theme.fontHeading,
                fontSize: 36, fontWeight: 800,
                margin: "0 0 8px 0"
              }}>
                {dashboardData?.welcome_message?.split(',')[0] || "Welcome back"}, <span style={{ color: theme.isDark ? '#2DD4BF' : '#22D3EE' }}>{user?.fullName?.split(' ')[0]}!</span>
              </h1>
              <div style={{ display: "flex", gap: 16, alignItems: "center", opacity: 0.9, fontSize: 14 }}>
                <span>Week {dashboardData?.pregnancy_week || 'N/A'} of Pregnancy</span>
              </div>
            </div>
            <ThemeToggle inHeader={true} />
          </div>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -20, right: -20, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
          <div style={{ position: "absolute", bottom: -40, left: "40%", width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        </div>

        <div className="stats-grid-3" style={{ marginBottom: 32 }}>
          {/* My Doctor */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.primaryBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart size={18} color={theme.primary} />
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>My Clinician</h3>
            </div>
            {dashboardData?.doctor_info?.name ? (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Dr. {dashboardData.doctor_info.name}</div>
                <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 12 }}>{dashboardData.doctor_info.department}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.textMuted }}>
                  <Phone size={14} /> {dashboardData.doctor_info.phone}
                </div>
              </div>
            ) : (
              <div style={{ color: theme.textMuted, fontSize: 14, fontStyle: "italic" }}>Assigning clinician soon...</div>
            )}
          </Card>

          {/* Next Visit */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.isDark ? "#1E3A8A" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={18} color={theme.isDark ? "#BFDBFE" : "#1D4ED8"} />
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Next Appointment</h3>
            </div>
            {dashboardData?.next_appointment?.date ? (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>{dashboardData.next_appointment.date}</div>
                <div style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 12 }}>{dashboardData.next_appointment.time} • {dashboardData.next_appointment.type}</div>
                <NavLink to="/patient/appointments" style={{ textDecoration: "none" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: theme.primary, display: "flex", alignItems: "center", gap: 4 }}>
                    Manage Visits <ArrowRight size={14} />
                  </span>
                </NavLink>
              </div>
            ) : (
              <div style={{ color: theme.textMuted, fontSize: 14, fontStyle: "italic" }}>No upcoming visits.</div>
            )}
          </Card>

          {/* Wellness Status */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.isDark ? "#064E3B" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={18} color={theme.isDark ? "#A7F3D0" : "#047857"} />
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Wellness Status</h3>
            </div>
            {dashboardData?.risk_status?.level && dashboardData?.risk_status?.level !== 'N/A' ? (
              <div>
                <Badge type={dashboardData.risk_status.level === 'High' ? 'danger' : dashboardData.risk_status.level === 'Moderate' ? 'warning' : 'success'}>
                  {dashboardData.risk_status.level === 'High' ? 'Needs Extra Care' : dashboardData.risk_status.level === 'Moderate' ? 'Stay Consistent' : 'Feeling Well'}
                </Badge>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 12 }}>Last checked: {dashboardData.risk_status.date}</div>
                <NavLink to="/patient/results" style={{ textDecoration: "none", display: "block", marginTop: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: theme.primary, display: "flex", alignItems: "center", gap: 4 }}>
                    View Trends <ArrowRight size={14} />
                  </span>
                </NavLink>
              </div>
            ) : (
              <div style={{ color: theme.textMuted, fontSize: 14, fontStyle: "italic" }}>Complete an assessment to see status.</div>
            )}
          </Card>
        </div>

        {/* Journey Chart */}
        <Card style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>My Mental Health Journey</h3>
            <Badge type="warning">Wellness Score Trend</Badge>
          </div>
          {dashboardData?.risk_trend?.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={dashboardData.risk_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.divider} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: theme.textMuted, fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: theme.cardBg, color: theme.textPrimary, borderRadius: '12px', border: `1px solid ${theme.cardBorder}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: theme.fontBody }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={theme.primary}
                    strokeWidth={4}
                    dot={{ r: 6, fill: theme.primary, strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: theme.primary, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted, fontSize: 14 }}>
              Your assessment trends will be visualized here.
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="stats-grid-2" style={{ gap: 24 }}>
          <Card>
            <h3 style={{ fontSize: 18, fontWeight: 300, color: theme.textPrimary, marginBottom: 16 }}>Need to talk?</h3>
            <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
              Send a secure message to your clinician if you're feeling overwhelmed or have questions about your care.
            </p>
            <PrimaryBtn onClick={() => navigate("/patient/messages")}>
              <MessageCircle size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
              Send Message
            </PrimaryBtn>
          </Card>

          <Card>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, marginBottom: 16 }}>Daily Care Plan</h3>
            <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.6, marginBottom: 20 }}>
              Check your personalized care plan for today's recommended activities and medication reminders.
            </p>
            <OutlineBtn onClick={() => navigate("/patient/careplan")}>
              <ClipboardList size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
              View Care Plan
            </OutlineBtn>
          </Card>
        </div>

      </main>
    </div>
  );
}



