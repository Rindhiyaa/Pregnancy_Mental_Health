import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../ThemeContext";
import AdminSidebar from "../../components/AdminSidebar";
import { PageTitle, Divider, Card } from "../../components/UI";
import { api } from "../../utils/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import {
  UserPlus,
  ShieldAlert,
  Users,
  Activity,
  Lock,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Responsive Hook
// ─────────────────────────────────────────────────────────────
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
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const PIE_COLORS = ["#0F766E", "#6366F1", "#F59E0B", "#DC2626", "#14B8A6"];

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0";
  }
  return new Intl.NumberFormat("en-IN").format(Number(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizeSeries(items, labelKeys, valueKeys) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const labelKey = labelKeys.find((key) => item?.[key] !== undefined);
    const valueKey = valueKeys.find((key) => item?.[key] !== undefined);

    return {
      label:
        (labelKey && item?.[labelKey]) ||
        item?.label ||
        item?.day ||
        item?.date ||
        item?.month ||
        `Item ${index + 1}`,
      value: Number((valueKey && item?.[valueKey]) ?? item?.value ?? 0),
    };
  });
}

function normalizePie(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    name: item?.name || item?.role || item?.status || `Item ${index + 1}`,
    value: Number(item?.value ?? item?.count ?? item?.total ?? 0),
  }));
}

