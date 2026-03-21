import React, { useState, useEffect } from 'react';
import { useTheme } from "../../ThemeContext";
import AdminSidebar from "../../components/AdminSidebar";
import { PageTitle, Divider, Card } from "../../components/UI";
import { getAdminAnalytics } from "../../utils/dummyData";
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from "recharts";
import { BrainCircuit, Activity, BarChart as BarChartIcon } from "lucide-react";

export default function AnalyticsPage() {
    const { theme } = useTheme();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const analytics = await getAdminAnalytics();
            setData(analytics);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading || !data) {
        return (
            <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
                <AdminSidebar />
                <main style={{ flex: 1, marginLeft: 260, padding: "40px 48px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ color: theme.textMuted, fontWeight: 600 }}>Loading analytics data...</div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
            <AdminSidebar />
            <main style={{ flex: 1, marginLeft: 260, padding: "40px 48px", boxSizing: "border-box" }}>

                <PageTitle title="System Analytics" subtitle="Machine learning performance, platform usage, and clinical insights" />
                <Divider style={{ margin: "24px 0 32px 0" }} />

                {/* TOP ROW CHARTS */}
                <div style={{ marginBottom: 32 }}>

                    {/* ML Accuracy Trend */}
                    <Card>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                            <div style={{ background: "rgba(20, 184, 166, 0.1)", color: "#14B8A6", padding: 8, borderRadius: 8 }}>
                                <BrainCircuit size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.textPrimary }}>Model Accuracy Trend</h3>
                                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: theme.textMuted }}>EPDS Predictive parsing accuracy over time</p>
                            </div>
                        </div>

                        <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.accuracyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.divider} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.textMuted }} dy={10} />
                                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.textMuted }} dx={-10} tickFormatter={(val) => `${val}%`} />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: 13 }}
                                        formatter={(value) => [`${value}%`, 'Accuracy']}
                                    />
                                    <Area type="monotone" dataKey="accuracy" stroke="#14B8A6" strokeWidth={3} fillOpacity={1} fill="url(#colorAccuracy)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* BOTTOM ROW CHARTS */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }}>

                    {/* Usage Stats - Assessments per day */}
                    <Card>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                            <div style={{ background: "rgba(13, 148, 136, 0.1)", color: "#0D9488", padding: 8, borderRadius: 8 }}>
                                <BarChartIcon size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: theme.textPrimary }}>Platform Usage</h3>
                                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: theme.textMuted }}>Total PPD assessments conducted per day</p>
                            </div>
                        </div>

                        <div style={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.usageStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.divider} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.textMuted }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.textMuted }} dx={-10} />
                                    <RechartsTooltip
                                        cursor={{ fill: "rgba(241, 245, 249, 0.5)" }}
                                        contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", fontSize: 13 }}
                                    />
                                    <Bar dataKey="assessments" fill="#0D9488" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                </div>

            </main>
        </div>
    );
}
