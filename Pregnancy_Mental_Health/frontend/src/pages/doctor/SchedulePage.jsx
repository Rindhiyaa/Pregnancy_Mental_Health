import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import DoctorSidebar from "../../components/DoctorSidebar";
import { api } from "../../utils/api";
import toast from "react-hot-toast";
import {
    Card,
    Badge,
    PageTitle,
    Loader2
} from "../../components/UI";
import {
    Calendar as CalendarIcon,
    Clock,
    Plus,
    ChevronLeft,
    ChevronRight,
    User,
    CheckCircle,
    XCircle,
    Mail,
    AlertCircle
} from 'lucide-react';
import { getAvatarColor } from "../../utils/dummyData";

const SchedulePage = () => {
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [followUps, setFollowUps] = useState([]);
    const [patients, setPatients] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [newFup, setNewFup] = useState({
        patient_id: '',
        date: '',
        time: '09:00',
        type: 'check-in',
        notes: ''
    });
    const [selectedDay, setSelectedDay] = useState(new Date());

    // Predefined available time slots (clinic hours)
    const TIME_SLOTS = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
        '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [fupRes, patientRes] = await Promise.all([
                api.get("/follow-ups"),
                api.get("/doctor/patients")
            ]);

            if (fupRes.ok) setFollowUps(await fupRes.json());
            if (patientRes.ok) setPatients(await patientRes.json());
        } catch (error) {
            console.error("Failed to load schedule:", error);
            toast.error("Could not load clinical schedule");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateStatus = async (id, status) => {
        try {
            const res = await api.post(`/follow-ups/${id}/status?status=${status}`);
            if (res.ok) {
                toast.success(`Patient appointment marked as ${status}`);
                setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status } : f));
            }
        } catch (error) {
            toast.error("Failed to update appointment status");
        }
    };

    const handleAddFollowUp = async (e) => {
        e.preventDefault();
        if (!newFup.patient_id || !newFup.date) {
            toast.error("Clinical validation failed: Missing required fields");
            return;
        }

        try {
            const scheduled_date = `${newFup.date}T${newFup.time}:00`;
            const res = await api.post("/follow-ups", {
                patient_id: parseInt(newFup.patient_id),
                scheduled_date,
                type: newFup.type,
                notes: newFup.notes
            });

            if (res.ok) {
                toast.success("Care follow-up scheduled");
                toast.success("Automated notification sent to patient", { icon: '📧' });
                setShowAddModal(false);
                loadData();
                setNewFup({ patient_id: '', date: '', time: '09:00', type: 'check-in', notes: '' });
            }
        } catch (error) {
            toast.error("Failed to schedule clinical follow-up");
        }
    };

    const calendarDays = (() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    })();

    const getEventsForDay = (date) => {
        if (!date) return [];
        return followUps.filter(f => {
            const fDate = new Date(f.scheduled_date);
            return fDate.getDate() === date.getDate() &&
                fDate.getMonth() === date.getMonth() &&
                fDate.getFullYear() === date.getFullYear() &&
                f.status === 'pending';
        });
    };

    const getBookedSlotsForDay = (date) => {
        if (!date) return [];
        return followUps
            .filter(f => {
                const fDate = new Date(f.scheduled_date);
                return fDate.getDate() === date.getDate() &&
                    fDate.getMonth() === date.getMonth() &&
                    fDate.getFullYear() === date.getFullYear();
            })
            .map(f => new Date(f.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };

    const upcomingAppointments = followUps
        .filter(f => f.status === 'pending')
        .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
        .slice(0, 15);

    if (loading) return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: theme.pageBg }}>
            <Loader2 size={48} className="animate-spin" color={theme.primary} />
        </div>
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg }}>
            <DoctorSidebar />
            <main className="portal-main" style={{ background: theme.pageBg }}>
                <header className="page-header">
                    <PageTitle title="Clinical Schedule" subtitle="Maintain patient follow-ups and monitor today's medical appointments." />
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            background: theme.primary, color: 'white', border: 'none',
                            padding: '12px 24px', borderRadius: '14px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                            boxShadow: `0 8px 24px ${theme.primary}40`
                        }}
                    >
                        <Plus size={20} /> New Appointment
                    </button>
                </header>
                <div className="schedule-grid">

                    {/* ── LEFT: Mini Calendar + Day Overview ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Mini Calendar */}
                    <Card glass style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: theme.textPrimary }}>
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                    style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}
                                ><ChevronLeft size={16} /></button>
                                <button
                                    onClick={() => { const t = new Date(); setCurrentDate(t); setSelectedDay(t); }}
                                    style={{ background: theme.primary + '15', border: 'none', color: theme.primary, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}
                                >Today</button>
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                    style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}
                                ><ChevronRight size={16} /></button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                            {['S','M','T','W','T','F','S'].map((d, i) => (
                                <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: theme.textMuted, padding: '4px 0' }}>{d}</div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                            {calendarDays.map((date, idx) => {
                                const isToday = date && date.toDateString() === new Date().toDateString();
                                const isSelected = date && selectedDay && date.toDateString() === selectedDay.toDateString();
                                const events = getEventsForDay(date);
                                const hasDot = events.length > 0;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => date && setSelectedDay(new Date(date))}
                                        style={{
                                            height: 36, borderRadius: 8, display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            cursor: date ? 'pointer' : 'default',
                                            background: isSelected ? theme.primary : isToday ? theme.primary + '15' : 'transparent',
                                            color: isSelected ? 'white' : isToday ? theme.primary : theme.textSecondary,
                                            fontWeight: isToday || isSelected ? 800 : 500,
                                            fontSize: 12,
                                            position: 'relative',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {date?.getDate()}
                                        {hasDot && !isSelected && (
                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: theme.primary, position: 'absolute', bottom: 3 }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Dot legend */}
                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${theme.glassBorder}`, display: 'flex', gap: 12, fontSize: 11, color: theme.textMuted }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.primary }} /> Has appointments
                            </span>
                        </div>
                    </Card>

                    {/* Day Overview Panel */}
                    <Card glass style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: theme.textPrimary }}>
                                    {selectedDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Appointments scheduled for this day</div>
                            </div>
                        </div>

                        {(() => {
                            const dayAppts = followUps.filter(f => {
                                const fd = new Date(f.scheduled_date);
                                return fd.toDateString() === selectedDay.toDateString();
                            }).sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

                            return dayAppts.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {dayAppts.map(appt => (
                                        <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.glassBorder}` }}>
                                            <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: theme.primary }}>{new Date(appt.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <div style={{ width: 1, background: theme.glassBorder, alignSelf: 'stretch' }} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{appt.patient?.name || 'Patient'}</div>
                                                <Badge variant={appt.type === 'urgent' ? 'danger' : appt.type === 'check-in' ? 'success' : 'warning'} size="sm">{appt.type}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '24px 12px', color: theme.textMuted }}>
                                    <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>No appointments this day</div>
                                    <div style={{ fontSize: 11, marginTop: 4 }}>Use "New Appointment" to schedule</div>
                                </div>
                            );
                        })()}
                    </Card>
                    </div>

                    {/* ── APPOINTMENTS LIST ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <Card glass style={{ padding: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <CalendarIcon size={16} color={theme.primary} /> Upcoming
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 520, overflowY: 'auto' }} className="hide-scrollbar">
                                {upcomingAppointments.length > 0 ? upcomingAppointments.map(appt => (
                                    <div key={appt.id} style={{
                                        padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.glassBorder}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 30, height: 30, borderRadius: 8, background: getAvatarColor(appt.patient?.name) + '15', color: getAvatarColor(appt.patient?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                                                    {appt.patient?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary }}>{appt.patient?.name}</div>
                                                    <div style={{ fontSize: 11, color: theme.textMuted }}>
                                                        {new Date(appt.scheduled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {new Date(appt.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant={appt.type === 'urgent' ? 'danger' : appt.type === 'check-in' ? 'success' : 'warning'} size="sm">
                                                {appt.type}
                                            </Badge>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={() => updateStatus(appt.id, 'completed')}
                                                style={{ flex: 1, padding: '7px', borderRadius: 8, background: theme.successText + '15', color: theme.successText, border: `1px solid ${theme.successText}30`, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                                            >
                                                <CheckCircle size={12} /> Done
                                            </button>
                                            <button
                                                onClick={() => updateStatus(appt.id, 'missed')}
                                                style={{ padding: '7px 10px', borderRadius: 8, background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.glassBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '32px 16px', color: theme.textMuted }}>
                                        <div style={{ fontSize: 28, marginBottom: 8 }}>🏖️</div>
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>Schedule Clear</div>
                                        <div style={{ fontSize: 11, marginTop: 4 }}>No upcoming appointments</div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Modal for Scheduling */}
                {showAddModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }} onClick={() => setShowAddModal(false)}>
                        <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: 20, padding: 40, maxWidth: 520, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                            
                            {/* Modal Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: theme.primary + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CalendarIcon size={20} color={theme.primary} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>New Appointment</h3>
                                        <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>Schedule a patient care follow-up</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddModal(false)} style={{ background: '#F3F4F6', border: 'none', color: '#6B7280', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>✕</button>
                            </div>

                            <form onSubmit={handleAddFollowUp}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

                                    {/* Patient Select */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Patient *
                                        </label>
                                        <select
                                            value={newFup.patient_id}
                                            onChange={e => setNewFup({ ...newFup, patient_id: e.target.value })}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F9FAFB', border: '1.5px solid #D1D5DB', color: '#111827', outline: 'none', fontSize: 14, fontWeight: 500 }}
                                            required
                                        >
                                            <option value="">Select a patient...</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Date + Time side-by-side */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Date *
                                            </label>
                                            <input
                                                type="date"
                                                value={newFup.date}
                                                onChange={e => setNewFup({ ...newFup, date: e.target.value })}
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F9FAFB', border: '1.5px solid #D1D5DB', color: '#111827', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Time *
                                            </label>
                                            <input
                                                type="time"
                                                value={newFup.time}
                                                onChange={e => setNewFup({ ...newFup, time: e.target.value })}
                                                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F9FAFB', border: '1.5px solid #D1D5DB', color: '#111827', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Appointment Type
                                        </label>
                                        <select
                                            value={newFup.type}
                                            onChange={e => setNewFup({ ...newFup, type: e.target.value })}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F9FAFB', border: '1.5px solid #D1D5DB', color: '#111827', outline: 'none', fontSize: 14, fontWeight: 500 }}
                                        >
                                            <option value="check-in">Check-in</option>
                                            <option value="assessment">Mental Health Review</option>
                                            <option value="urgent">Urgent Intervention</option>
                                        </select>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Clinical Notes
                                        </label>
                                        <textarea
                                            value={newFup.notes}
                                            onChange={e => setNewFup({ ...newFup, notes: e.target.value })}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F9FAFB', border: '1.5px solid #D1D5DB', color: '#111827', minHeight: 90, outline: 'none', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                                            placeholder="Add specific clinical instructions or context..."
                                        />
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                                        <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '13px', borderRadius: 12, background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                                            Cancel
                                        </button>
                                        <button type="submit" style={{ padding: '13px', borderRadius: 12, background: theme.primary, color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14, boxShadow: `0 8px 24px ${theme.primary}40` }}>
                                            Finalize & Send Notification
                                        </button>
                                    </div>

                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default SchedulePage;
