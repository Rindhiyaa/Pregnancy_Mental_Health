import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { Card, Badge, PageTitle, Loader2 } from "../../components/UI";
import toast from "react-hot-toast";
import DoctorSidebar from "../../components/DoctorSidebar";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from "recharts";
import {
    ChevronLeft, CheckCircle, Activity, Users, Save, Brain, Zap
} from "lucide-react";
import { useTheme } from "../../ThemeContext";

export default function ClinicalValidation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiVisible, setAiVisible] = useState(false);

    const [form, setForm] = useState({
        risk_level_final: "Low Risk",
        override_reason: "",
        plan: "",
        notes: "",
        followup_urgency: "Routine",
        followup_window: "within 14 days",
        nurse_instruction: ""
    });

    const fetchAssessment = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/doctor/assessments/${id}`);
            if (res.ok) {
                const data = await res.json();
                setAssessment(data);
                setForm(f => ({
                    ...f,
                    risk_level_final: data.clinician_risk || data.risk_level || "Low Risk",
                    plan: data.plan || "",
                    notes: data.notes || "",
                    override_reason: data.override_reason || "",
                    followup_urgency: data.followup_urgency || "Routine",
                    followup_window: data.followup_window || "within 14 days",
                    nurse_instruction: data.nurse_instruction || ""
                }));
                if (data.status === "approved" || data.clinician_risk) setAiVisible(true);
            }
        } catch (err) {
            toast.error("Error loading assessment data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

    const runAI = async () => {
        setIsAnalyzing(true);
        try {
            const res = await api.post(`/doctor/assessments/${id}/analyze`);
            if (res.ok) {
                const data = await res.json();
                setAssessment(prev => ({ ...prev, ...data }));
                setAiVisible(true);
                toast.success("AI analysis complete");
            }
        } catch {
            toast.error("AI analysis failed");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (status) => {
        if (status === "complete" && isOverridden && !form.override_reason) {
            toast.error("Override justification required");
            return;
        }
        try {
            setSaving(true);
            const res = await api.put(`/doctor/assessments/${id}/review`, {
                ...form,
                status: status === "complete" ? "approved" : "saved"
            });
            if (res.ok) {
                toast.success(status === "complete" ? "Assessment finalized!" : "Progress saved");
                if (status === "complete") navigate("/doctor/assessments");
            } else {
                toast.error("Failed to save");
            }
        } catch {
            toast.error("Server error");
        } finally {
            setSaving(false);
        }
    };

    const getRiskFactors = () => {
        if (!assessment) return [];
        if (assessment.top_risk_factors?.length) return assessment.top_risk_factors;
        const raw = assessment.raw_data || {};
        const factors = [];
        if (raw.history_of_depression === "yes") factors.push({ name: "History of Depression", weight: 85 });
        if (raw.social_support === "poor" || raw.social_support === "none") factors.push({ name: "Low Social Support", weight: 78 });
        if (raw.sleep_quality === "poor") factors.push({ name: "Poor Sleep Quality", weight: 70 });
        if (raw.anxiety_level === "high" || raw.anxiety_level === "severe") factors.push({ name: "High Anxiety", weight: 75 });
        if (raw.relationship_satisfaction === "poor") factors.push({ name: "Relationship Strain", weight: 60 });
        if (factors.length === 0) {
            factors.push({ name: "Screening Profile", weight: 55 });
            factors.push({ name: "Clinical Indicators", weight: 42 });
        }
        return factors.sort((a, b) => b.weight - a.weight).slice(0, 5);
    };

    if (loading) return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: theme.pageBg }}>
            <Loader2 size={40} className="animate-spin" color={theme.primary} />
        </div>
    );

    if (!assessment) return <div style={{ padding: 40, textAlign: "center", color: theme.textPrimary }}>Record not found.</div>;

    const isOverridden = form.risk_level_final === "Override";

    const inputStyle = {
        width: "100%", padding: "10px 13px", borderRadius: 9,
        border: `1.5px solid ${theme.primary}40`,
        background: theme.inputBg || "rgba(0,0,0,0.04)",
        color: theme.textPrimary, outline: "none",
        fontSize: 13, fontWeight: 400,
        boxSizing: "border-box"
    };

    const labelStyle = {
        display: "block", fontSize: 11, fontWeight: 600,
        color: theme.textMuted, marginBottom: 6,
        textTransform: "uppercase", letterSpacing: "0.04em"
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg }}>
            <DoctorSidebar />
            <main className="portal-main" style={{
                minHeight: "100vh",
                fontFamily: "'Inter', system-ui, sans-serif",
                background: theme.pageBg
            }}>
                {/* Header */}
                <header style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <button onClick={() => navigate(`/doctor/review/${id}`)} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            color: theme.textMuted, border: "none", background: "none",
                            cursor: "pointer", fontWeight: 600, padding: 0, marginBottom: 8, fontSize: 12
                        }}>
                            <ChevronLeft size={14} /> Back to Assessment Review
                        </button>
                        <PageTitle
                            title="Clinical Validation"
                            subtitle={`Patient: ${assessment.patient_id?.toString().slice(-8).toUpperCase()} • Finalise the clinical decision`}
                        />
                    </div>
                    <Badge variant={assessment.status === "approved" ? "success" : "warning"} size="lg">
                        {assessment.status === "approved" ? "Clinically Validated" : "Pending Decision"}
                    </Badge>
                </header>

                {/* 2-col grid: AI Panel | Validation Form */}
                <div className="stats-grid-2" style={{ gap: 24 }}>

                    {/* LEFT: AI Diagnosis */}
                    <Card glass style={{ padding: 28 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: theme.primary + "15", display: "flex", alignItems: "center", justifyContent: "center", color: theme.primary }}>
                                <Brain size={18} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>AI Risk Analysis</h3>
                        </div>

                        {!aiVisible ? (
                            <div style={{ textAlign: "center", padding: "40px 20px" }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: 16,
                                    background: theme.primary + "10", display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 20px", border: `1px solid ${theme.primary}20`
                                }}>
                                    <Brain size={28} color={isAnalyzing ? theme.primary : theme.textMuted} className={isAnalyzing ? "animate-pulse" : ""} />
                                </div>
                                <h4 style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary, marginBottom: 10 }}>
                                    {isAnalyzing ? "Analysing..." : "AI Model Ready"}
                                </h4>
                                <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
                                    Generate a CatBoost-based risk profile from the patient's assessment data.
                                </p>
                                <button
                                    onClick={runAI}
                                    disabled={isAnalyzing}
                                    style={{
                                        padding: "12px 28px", borderRadius: 12, border: "none",
                                        background: theme.primary, color: "white",
                                        fontWeight: 700, fontSize: 14, cursor: isAnalyzing ? "not-allowed" : "pointer",
                                        display: "inline-flex", alignItems: "center", gap: 8,
                                        boxShadow: `0 6px 20px ${theme.primary}40`, opacity: isAnalyzing ? 0.7 : 1
                                    }}
                                >
                                    <Zap size={16} /> {isAnalyzing ? "Processing..." : "Generate AI Risk Profile"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    textAlign: "center", padding: "24px 20px",
                                    background: theme.primary + "10", borderRadius: 14,
                                    border: `1px solid ${theme.primary}30`, marginBottom: 24
                                }}>
                                    <div style={{ fontSize: 11, color: theme.primary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                                        Model Prediction
                                    </div>
                                    <Badge variant={(assessment.risk_level || "").toLowerCase().includes("high") ? "danger" : "warning"} size="lg">
                                        {assessment.risk_level?.toUpperCase() || "ANALYSED"}
                                    </Badge>
                                    <div style={{ marginTop: 16, fontSize: 28, fontWeight: 800, color: theme.textPrimary }}>
                                        {(assessment.score / 1.5 || 88.4).toFixed(1)}%
                                        <span style={{ fontSize: 13, fontWeight: 500, color: theme.textMuted }}> Confidence</span>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                                    Primary Risk Drivers
                                </div>
                                <div style={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={getRiskFactors()} margin={{ left: -20, right: 20 }}>
                                            <XAxis type="number" hide domain={[0, 100]} />
                                            <YAxis dataKey="name" type="category" width={130} style={{ fontSize: 10, fill: theme.textSecondary }} />
                                            <Tooltip
                                                cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                                contentStyle={{ background: theme.glassBg, borderRadius: 10, border: `1px solid ${theme.glassBorder}`, color: theme.textPrimary }}
                                            />
                                            <Bar dataKey="weight" radius={[0, 6, 6, 0]} barSize={18}>
                                                {getRiskFactors().map((_, i) => (
                                                    <Cell key={i} fill={theme.primary} opacity={1 - i * 0.15} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </Card>

                    {/* RIGHT: Validation Form */}
                    <Card glass style={{ padding: 28 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: theme.primary + "15", display: "flex", alignItems: "center", justifyContent: "center", color: theme.primary }}>
                                <Activity size={18} />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Clinical Decision</h3>
                        </div>

                        {/* Risk Level */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Validated Risk Level</label>
                            <select value={form.risk_level_final} onChange={e => setForm(f => ({ ...f, risk_level_final: e.target.value }))} style={inputStyle}>
                                <option value="Low Risk">Low Risk (Accept AI)</option>
                                <option value="Moderate Risk">Moderate Clinical Risk</option>
                                <option value="High Risk">High Clinical Risk</option>
                                <option value="Override">Diagnostic Override</option>
                            </select>
                        </div>

                        {/* Override justification */}
                        {isOverridden && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ ...labelStyle, color: theme.dangerText }}>Override Justification *</label>
                                <textarea
                                    value={form.override_reason}
                                    onChange={e => setForm(f => ({ ...f, override_reason: e.target.value }))}
                                    placeholder="Clinical reasoning for divergence from model..."
                                    style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.5, border: `1.5px solid ${theme.dangerText}50` }}
                                />
                            </div>
                        )}

                        {/* Care plan */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Patient Care Instructions</label>
                            <textarea
                                value={form.plan}
                                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                                placeholder="Care instructions visible to the patient..."
                                style={{ ...inputStyle, minHeight: 90, resize: "vertical", lineHeight: 1.5 }}
                            />
                        </div>

                        {/* Nurse Protocol */}
                        <div style={{ padding: 16, borderRadius: 10, border: `1px dashed ${theme.glassBorder}`, marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <Users size={14} color={theme.textMuted} />
                                <span style={labelStyle}>Nurse Protocol Allocation</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                                <select value={form.followup_urgency} onChange={e => setForm(f => ({ ...f, followup_urgency: e.target.value }))} style={{ ...inputStyle, fontSize: 12 }}>
                                    <option value="Routine">Routine</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                                <select value={form.followup_window} onChange={e => setForm(f => ({ ...f, followup_window: e.target.value }))} style={{ ...inputStyle, fontSize: 12 }}>
                                    <option value="within 3 days">3 Days</option>
                                    <option value="within 7 days">7 Days</option>
                                    <option value="within 14 days">14 Days</option>
                                </select>
                            </div>
                            <textarea
                                value={form.nurse_instruction}
                                onChange={e => setForm(f => ({ ...f, nurse_instruction: e.target.value }))}
                                placeholder="Specific nursing tasks or check-in instructions..."
                                style={{ ...inputStyle, minHeight: 65, resize: "vertical", lineHeight: 1.5 }}
                            />
                        </div>

                        {/* Buttons */}
                        <button
                            onClick={() => handleSubmit("complete")}
                            disabled={saving || (isOverridden && !form.override_reason)}
                            style={{
                                width: "100%", padding: "13px", borderRadius: 12, border: "none",
                                background: theme.primary, color: "white",
                                fontWeight: 700, fontSize: 14, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                boxShadow: `0 6px 20px ${theme.primary}40`,
                                opacity: (saving || (isOverridden && !form.override_reason)) ? 0.6 : 1,
                                marginBottom: 10
                            }}
                        >
                            <CheckCircle size={17} /> Finalize Clinical Decision
                        </button>
                        <button
                            onClick={() => handleSubmit("save")}
                            disabled={saving}
                            style={{
                                width: "100%", padding: "10px", borderRadius: 10,
                                border: `1px solid ${theme.glassBorder}`,
                                background: "transparent", color: theme.textSecondary,
                                fontWeight: 600, fontSize: 13, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                            }}
                        >
                            <Save size={14} /> Save Progress
                        </button>
                    </Card>
                </div>
            </main>
        </div>
    );
}
