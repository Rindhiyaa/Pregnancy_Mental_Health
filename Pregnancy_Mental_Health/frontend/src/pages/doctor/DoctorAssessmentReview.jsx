import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { Card, Badge, PageTitle, Loader2 } from "../../components/UI";
import toast from "react-hot-toast";
import DoctorSidebar from "../../components/DoctorSidebar";
import { ASSESSMENT_SECTIONS } from "../../constants/assessmentData";
import { ChevronLeft, ClipboardList, MessageSquare, CheckCircle } from "lucide-react";
import { useTheme } from "../../ThemeContext";

export default function DoctorAssessmentReview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSection, setCurrentSection] = useState(0);

    const fetchAssessment = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/doctor/assessments/${id}`);
            if (res.ok) {
                setAssessment(await res.json());
            }
        } catch (err) {
            console.error("Failed to fetch assessment:", err);
            toast.error("Error loading clinical data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

    if (loading) return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: theme.pageBg }}>
            <Loader2 size={40} className="animate-spin" color={theme.primary} />
        </div>
    );

    if (!assessment) return (
        <div style={{ padding: 40, textAlign: "center", color: theme.textPrimary }}>
            Clinical record not found.
        </div>
    );

    const sections = ASSESSMENT_SECTIONS.filter(s => s.id < 6);
    const section = sections[currentSection];
    const isFirst = currentSection === 0;
    const isLast = currentSection === sections.length - 1;

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg }}>
            <DoctorSidebar />
            <main className="portal-main" style={{
                height: "100vh",
                overflow: "hidden", display: "flex", flexDirection: "column",
                fontFamily: "'Inter', system-ui, sans-serif",
                background: theme.pageBg
            }}>
                {/* Header */}
                <header style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <button onClick={() => navigate(-1)} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            color: theme.textMuted, border: "none", background: "none",
                            cursor: "pointer", fontWeight: 600, padding: 0, marginBottom: 8, fontSize: 12
                        }}>
                            <ChevronLeft size={14} /> Back to Submissions
                        </button>
                        <PageTitle
                            title="Assessment Review"
                            subtitle={`Patient: ${assessment.patient_id?.toString().slice(-8).toUpperCase()} • Nurse: ${assessment.nurse_name || "Assigned Nurse"}`}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button style={{
                            padding: "9px 16px", borderRadius: 10,
                            border: `1px solid ${theme.glassBorder}`,
                            background: theme.glassBg, color: theme.textPrimary,
                            fontWeight: 600, fontSize: 12, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6
                        }}>
                            <MessageSquare size={15} /> Consult Nurse
                        </button>
                        <Badge variant={assessment.status === "approved" ? "success" : "warning"} size="lg">
                            {assessment.status === "approved" ? "Validated" : "Pending Review"}
                        </Badge>
                    </div>
                </header>

                {/* Section Pager Card */}
                <Card glass style={{ flex: 1, padding: 28, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Section header + progress dots */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                                    Section {currentSection + 1} of {sections.length}
                                </div>
                                <h2 style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                                    {section.title}
                                </h2>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                {sections.map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setCurrentSection(i)}
                                        style={{
                                            width: i === currentSection ? 22 : 7, height: 7,
                                            borderRadius: 4, cursor: "pointer", transition: "all 0.2s",
                                            background: i === currentSection ? theme.primary : theme.glassBorder
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 3, borderRadius: 4, background: theme.glassBorder, overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: 4, background: theme.primary,
                                width: `${((currentSection + 1) / sections.length) * 100}%`,
                                transition: "width 0.3s"
                            }} />
                        </div>
                    </div>

                    {/* Questions grid — scrollable inner area */}
                    <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }} className="hide-scrollbar">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                            {section.questions.map((q, qIdx) => {
                                const raw = assessment.raw_data?.[q.name] || "Declined to answer";
                                let display = raw;
                                if (q.options && typeof q.options[0] === "object") {
                                    const opt = q.options.find(o => o.value === raw);
                                    if (opt) display = opt.label;
                                }
                                const fullWidth = q.type === "textarea" || section.questions.length === 1;
                                return (
                                    <div key={q.name} style={{
                                        gridColumn: fullWidth ? "1 / -1" : "auto",
                                        padding: "14px 18px",
                                        borderBottom: `1px solid ${theme.glassBorder}`,
                                        borderRight: !fullWidth && qIdx % 2 === 0 ? `1px solid ${theme.glassBorder}` : "none"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                            <span style={{
                                                flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                                                background: theme.primary + "18", color: theme.primary,
                                                fontSize: 9, fontWeight: 700, display: "flex",
                                                alignItems: "center", justifyContent: "center"
                                            }}>
                                                {String(qIdx + 1).padStart(2, "0")}
                                            </span>
                                            <span style={{ fontSize: 11, fontWeight: 500, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                {q.label}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 400, color: theme.textPrimary, lineHeight: 1.55, paddingLeft: 28 }}>
                                            {display}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer: Prev / count / Next or Proceed */}
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.glassBorder}`
                    }}>
                        <button
                            onClick={() => setCurrentSection(s => Math.max(0, s - 1))}
                            disabled={isFirst}
                            style={{
                                padding: "9px 20px", borderRadius: 10,
                                border: `1px solid ${theme.glassBorder}`,
                                background: "transparent",
                                color: isFirst ? theme.textMuted : theme.textPrimary,
                                fontWeight: 600, fontSize: 13,
                                cursor: isFirst ? "not-allowed" : "pointer",
                                opacity: isFirst ? 0.4 : 1,
                                display: "flex", alignItems: "center", gap: 6
                            }}
                        >
                            <ChevronLeft size={15} /> Previous
                        </button>

                        <span style={{ fontSize: 12, color: theme.textMuted }}>
                            {section.questions.length} question{section.questions.length !== 1 ? "s" : ""}
                        </span>

                        {isLast ? (
                            <button
                                onClick={() => navigate(`/doctor/validate/${id}`)}
                                style={{
                                    padding: "9px 20px", borderRadius: 10, border: "none",
                                    background: theme.primary, color: "white",
                                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 6,
                                    boxShadow: `0 4px 14px ${theme.primary}40`
                                }}
                            >
                                <CheckCircle size={15} /> Proceed to Validation
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentSection(s => Math.min(sections.length - 1, s + 1))}
                                style={{
                                    padding: "9px 20px", borderRadius: 10, border: "none",
                                    background: theme.primary, color: "white",
                                    fontWeight: 600, fontSize: 13, cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: 6
                                }}
                            >
                                Next <ChevronLeft size={15} style={{ transform: "rotate(180deg)" }} />
                            </button>
                        )}
                    </div>
                </Card>
            </main>
        </div>
    );
}
