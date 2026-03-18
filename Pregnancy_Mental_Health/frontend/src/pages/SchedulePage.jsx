import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import toast from "react-hot-toast";
import "../styles/SchedulePage.css";
import logo from "../../public/logo.png"


const SchedulePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [followUps, setFollowUps] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // New Follow-up Form State
  const [newFup, setNewFup] = useState({
    patient_id: '',
    date: '',
    time: '09:00',
    type: 'check-in',
    notes: ''
  });

  // Load all follow-ups
  const loadFollowUps = async () => {
    try {
      setLoading(true);
      const [fupRes, patientRes] = await Promise.all([
        api.get("/follow-ups"),
        api.get("/patients")
      ]);
      
      if (fupRes.ok) {
        const data = await fupRes.json();
        setFollowUps(data);
      }
      if (patientRes.ok) {
        const pData = await patientRes.json();
        setPatients(pData);
      }
    } catch (error) {
      console.error("Failed to load schedule:", error);
      toast.error("Could not load schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/logout-status');
    } catch (e) {}
    logout();
    navigate("/");
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.post(`/follow-ups/${id}/status?status=${status}`);
      if (res.ok) {
        toast.success(`Follow-up marked as ${status}`);
        setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status } : f));
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!newFup.patient_id || !newFup.date) {
      toast.error("Please fill required fields");
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
        toast.success("Follow-up scheduled successfully");
        toast.success("Confirmation email sent to patient", { icon: '📧' });
        setShowAddModal(false);
        loadFollowUps();
        setNewFup({ patient_id: '', date: '', time: '09:00', type: 'check-in', notes: '' });
      }
    } catch (error) {
      toast.error("Failed to schedule follow-up");
    }
  };

  // Helper to get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

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

  const upcomingFollowUps = followUps
    .filter(f => f.status === 'pending')
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 10); // Show more appointments

  const getClinicianFreeTime = () => {
    // Simple mock logic: Clinician is free outside of scheduled appointments between 9-5
    const slots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];
    const today = new Date().toISOString().split('T')[0];
    const takenSlots = followUps
      .filter(f => f.scheduled_date.startsWith(today))
      .map(f => new Date(f.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    
    return slots.filter(s => !takenSlots.includes(s));
  };

  return (
    <div className="schedule-root">
      {/* ── NAVBAR ── */}
      <header className="dp-navbar">
        <div className="dp-nav-left">
                       <img src={logo} alt="Postpartum Risk Insight" className="dp-logo-mark"/>

          <div className="dp-logo-text">
            <span>Postpartum Risk Insight</span>
            <span>Clinician dashboard</span>
          </div>
        </div>

        <nav className="dp-nav-center">
          <NavLink to="/dashboard" className={({ isActive }) => "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")}>Dashboard</NavLink>
          <NavLink to="/new-assessment" className={({ isActive }) => "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")}>New Assessment</NavLink>
          <NavLink to="/history" className={({ isActive }) => "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")}>History</NavLink>
          <NavLink to="/schedule" className={({ isActive }) => "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")}>Schedule</NavLink>
          <NavLink to="/patients" className={({ isActive }) => "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")}>Patients</NavLink>
        </nav>

        <div className="dp-nav-right">
          <div className="dp-profile-wrapper">
            <div className="dp-profile-chip" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className="dp-profile-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="dp-profile-name">{user?.fullName || 'Clinician'}</span>
            </div>
            {showProfileMenu && (
              <div className="dp-profile-dropdown">
                <div className="dp-dropdown-item" onClick={() => navigate('/profile')}>Profile</div>
                <div className="dp-dropdown-item dp-dropdown-logout" onClick={handleLogout}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="schedule-main">
        <div className="schedule-header">
          <div>
            <h1 className="schedule-title">Care Schedule</h1>
            <p className="schedule-subtitle">Monitor and manage patient follow-up appointments</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="dp-export-btn" onClick={() => setShowAddModal(true)}>
              + Schedule Follow-up
            </button>
            <button className="pp-btn-secondary" onClick={() => navigate('/new-assessment')}>
              New Assessment
            </button>
          </div>
        </div>

        <div className="schedule-grid">
          {/* Calendar View */}
          <div className="calendar-card">
            <div className="custom-calendar-header">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e293b' }}>
                {monthName} {year}
              </h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className="pp-btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                >
                  Prev
                </button>
                <button 
                  className="pp-btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </button>
                <button 
                  className="pp-btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-head">{day}</div>
              ))}
              {calendarDays.map((date, idx) => {
                const isToday = date && date.toDateString() === new Date().toDateString();
                const events = getEventsForDay(date);
                
                return (
                  <div key={idx} className={`calendar-day ${isToday ? 'day-today' : ''}`} style={{ minHeight: '80px' }}>
                    {date && (
                      <>
                        <span className="day-number">{date.getDate()}</span>
                        <div className="day-events">
                          {events.map(e => (
                            <div key={e.id} className={`event-dot ${(e.patient?.risk_level || '').toLowerCase().includes('high') ? 'event-high' : 'event-moderate'}`} title={e.patient?.name}>
                              {e.patient?.name || 'Patient'}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Sidebar */}
          <div className="upcoming-card">
            <div className="availability-section" style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#1e293b', marginBottom: '10px' }}>👨‍⚕️ Your Free Slots Today</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {getClinicianFreeTime().map(slot => (
                  <span key={slot} style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontWeight: '600' }}>
                    {slot}
                  </span>
                ))}
              </div>
            </div>

            <h3 className="card-title" style={{ fontSize: '1rem' }}>
              <span>📋</span> Upcoming Care
            </h3>
            
            <div className="appointment-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loading ? (
                <p style={{ textAlign: 'center', color: '#64748b' }}>Loading...</p>
              ) : upcomingFollowUps.length > 0 ? (
                upcomingFollowUps.map(fup => (
                  <div key={fup.id} className="appointment-item" style={{ padding: '8px' }}>
                    <div className="appt-header">
                      <span className="appt-patient" style={{ fontSize: '0.85rem' }}>{fup.patient?.name || 'Patient'}</span>
                      <span className="appt-time" style={{ fontSize: '0.7rem' }}>
                        {new Date(fup.scheduled_date).toLocaleDateString()} {new Date(fup.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="appt-type" style={{ fontSize: '0.75rem' }}>{fup.type.toUpperCase()} CHECK-IN</span>
                    <div className="appt-actions">
                      <button className="appt-btn btn-complete" onClick={() => updateStatus(fup.id, 'completed')}>Done</button>
                      <button className="appt-btn btn-missed" onClick={() => updateStatus(fup.id, 'missed')}>Skip</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🏖️</span>
                  <p>No appointments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Manual Scheduling Modal */}
      {showAddModal && (
        <div className="pp-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="pp-history-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="pp-modal-header">
              <h3>Schedule Manual Follow-up</h3>
              <button className="pp-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddFollowUp} className="pp-history-body" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#64748b' }}>Select Patient</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    value={newFup.patient_id}
                    onChange={e => setNewFup({...newFup, patient_id: e.target.value})}
                    required
                  >
                    <option value="">Choose Patient...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#64748b' }}>Date</label>
                    <input 
                      type="date" 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      value={newFup.date}
                      onChange={e => setNewFup({...newFup, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#64748b' }}>Time</label>
                    <input 
                      type="time" 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      value={newFup.time}
                      onChange={e => setNewFup({...newFup, time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#64748b' }}>Follow-up Type</label>
                  <select 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    value={newFup.type}
                    onChange={e => setNewFup({...newFup, type: e.target.value})}
                  >
                    <option value="check-in">Check-in</option>
                    <option value="first">First Follow-up</option>
                    <option value="second">Weekly Review</option>
                    <option value="discharge">Discharge Final</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#64748b' }}>Clinical Notes</label>
                  <textarea 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px' }}
                    placeholder="Instructions for the follow-up..."
                    value={newFup.notes}
                    onChange={e => setNewFup({...newFup, notes: e.target.value})}
                  />
                </div>
                <button type="submit" className="pp-btn-primary-large" style={{ marginTop: '10px' }}>
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