function SectionHeader({ icon, title, subtitle, theme, isMobile }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        gap: 10,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          background: "rgba(20,184,166,0.10)",
          color: "#0F766E",
          padding: 8,
          borderRadius: 10,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: isMobile ? 14 : 16,
            fontWeight: 700,
            color: theme.textPrimary,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: isMobile ? 12 : 13,
            color: theme.textMuted,
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, theme, isMobile }) {
  return (
    <Card
      style={{
        padding: isMobile ? 16 : 20,
        minHeight: 116,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: isMobile ? 12 : 13,
              color: theme.textMuted,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: isMobile ? 24 : 28,
              fontWeight: 800,
              lineHeight: 1.1,
              color: theme.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            background: "rgba(20,184,166,0.10)",
            color: "#0F766E",
            padding: 10,
            borderRadius: 12,
            flexShrink: 0,
            height: "fit-content",
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: isMobile ? 11 : 12,
          color: theme.textMuted,
        }}
      >
        {subtitle}
      </div>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/admin/dashboard-analytics");
        const payload = data || {};

        setAnalytics({
          totals: {
            newPatientsToday: Number(
              payload?.totals?.newPatientsToday ?? payload?.newPatientsToday ?? 0
            ),
            newCliniciansToday: Number(
              payload?.totals?.newCliniciansToday ??
                payload?.newCliniciansToday ??
                0
            ),
            dailyLogins: Number(
              payload?.totals?.dailyLogins ?? payload?.dailyLogins ?? 0
            ),
            pendingApprovals: Number(
              payload?.totals?.pendingApprovals ??
                payload?.pendingApprovals ??
                0
            ),
            failedLogins: Number(
              payload?.totals?.failedLogins ??
                payload?.securitySummary?.failedLogins ??
                payload?.failedLogins ??
                0
            ),
            lockedAccounts: Number(
              payload?.totals?.lockedAccounts ??
                payload?.securitySummary?.lockedAccounts ??
                payload?.lockedAccounts ??
                0
            ),
          },

          patientRegistrationTrend: normalizeSeries(
            payload?.newPatientRegistrations || payload?.patientRegistrationTrend || [],
            ["label", "day", "date", "month"],
            ["count", "value", "total"]
          ).map((item) => ({ ...item, count: item.value })),

          clinicianRegistrationTrend: normalizeSeries(
            payload?.newClinicianRegistrations ||
              payload?.clinicianRegistrationTrend ||
              [],
            ["label", "day", "date", "month"],
            ["count", "value", "total"]
          ).map((item) => ({ ...item, count: item.value })),

          loginTrend: normalizeSeries(
            payload?.dailyLoginsTrend || payload?.dailyLoginsSeries || payload?.loginTrend || [],
            ["label", "day", "date", "month"],
            ["count", "value", "total"]
          ).map((item) => ({ ...item, count: item.value })),

          roleDistribution: normalizePie(payload?.roleDistribution || []),
          accountStatus: normalizePie(payload?.accountStatus || []),

          recentUsers: Array.isArray(payload?.recentUsers) ? payload.recentUsers : [],
          recentAuditLogs: Array.isArray(payload?.recentAuditLogs)
            ? payload.recentAuditLogs
            : [],
        });
        
        // Debug logging
        console.log("📊 Analytics Data Loaded:");
        console.log("  - Login Trend:", payload?.dailyLoginsTrend);
        console.log("  - Patient Trend:", payload?.newPatientRegistrations);
        console.log("  - Role Distribution:", payload?.roleDistribution);
        console.log("  - Account Status:", payload?.accountStatus);
      } catch (err) {
        console.error("Failed to load admin analytics:", err);
        setError("Unable to load admin analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const areaChartHeight = isMobile ? 220 : isTablet ? 280 : 330;
  const barChartHeight = isMobile ? 240 : isTablet ? 280 : 320;
  const pieChartHeight = isMobile ? 260 : 300;

  const hasCharts = useMemo(() => {
    if (!analytics) return false;
    return (
      analytics.patientRegistrationTrend.length > 0 ||
      analytics.loginTrend.length > 0 ||
      analytics.roleDistribution.length > 0 ||
      analytics.accountStatus.length > 0
    );
  }, [analytics]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          background: theme.pageBg,
          fontFamily: theme.fontBody,
        }}
      >
        <AdminSidebar />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.pageBg,
          }}
        >
          <div style={{ color: theme.textMuted, fontWeight: 600 }}>
            Loading admin analytics...
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          background: theme.pageBg,
          fontFamily: theme.fontBody,
        }}
      >
        <AdminSidebar />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.pageBg,
            padding: 24,
          }}
        >
          <Card style={{ padding: 24, maxWidth: 460, width: "100%" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                color: "#DC2626",
              }}
            >
              <AlertTriangle size={20} />
              <strong>Admin analytics unavailable</strong>
            </div>
            <p
              style={{
                margin: 0,
                color: theme.textMuted,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {error} Make sure the admin endpoint returns operational metrics only,
              without exposing patient clinical risk details.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: theme.pageBg,
        fontFamily: theme.fontBody,
      }}
    >
      <AdminSidebar />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
          background: theme.pageBg,
          fontFamily: theme.fontBody,
          paddingTop: !isDesktop ? "56px" : 0,
        }}
      >
        <div
          style={{
            padding: isMobile ? "16px" : isTablet ? "24px 28px" : "32px 40px",
          }}
        >
          <PageTitle
            title="Admin Analytics"
            subtitle="User onboarding, access activity, account status, and platform security overview"
          />
          <Divider style={{ margin: "20px 0 28px 0" }} />

          {/* KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(3, minmax(0, 1fr))",
              gap: isMobile ? 14 : 18,
              marginBottom: isMobile ? 20 : 28,
            }}
          >
            <StatCard
              title="New Patients This Week"
              value={formatNumber(analytics?.totals?.newPatientsToday)}
              subtitle="Patient registrations in the last 7 days"
              icon={<UserPlus size={20} />}
              theme={theme}
              isMobile={isMobile}
            />

            <StatCard
              title="New Clinicians This Week"
              value={formatNumber(analytics?.totals?.newCliniciansToday)}
              subtitle="Doctor and staff accounts created in the last 7 days"
              icon={<UserCheck size={20} />}
              theme={theme}
              isMobile={isMobile}
            />

            <StatCard
              title="Weekly Logins"
              value={formatNumber(analytics?.totals?.dailyLogins)}
              subtitle="Successful sign-ins in the last 7 days"
              icon={<Activity size={20} />}
              theme={theme}
              isMobile={isMobile}
            />

            <StatCard
              title="Pending Approvals"
              value={formatNumber(analytics?.totals?.pendingApprovals)}
              subtitle="Accounts awaiting admin review"
              icon={<Users size={20} />}
              theme={theme}
              isMobile={isMobile}
            />

            <StatCard
              title="Failed Login Attempts This Week"
              value={formatNumber(analytics?.totals?.failedLogins)}
              subtitle="Authentication failures in the last 7 days"
              icon={<ShieldAlert size={20} />}
              theme={theme}
              isMobile={isMobile}
            />

            <StatCard
              title="Locked Accounts"
              value={formatNumber(analytics?.totals?.lockedAccounts)}
              subtitle="Users currently blocked from access"
              icon={<Lock size={20} />}
              theme={theme}
              isMobile={isMobile}
            />
          </div>

          {!hasCharts ? (
            <Card style={{ padding: isMobile ? 18 : 24 }}>
              <div
                style={{
                  color: theme.textPrimary,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                No admin analytics data available
              </div>
              <div
                style={{
                  color: theme.textMuted,
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                Populate the endpoint with registration trends, login activity,
                role distribution, account status, recent user creation events,
                and audit logs.
              </div>
            </Card>
          ) : (
            <>
              {/* Row 1 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isDesktop ? "1.4fr 1fr" : "1fr",
                  gap: isMobile ? 20 : 24,
                  marginBottom: isMobile ? 20 : 24,
                }}
              >
                <Card style={{ padding: isMobile ? 16 : 22 }}>
                  <SectionHeader
                    icon={<UserPlus size={20} />}
                    title="New Patient Registrations"
                    subtitle="Patient accounts created across the selected reporting period"
                    theme={theme}
                    isMobile={isMobile}
                  />

                  <div style={{ height: areaChartHeight, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analytics.patientRegistrationTrend}
                        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="patientGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.03} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={theme.divider}
                        />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: isMobile ? 10 : 12, fill: theme.textMuted }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={40}
                          tick={{ fontSize: isMobile ? 10 : 12, fill: theme.textMuted }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: `1px solid ${theme.divider}`,
                            background: theme.cardBg,
                            color: theme.textPrimary,
                          }}
                          formatter={(value) => [formatNumber(value), "Patients"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#14B8A6"
                          strokeWidth={3}
                          fill="url(#patientGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card style={{ padding: isMobile ? 16 : 22 }}>
                  <SectionHeader
                    icon={<Users size={20} />}
                    title="User Role Distribution"
                    subtitle="Platform users grouped by role"
                    theme={theme}
                    isMobile={isMobile}
                  />

                  <div style={{ height: pieChartHeight, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.roleDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? 72 : 92}
                          innerRadius={isMobile ? 40 : 52}
                          paddingAngle={2}
                        >
                          {analytics.roleDistribution.map((entry, index) => (
                            <Cell
                              key={`role-cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Legend
                          wrapperStyle={{
                            fontSize: isMobile ? 11 : 12,
                            color: theme.textMuted,
                          }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: `1px solid ${theme.divider}`,
                            background: theme.cardBg,
                            color: theme.textPrimary,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Row 2 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
                  gap: isMobile ? 20 : 24,
                  marginBottom: isMobile ? 20 : 24,
                }}
              >
                <Card style={{ padding: isMobile ? 16 : 22 }}>
                  <SectionHeader
                    icon={<Activity size={20} />}
                    title="Login Activity"
                    subtitle="Successful platform logins across the reporting period"
                    theme={theme}
                    isMobile={isMobile}
                  />

                  <div style={{ height: barChartHeight, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.loginTrend}
                        margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={theme.divider}
                        />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: isMobile ? 10 : 12, fill: theme.textMuted }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          width={40}
                          tick={{ fontSize: isMobile ? 10 : 12, fill: theme.textMuted }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: `1px solid ${theme.divider}`,
                            background: theme.cardBg,
                            color: theme.textPrimary,
                          }}
                          formatter={(value) => [formatNumber(value), "Logins"]}
                        />
                        <Bar
                          dataKey="count"
                          fill="#0F766E"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={isMobile ? 28 : 40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card style={{ padding: isMobile ? 16 : 22 }}>
                  <SectionHeader
                    icon={<Lock size={20} />}
                    title="Account Status"
                    subtitle="Active, pending, disabled, or locked user accounts"
                    theme={theme}
                    isMobile={isMobile}
                  />

                  <div style={{ height: pieChartHeight, width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.accountStatus}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? 72 : 92}
                          innerRadius={isMobile ? 40 : 52}
                          paddingAngle={2}
                        >
                          {analytics.accountStatus.map((entry, index) => (
                            <Cell
                              key={`status-cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Legend
                          wrapperStyle={{
                            fontSize: isMobile ? 11 : 12,
                            color: theme.textMuted,
                          }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: `1px solid ${theme.divider}`,
                            background: theme.cardBg,
                            color: theme.textPrimary,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Row 3 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
                  gap: isMobile ? 20 : 24,
                }}
              >
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}