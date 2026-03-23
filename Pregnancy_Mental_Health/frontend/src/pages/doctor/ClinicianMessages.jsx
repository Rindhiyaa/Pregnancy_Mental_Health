import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import DoctorSidebar from "../../components/DoctorSidebar";
import NurseSidebar from "../../components/NurseSidebar";
import AdminSidebar from "../../components/AdminSidebar";
import { Loader2, PageTitle } from "../../components/UI";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import {
    Send,
    FileText,
    History as HistoryIcon,
    Zap,
    MessageSquare,
    CheckCircle,
    Trash2
} from "lucide-react";
import { getAvatarColor } from "../../utils/dummyData";

export default function ClinicianMessages() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [messages, setMessages] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [messageSubject, setMessageSubject] = useState("");
    const [messageBody, setMessageBody] = useState("");
    const [searchParams] = useSearchParams();
    const prefilledTo = searchParams.get('to');
    const prefilledRole = searchParams.get('role');
    const logsEndRef = useRef(null);

    const SAMPLE_DRAFTS = [
        { id: 1, title: "Screening Review", subject: "Review of your EPDS Assessment", content: "Dear Patient, we have completed the professional review of your recent mental health screening. Please check your portal for the clinician's comments and updated care plan." },
        { id: 2, title: "Urgent Follow-up", subject: "Immediate Consultation Required", content: "Based on our latest clinical indicators, we would like to schedule an urgent follow-up consultation with you. Please contact our office or confirm your availability via the portal." },
        { id: 3, title: "Care Plan Update", subject: "Your Mental Health Care Plan", content: "Your clinical care plan has been updated to include additional support resources. Specifically, we recommend engaging with the new mindfulness protocols listed in your profile." },
        { id: 4, title: "Routine Check-in", subject: "Weekly Progress Check", content: "Checking in to see how you are doing this week. Consistent monitoring is key to your wellbeing. Please feel free to reach out with any concerns." }
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const patUrl = user?.role === 'nurse' ? "/nurse/patients" : "/doctor/patients";
            const [msgRes, patRes] = await Promise.all([
                api.get("/patient/messages"),
                api.get(patUrl)
            ]);

            if (msgRes.ok) setMessages(await msgRes.json());
            if (patRes.ok) setPatients(await patRes.json());
        } catch (err) {
            console.error("Failed to fetch messaging data:", err);
            toast.error("Could not load clinician messages");
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    useEffect(() => {
        if (user?.role) fetchData();
    }, [fetchData, user?.role]);

    useEffect(() => {
        if (prefilledTo) {
            setSelectedPatientId(prefilledTo);
            if (prefilledRole === 'doctor') setMessageSubject("Clinician Consultation Request");
        }
    }, [prefilledTo, prefilledRole]);

    // Auto-scroll chat history to the bottom when messages load
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedPatientId || !messageBody) {
            toast.error("Validation failed: Recipient and content required");
            return;
        }

        try {
            const res = await api.post("/patient/messages", {
                patient_id: selectedPatientId,
                subject: messageSubject || "Medical Note from Care Team",
                content: messageBody,
                type: "general"
            });

            if (res.ok) {
                toast.success("Message delivered successfully");
                setMessageBody("");
                setMessageSubject("");
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to transmit message");
        }
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            const res = await api.delete(`/patient/messages/${msgId}`);
            if (res.ok) {
                toast.success("Message deleted");
                fetchData();
            } else {
                toast.error("Failed to delete message");
            }
        } catch (err) {
            toast.error("Error deleting message");
        }
    };

    const Sidebar = user?.role === 'nurse' ? NurseSidebar : (user?.role === 'admin' ? AdminSidebar : DoctorSidebar);

    if (loading) return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: "'Poppins', sans-serif" }}>
            <Sidebar />
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={48} className="animate-spin" color={theme.primary} />
            </main>
        </div>
    );

    const baseCardStyle = {
        background: theme.glassBg,
        border: `1px solid ${theme.glassBorder}`,
        borderRadius: '24px',
        padding: '32px',
        boxShadow: theme.shadowPremium,
        backdropFilter: theme.glassBlur,
        display: 'flex',
        flexDirection: 'column',
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: "'Poppins', sans-serif" }}>
            <Sidebar />
            <main className="portal-main" style={{ background: theme.pageBg, maxWidth: 1600 }}>
                <header style={{ marginBottom: "32px" }}>
                    <PageTitle title="Secure Messaging Center" subtitle="Maintain HIPAA-compliant communications with your patients and care team." />
                </header>
                <div className="messages-grid" style={{ height: "calc(100vh - 160px)" }}>
                    
                    {/* Column 1: Clinical Templates */}
                    <div style={{ ...baseCardStyle, overflowY: 'auto' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.textPrimary, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FileText size={20} color={theme.primary} /> Templates
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {SAMPLE_DRAFTS.map(draft => (
                                <button
                                    key={draft.id}
                                    onClick={() => {
                                        setMessageSubject(draft.subject);
                                        setMessageBody(draft.content);
                                        toast.success("Template applied");
                                    }}
                                    style={{
                                        textAlign: 'left', padding: '16px', borderRadius: '16px', border: `1px solid ${theme.glassBorder}`,
                                        background: 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s ease', 
                                        color: theme.textPrimary, fontFamily: "'Poppins', sans-serif"
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = theme.primary + '11';
                                        e.currentTarget.style.borderColor = theme.primary + '40';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        e.currentTarget.style.borderColor = theme.glassBorder;
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{draft.title}</div>
                                    <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.5 }}>{draft.subject}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Compose Message Form */}
                    <div style={{ ...baseCardStyle }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.textPrimary, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Zap size={20} color={theme.warningText} /> Compose Note
                        </h3>
                        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 24 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: theme.textSecondary }}>Recipient</label>
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    style={{ 
                                        width: '100%', padding: '16px', borderRadius: '16px', border: `1px solid ${theme.glassBorder}`, 
                                        background: 'rgba(255,255,255,0.05)', color: theme.textPrimary, outline: 'none', 
                                        fontFamily: "'Poppins', sans-serif", fontSize: 14, appearance: 'none'
                                    }}
                                    onFocus={e => e.target.style.borderColor = theme.primary}
                                    onBlur={e => e.target.style.borderColor = theme.glassBorder}
                                >
                                    <option value="" disabled>Select clinical recipient...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: theme.textSecondary }}>Subject</label>
                                <input
                                    type="text"
                                    value={messageSubject}
                                    onChange={(e) => setMessageSubject(e.target.value)}
                                    placeholder="Enter subject..."
                                    style={{ 
                                        width: '100%', padding: '16px', borderRadius: '16px', border: `1px solid ${theme.glassBorder}`, 
                                        background: 'rgba(255,255,255,0.05)', color: theme.textPrimary, outline: 'none', 
                                        fontFamily: "'Poppins', sans-serif", fontSize: 14 
                                    }}
                                    onFocus={e => e.target.style.borderColor = theme.primary}
                                    onBlur={e => e.target.style.borderColor = theme.glassBorder}
                                />
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: theme.textSecondary }}>Message Body</label>
                                <textarea
                                    value={messageBody}
                                    onChange={(e) => setMessageBody(e.target.value)}
                                    placeholder="Type your clinical notes here..."
                                    style={{ 
                                        width: '100%', flex: 1, padding: '16px', borderRadius: '16px', border: `1px solid ${theme.glassBorder}`, 
                                        background: 'rgba(255,255,255,0.05)', color: theme.textPrimary, outline: 'none', 
                                        resize: 'none', fontFamily: "'Poppins', sans-serif", fontSize: 14, lineHeight: 1.6 
                                    }}
                                    onFocus={e => e.target.style.borderColor = theme.primary}
                                    onBlur={e => e.target.style.borderColor = theme.glassBorder}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!selectedPatientId || !messageBody}
                                style={{
                                    width: '100%', background: theme.primary, color: 'white', border: 'none',
                                    padding: '16px', borderRadius: '16px', fontWeight: 600, cursor: (!selectedPatientId || !messageBody) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    boxShadow: `0 8px 24px ${theme.primary}40`, fontSize: 15, fontFamily: "'Poppins', sans-serif",
                                    transition: 'all 0.2s', opacity: (!selectedPatientId || !messageBody) ? 0.6 : 1
                                }}
                                onMouseEnter={e => { if(selectedPatientId && messageBody) e.currentTarget.style.transform = 'translateY(-2px)' }}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Send size={18} /> Transmit Message
                            </button>
                        </form>
                    </div>

                    {/* Column 3: Interaction Logs (Styled like a modern chat window) */}
                    <div style={{ ...baseCardStyle, padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${theme.glassBorder}`, background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600, color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <HistoryIcon size={20} color={theme.textMuted} /> Recent History
                            </h3>
                        </div>

                        <div 
                            style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }} 
                            className="hide-scrollbar"
                        >
                            {messages.length === 0 ? (
                                <div style={{ margin: 'auto', textAlign: 'center', color: theme.textMuted }}>
                                    <MessageSquare size={48} strokeWidth={1} style={{ marginBottom: 16, opacity: 0.3, margin: '0 auto' }} />
                                    <div style={{ fontWeight: 500, fontSize: 16, color: theme.textPrimary, marginBottom: 8 }}>No Conversations Yet</div>
                                    <div style={{ fontSize: 13 }}>Messages sent to patients will appear here.</div>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const patient = patients.find(p => p.id === msg.patient_id || p.id?.toString() === msg.patient_id?.toString());
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, paddingLeft: 4 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: getAvatarColor(patient?.name) + '15', color: getAvatarColor(patient?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                                    {patient?.name?.charAt(0) || '?'}
                                                </div>
                                                <div style={{ fontSize: 13, fontWeight: 500, color: theme.textPrimary }}>{patient?.name || 'Unknown Patient'}</div>
                                                <div style={{ fontSize: 11, color: theme.textMuted }}>{new Date(msg.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                                                <div style={{ flex: 1 }} />
                                                <button 
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.danger || '#ef4444', opacity: 0.6, transition: 'opacity 0.2s', padding: 4 }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                                                    title="Delete Message"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div style={{ 
                                                maxWidth: '85%', background: theme.primary + '10', 
                                                border: `1px solid ${theme.primary}30`,
                                                padding: '16px 20px', borderRadius: '4px 20px 20px 20px', 
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                                            }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: theme.primary, marginBottom: 6 }}>{msg.subject}</div>
                                                <div style={{ fontSize: 14, color: theme.textPrimary, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                                
                                                {msg.is_read && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 12, fontSize: 11, color: theme.success }}>
                                                        <CheckCircle size={12} /> Read entirely
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
