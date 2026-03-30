import React, { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import AdminSidebar from "../../components/AdminSidebar";
import { PageTitle, Divider, Card } from "../../components/UI";
import { api } from "../../utils/api";
import {
  LineChart,
  Line,
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
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  BrainCircuit,
  Activity,
  BarChart as BarChartIcon,
  Menu,
} from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";

// ─── Responsive Hook ────────────────────────────────────────────────────────
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
    width,
  };
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when switching to desktop
  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1) totals + recent users
        const { data: dashboard } = await api.get("/admin/dashboard");
        // 2) chart series
        const { data: analytics } = await api.get("/admin/dashboard-analytics");
  
        const dashboardData = dashboard || {};
        const analyticsData = analytics || {};

        setData({
          totals: {
            totalUsers: dashboardData.totalUsers ?? 0,
            totalClinicians: dashboardData.totalClinicians ?? 0,
            totalPatients: dashboardData.totalPatients ?? 0,
            totalAssessments: dashboardData.totalAssessments ?? 0,
          },
          accuracyData: Array.isArray(analyticsData.accuracyData) ? analyticsData.accuracyData : [],
          usageStats: Array.isArray(analyticsData.usageStats) ? analyticsData.usageStats : [],
        });
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Layout values ───────────────────────────────────────────────────────
  const SIDEBAR_WIDTH = 260;
  const mainMarginLeft = isDesktop ? SIDEBAR_WIDTH : 0;
  const mainPadding = isMobile
    ? "16px"
    : isTablet
    ? "24px 28px"
    : "40px 48px";
  const mainWidth = isDesktop ? `calc(100% - ${SIDEBAR_WIDTH}px)` : "100%";

  // ─── Chart heights scale down on mobile ──────────────────────────────────
  const areaChartHeight = isMobile ? 220 : isTablet ? 280 : 350;
  const barChartHeight = isMobile ? 200 : isTablet ? 260 : 320;

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: theme.pageBg,
          fontFamily: theme.fontBody,
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 300,
            width: SIDEBAR_WIDTH,
            transform: isDesktop
              ? "translateX(0)"
              : sidebarOpen
              ? "translateX(0)"
              : "translateX(-100%)",
            transition: "transform 0.3s ease",
          }}
        >
          <AdminSidebar onClose={() => setSidebarOpen(false)} />
        </div>
        <main
          style={{
            flex: 1,
            marginLeft: mainMarginLeft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.pageBg,
            fontFamily: theme.fontBody,
          }}
        >
          <div style={{ color: theme.textMuted, fontWeight: 600 }}>
            Loading analytics data...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: theme.pageBg,
        fontFamily: theme.fontBody,
      }}
    >
      {/* ── Mobile overlay backdrop ── */}
      {!isDesktop && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 200,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── Sidebar drawer ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 300,
          width: SIDEBAR_WIDTH,
          transform: isDesktop
            ? "translateX(0)"
            : sidebarOpen
            ? "translateX(0)"
            : "translateX(-100%)",
          transition: "transform 0.3s ease",
        }}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          marginLeft: mainMarginLeft,
          padding: mainPadding,
          width: mainWidth,
          boxSizing: "border-box",
          minWidth: 0,
          background: theme.pageBg,
          fontFamily: theme.fontBody,
        }}
      >
        {/* ── Mobile top bar ── */}
        {!isDesktop && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              padding: "8px 0",
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: theme.textPrimary,
                display: "flex",
                alignItems: "center",
                padding: 4,
              }}
              aria-label="Open navigation"
            >
              <Menu size={24} />
            </button>
            <span
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: theme.textPrimary,
              }}
            >
              Analytics
            </span>
            <ThemeToggle />
          </div>
        )}

        {/* ── Page Title ── */}
        <PageTitle
          title="System Analytics"
          subtitle="Machine learning performance, platform usage, and clinical insights"
        />
        <Divider style={{ margin: "24px 0 32px 0" }} />

        {/* ── ML Accuracy Trend Chart ── */}
        <div style={{ marginBottom: isMobile ? 20 : 32 }}>
          <Card style={{ padding: isMobile ? 16 : 24 }}>
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background: "rgba(20, 184, 166, 0.1)",
                  color: "#14B8A6",
                  padding: 8,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                <BrainCircuit size={20} />
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
                  Model Accuracy Trend
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: isMobile ? 12 : 13,
                    color: theme.textMuted,
                  }}
                >
                  EPDS Predictive parsing accuracy over time
                </p>
              </div>
            </div>

            {/* Area Chart */}
            <div style={{ height: areaChartHeight, width: "100%", minWidth: 0, minHeight: 150 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={data.accuracyData}
                  margin={{
                    top: 10,
                    right: isMobile ? 0 : 10,
                    left: isMobile ? -30 : -20,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="colorAccuracy"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#14B8A6"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#14B8A6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={theme.divider}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: isMobile ? 10 : 12,
                      fill: theme.textMuted,
                    }}
                    dy={10}
                    interval={isMobile ? 1 : 0}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: isMobile ? 10 : 12,
                      fill: theme.textMuted,
                    }}
                    dx={-10}
                    tickFormatter={(val) => `${val}%`}
                    width={isMobile ? 36 : 48}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      fontSize: isMobile ? 11 : 13,
                      background: theme.cardBg,
                      color: theme.textPrimary,
                    }}
                    formatter={(value) => [`${value}%`, "Accuracy"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#14B8A6"
                    strokeWidth={isMobile ? 2 : 3}
                    fillOpacity={1}
                    fill="url(#colorAccuracy)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ── Platform Usage Bar Chart ─ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: isMobile ? 20 : 32,
          }}
        >
          <Card style={{ padding: isMobile ? 16 : 24 }}>
            {/* Card Header */}
            <div
              style={{
                display: "flex",
                alignItems: isMobile ? "flex-start" : "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background: "rgba(13, 148, 136, 0.1)",
                  color: "#0D9488",
                  padding: 8,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                <BarChartIcon size={20} />
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
                  Platform Usage
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: isMobile ? 12 : 13,
                    color: theme.textMuted,
                  }}
                >
                  Total PPD assessments conducted per day
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            <div style={{ height: barChartHeight, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={data.usageStats}
                  margin={{
                    top: 10,
                    right: isMobile ? 0 : 10,
                    left: isMobile ? -30 : -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={theme.divider}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: isMobile ? 10 : 12,
                      fill: theme.textMuted,
                    }}
                    dy={10}
                    interval={isMobile ? 1 : 0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: isMobile ? 10 : 12,
                      fill: theme.textMuted,
                    }}
                    dx={-10}
                    width={isMobile ? 36 : 48}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(241, 245, 249, 0.5)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                      fontSize: isMobile ? 11 : 13,
                      background: theme.cardBg,
                      color: theme.textPrimary,
                    }}
                  />
                  <Bar
                    dataKey="assessments"
                    fill="#0D9488"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={isMobile ? 30 : 60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}