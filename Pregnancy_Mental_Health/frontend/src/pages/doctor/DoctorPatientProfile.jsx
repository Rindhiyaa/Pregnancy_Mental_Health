import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DoctorSidebar from "../../components/DoctorSidebar";
import { 
    PageTitle, 
    Card, 
    Badge, 
    Loader2 
} from "../../components/UI";
import { api } from "../../utils/api";
// import { dummyApi, USE_DUMMY_DATA, getAvatarColor } from "../../utils/dummyData";
import { getAvatarColor } from "../../utils/helpers";
import { useTheme } from "../../ThemeContext";
import {
    User, Mail, Phone, Calendar, Droplet, Hash, Navigation,
    ClipboardList, ChevronLeft, ChevronRight, Activity, Clock, AlertCircle,
    FileText, Zap, MessageSquare, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

export default function DoctorPatientProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            console.log("=== FETCHING PATIENT PROFILE ===");
            console.log("Patient ID:", id);
            
            // Fetch patient detail with assessments
            const { data } = await api.get(`/doctor/patients/${id}`);
            
            console.log("Patient profile data:", data);
            
            if (!data) {
                toast.error("Patient profile not found");
                setLoading(false);
                return;
            }
            
            // Extract patient info
            if (data.patient) {
                setPatient(data.patient);
                console.log("Patient info:", data.patient);
            } else if (data.name) {
                // If response is just the patient object
                setPatient(data);
                console.log("Patient info:", data);
            }
            
            // Extract assessment history
            if (data.assessments && Array.isArray(data.assessments)) {
                const sorted = data.assessments.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                setHistory(sorted);
                console.log("Assessment history:", sorted.length, "records");
            } else {
                setHistory([]);
            }
            
            console.log("✅ Patient profile loaded successfully");
            
        } catch (err) {
            console.error("❌ Failed to fetch patient data:", err);
            toast.error("Critical: Clinical record extraction failed");
            setPatient(null);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, [id]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return (
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.pageBg }}>
            <DoctorSidebar />
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 className="animate-spin" size={48} color={theme.primary} />
            </main>
        </div>
    );

    if (!patient) return null;

    const InfoRow = ({ icon, label, value }) => (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center' }}>
            <div style={{ 
                width: 40, height: 40, borderRadius: 12, 
                background: theme.primary + '15', color: theme.primary, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.textPrimary }}>{value || "Not Recorded"}</div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.pageBg }}>
            <DoctorSidebar />

            <main className="portal-main" style={{ background: theme.pageBg }}>
                <button
                    onClick={() => navigate('/doctor/patients')}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: 8, background: 'none', 
                        border: 'none', color: theme.textMuted, fontWeight: 800, 
                        cursor: 'pointer', marginBottom: 24, fontSize: "13px" 
                    }}
                >
                    <ChevronLeft size={16} /> BACK TO DIRECTORY
                </button>

                <header style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
                    marginBottom: "48px", background: theme.glassBg, padding: '32px', 
                    borderRadius: '24px', border: `1px solid ${theme.glassBorder}`,
                    backdropFilter: theme.glassBlur
                }}>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: 20,
                            background: getAvatarColor(patient.name) + '15', color: getAvatarColor(patient.name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32, fontWeight: 800, boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                        }}>
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h1 style={{ fontSize: "32px", fontWeight: 800, color: theme.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>{patient.name}</h1>
                            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                <Badge variant={patient.status === 'Critical' ? 'danger' : 'success'} size="lg">
                                    {patient.status || "Clinically Stable"}
                                </Badge>
                                <Badge variant="warning" size="lg">ID: P-{patient.id?.toString().slice(-6).toUpperCase() || 'NEW'}</Badge>
                            </div>
                        </div>
                    </div>
                   
                </header>

                <div className="stats-grid-2" style={{ gap: "32px", alignItems: "start" }}>
                    {/* Demographics Card */}
                    <Card glass style={{ padding: "32px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "32px", color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <ShieldCheck size={20} color={theme.primary} /> Clinical Profile
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <InfoRow icon={<Mail size={18} />} label="Professional Contact" value={patient.email} />
                            <InfoRow icon={<Phone size={18} />} label="Mobile Verification" value={patient.phone} />
                            <InfoRow icon={<Calendar size={18} />} label="Chronological Age" value={`${patient.age} Years`} />
                            <InfoRow icon={<Activity size={18} />} label="Gestational Timeline" value={`Week ${patient.pregnancy_week}`} />
                            <InfoRow icon={<User size={18} />} label="Attending Physician" value={patient.assigned_doctor_name || "Self-Managed"} />
                        </div>
                        <div style={{ marginTop: 24, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: `1px solid ${theme.glassBorder}` }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>Care Summary</div>
                            <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0, lineHeight: 1.6 }}>
                                Currently undergoing routine perinatal mental health monitoring. AI Risk model shows low baseline deviation.
                            </p>
                        </div>
                    </Card>

                    {/* Historical Records */}
                    <Card glass style={{ padding: "32px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 800, color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <ClipboardList size={22} color={theme.primary} /> Assessment Historical Matrix
                            </h3>
                            <Badge variant="warning" size="lg">{history.length} Diagnostic Cycles</Badge>
                        </div>

                        {history.length > 0 ? (
                            <div style={{ display: 'grid', gap: 16 }}>
                                {history.map((record) => (
                                    <div key={record.id} style={{ 
                                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 100px', 
                                        padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', 
                                        border: `1px solid ${theme.glassBorder}`, alignItems: 'center', gap: 20
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                            <div style={{ 
                                                width: 44, height: 44, background: theme.glassBg, 
                                                borderRadius: "12px", display: 'flex', alignItems: 'center', 
                                                justifyContent: 'center', border: `1px solid ${theme.glassBorder}` 
                                            }}>
                                                <Clock size={20} color={theme.textMuted} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: theme.textPrimary, fontSize: 15 }}>
                                                    {new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                <div style={{ fontSize: "12px", color: theme.textMuted, fontWeight: 600 }}>
                                                    Recorded at {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>EPDS Score</div>
                                            <div style={{ 
                                                fontWeight: 900, fontSize: "20px", 
                                                color: (record.epds_score || (record.score || 0)) > 12 ? theme.dangerText : theme.textPrimary 
                                            }}>
                                                {record.epds_score || (record.score || 0)}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Risk Level</div>
                                            <Badge variant={
                                                (record.risk_level || "").toLowerCase().includes("high") ? "danger" :
                                                (record.risk_level || "").toLowerCase().includes("moderate") ? "warning" : "success"
                                            }>
                                                {record.risk_level?.toUpperCase() || "VALIDATED"}
                                            </Badge>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/doctor/review/${record.id || record._id}`)}
                                            style={{ 
                                                background: theme.primary + '15', color: theme.primary, 
                                                border: `1px solid ${theme.primary}30`, borderRadius: '10px', 
                                                padding: '10px', fontWeight: 800, cursor: 'pointer', 
                                                fontSize: '12px', display: 'flex', alignItems: 'center', 
                                                justifyContent: 'center', gap: 4
                                            }}
                                        >
                                            RECORDS <ChevronRight size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ 
                                textAlign: "center", padding: "80px 24px", background: 'rgba(255,255,255,0.01)', 
                                borderRadius: "24px", border: `2px dashed ${theme.glassBorder}` 
                            }}>
                                <AlertCircle size={48} color={theme.textMuted} style={{ marginBottom: "20px", opacity: 0.5 }} />
                                <h4 style={{ margin: 0, fontWeight: 800, color: theme.textPrimary, fontSize: 18, marginBottom: 8 }}>Null Historical Matrix</h4>
                                <p style={{ margin: 0, color: theme.textMuted, fontSize: 14 }}>No clinical assessment records synchronized for this patient profile.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}

