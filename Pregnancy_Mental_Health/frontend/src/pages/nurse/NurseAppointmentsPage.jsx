import React, { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Badge, Loader2, Divider, Table, TableRow, TableCell, Pagination } from "../../components/UI";
import { api } from "../../utils/api";
import { dummyApi, USE_DUMMY_DATA, getAvatarColor } from "../../utils/dummyData";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { PlusCircle, Clock, Stethoscope, CheckCircle, XCircle, Calendar, User, ChevronLeft, ChevronRight, ClipboardList, Trash2, X } from "lucide-react";
import FilterToolbar from "../../components/FilterToolbar";
import { exportToPDF, exportToExcel, exportToCSV } from "../../utils/exportUtils";

export default function NurseAppointmentsPage() {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const prefilledPatientId = searchParams.get('patient');
  const prefilledType = searchParams.get('type');

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showModal, setShowModal] = useState(prefilledPatientId ? true : false);
  const [filter, setFilter] = useState("All"); // Today | Week | All | Urgent
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("All Doctors");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  // FIX 2: State to control the calendar modal overlay
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    patientId: prefilledPatientId || "",
    doctorId: "",
    date: "",
    time: "",
    type: prefilledType || "Follow-up",
    notes: "",
    urgency: "Routine",
    department: "OBGYN",
    instructionId: null
  });
  const [confirmationStep, setConfirmationStep] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (USE_DUMMY_DATA) {
          const [appData, patData, docData, instData] = await Promise.all([
            dummyApi.getAppointments(),
            dummyApi.getPatients(),
            dummyApi.getDoctors(),
            dummyApi.getDoctorInstructions()
          ]);
          setAppointments(appData);
          setPatients(patData);
          setDoctors(docData);
          setInstructions(instData.filter(i => i.status === 'pending'));
        } else {
          const [appRes, patRes, docRes] = await Promise.all([
            api.get("/appointments"),
            api.get("/nurse/patients"),
            api.get("/nurse/doctors")
          ]);

          if (appRes.ok) setAppointments(await appRes.json());
          if (patRes.ok) setPatients(await patRes.json());
          if (docRes.ok) setDoctors(await docRes.json());
        }
      } catch (err) {
        console.error("Failed to fetch appointment data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      if (USE_DUMMY_DATA) {
        const res = await dummyApi.updateAppointmentStatus(id, status);
        if (res.ok) {
          setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
          toast.success(`Appointment marked as ${status} (Mock)`);
        }
      } else {
        const res = await api.post(`/appointments/${id}/status?status=${status}`);
        if (res.ok) {
          toast.success(`Appointment marked as ${status}`);
          const appRes = await api.get("/appointments");
          if (appRes.ok) setAppointments(await appRes.json());
        }
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    try {
      if (USE_DUMMY_DATA) {
        const res = await dummyApi.deleteAppointment(id);
        if (res.ok) {
          setAppointments(prev => prev.filter(app => app.id !== id));
          toast.success("Appointment deleted (Mock)");
        }
      } else {
        const res = await api.delete(`/appointments/${id}`);
        if (res.ok) {
          toast.success("Appointment deleted");
          setAppointments(prev => prev.filter(app => app.id !== id));
        }
      }
    } catch (err) {
      toast.error("Failed to delete appointment");
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getEventsForDay = (date) => {
    if (!date) return [];
    return appointments.filter(a => {
      const aDate = new Date(a.date);
      return aDate.getDate() === date.getDate() &&
             aDate.getMonth() === date.getMonth() &&
             aDate.getFullYear() === date.getFullYear();
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (USE_DUMMY_DATA) {
        // FIX 1: Use String() to ensure type-safe comparison, since <select> always yields strings
        const selectedPatient = patients.find(p => String(p.id) === String(formData.patientId));
        // FIX 1: doctorId holds the doctor's name string (set from slot.doctor), so use it directly
        const selectedDoctor = doctors.find(d => String(d.id) === String(formData.doctorId) || d.fullName === formData.doctorId);

        const payload = {
          ...formData,
          patient_name: selectedPatient?.name || "Unknown Patient",
          // FIX: prefer doctor_name already set from slot selection (slot.doctor),
          // then fall back to ID lookup, then to the raw doctorId string.
          doctor_name: formData.doctor_name || selectedDoctor?.fullName || formData.doctorId || "Unassigned"
        };

        const res = await dummyApi.createAppointment(payload);
        if (res.ok) {
          toast.success("Appointment scheduled successfully (Mock)!");
          setShowModal(false);
          setConfirmationStep(false);
          const [appData, instData] = await Promise.all([
            dummyApi.getAppointments(),
            dummyApi.getDoctorInstructions()
          ]);
          setAppointments(appData);
          setInstructions(instData.filter(i => i.status === 'pending'));
        }
      } else {
        const res = await api.post("/appointments", formData);
        if (res.ok) {
          toast.success("Appointment scheduled successfully!");
          setShowModal(false);
          setConfirmationStep(false);
          // Refresh list
          const appRes = await api.get("/appointments");
          if (appRes.ok) setAppointments(await appRes.json());
        }
      }
    } catch (err) {
      toast.error("Failed to schedule appointment");
    }
  };

  const filteredAppointments = appointments.filter(a => {
    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!a.patient_name?.toLowerCase().includes(q) && !a.doctor_name?.toLowerCase().includes(q)) return false;
    }

    // Role/Doctor Filter
    if (selectedDoctorFilter !== "All Doctors" && a.doctor_name !== selectedDoctorFilter) {
      return false;
    }

    const appDate = new Date(a.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "Today") {
      return appDate.toDateString() === today.toDateString();
    }
    if (filter === "Week") {
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return appDate >= today && appDate <= nextWeek;
    }
    if (filter === "Urgent") {
      return a.type === 'Urgent Review' || a.type === 'Urgent';
    }
    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: `1.5px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.text,
    fontSize: 15,
    fontFamily: theme.fontBody,
    outline: 'none',
    marginTop: 8,
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 800,
    color: theme.isDark ? "#FFFFFF" : theme.textSecondary,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <NurseSidebar />

      <main className="portal-main" style={{ background: theme.pageBg, fontFamily: theme.fontBody }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <PageTitle title="Clinical Appointments" subtitle="Schedule and manage patient reviews and follow-ups" />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* View Calendar button lives next to Schedule Appointment */}
            <button
              onClick={() => setShowCalendarModal(true)}
              style={{
                padding: '12px 20px', borderRadius: 12, border: `1.5px solid ${theme.border}`,
                background: theme.cardBg, color: theme.text, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = theme.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
            >
              <Calendar size={18} color={theme.primary} /> View Calendar
            </button>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none',
                background: theme.primary, color: 'white', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                boxShadow: `0 8px 20px -6px ${theme.primary}50`
              }}
            >
              <PlusCircle size={20} /> Schedule Appointment
            </button>
          </div>
        </div>


        {instructions.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: theme.primary + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={20} color={theme.primary} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.text, margin: 0 }}>Doctor Instructions (Action Required)</h3>
              <Badge variant="danger" style={{ padding: '2px 8px', marginLeft: 8 }}>{instructions.length} Pending</Badge>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {instructions.map(inst => (
                <Card key={inst.id} padding="24px" style={{ 
                  border: `1px solid ${theme.border}`, 
                  background: theme.cardBg,
                  boxShadow: theme.isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.03)',
                  borderRadius: '16px',
                  display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: theme.text, marginBottom: 4 }}>{inst.patient_name}</div>
                      <div style={{ fontSize: 13, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Stethoscope size={14} /> Ref: {inst.doctor_name}
                      </div>
                    </div>
                    <Badge variant={inst.urgency === 'Urgent' ? 'danger' : 'warning'} size="sm">{inst.urgency}</Badge>
                  </div>
                  <div style={{ 
                    fontSize: 13, background: theme.pageBg, padding: '16px', 
                    borderRadius: 12, border: `1px solid ${theme.border}80`, 
                    marginBottom: 20, flex: 1
                  }}>
                    <div style={{ fontWeight: 600, color: theme.text, marginBottom: 8, lineHeight: 1.5 }}>
                      <span style={{ color: theme.textMuted, fontWeight: 500 }}>Task:</span> {inst.instruction}
                    </div>
                    <div style={{ fontSize: 12, color: theme.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9 }}>
                      <Clock size={12} /> Window: {inst.window}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        setFormData({
                            ...formData,
                            patientId: inst.patient_id,
                            urgency: inst.urgency === 'Urgent' ? 'Urgent' : 'Routine',
                            type: 'Follow-up',
                            instructionId: inst.id,
                            notes: inst.instruction
                        });
                        setShowModal(true);
                    }}
                    style={{ 
                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none', 
                        background: theme.primary, color: 'white', fontWeight: 600, 
                        fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: `0 8px 16px ${theme.primary}25`, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 20px ${theme.primary}35`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 16px ${theme.primary}25`; }}
                  >
                    <Calendar size={16} /> Book Appointment
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <Card glass noPadding>
            <FilterToolbar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Search patient or doctor..."
              filters={[
                { label: "All", value: "All" },
                { label: "Today", value: "Today" },
                { label: "This Week", value: "Week" },
                { label: "Urgent", value: "Urgent" },
              ]}
              activeFilter={filter}
              onFilterChange={setFilter}
              onPDFExport={() => exportToPDF(
                filteredAppointments,
                'Appointments Report',
                [
                  { header: 'Patient', accessor: 'patient_name' },
                  { header: 'Doctor', accessor: 'doctor_name' },
                  { header: 'Date', accessor: 'date' },
                  { header: 'Time', accessor: 'time' },
                  { header: 'Type', accessor: 'type' },
                  { header: 'Status', accessor: 'status' },
                ],
                'appointments-report'
              )}
              onExcelExport={() => exportToExcel(
                filteredAppointments.map(a => ({
                  Patient: a.patient_name,
                  Doctor: a.doctor_name,
                  Date: a.date,
                  Time: a.time,
                  Type: a.type,
                  Status: a.status,
                })),
                'Appointments Report',
                'appointments-report'
              )}
              onCSVExport={() => exportToCSV(
                filteredAppointments.map(a => ({
                  Patient: a.patient_name,
                  Doctor: a.doctor_name,
                  Date: a.date,
                  Time: a.time,
                  Type: a.type,
                  Status: a.status,
                })),
                'appointments-report'
              )}
            />
          </Card>
        </div>
        
        {/* Full-width table - no side panel */}
        <div>
          <Table 
            headers={["S.No", "Date & Time", "Patient", "Doctor", "Type", "Actions"]}
            loading={loading}
            loadingMessage="Loading appointments..."
            emptyMessage="No appointments scheduled for this period."
          >
            {paginatedAppointments.map((app, idx) => (
              <TableRow key={app.id}>
                <TableCell style={{ fontWeight: 700, color: theme.textMuted }}>
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: 700 }}>{app.date}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>{app.time}</div>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, 
                      background: getAvatarColor(app.patient_name) + '15', color: getAvatarColor(app.patient_name), 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 16, flexShrink: 0
                    }}>
                      {app.patient_name?.charAt(0) || '?'}
                    </div>
                    <div style={{ fontWeight: 800, color: theme.text }}>{app.patient_name}</div>
                  </div>
                </TableCell>
                <TableCell>{app.doctor_name || 'Dr. Priya Sharma'}</TableCell>
                <TableCell>
                  <Badge variant={app.type === 'Urgent Review' ? 'danger' : 'info'}>{app.type}</Badge>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      onClick={() => handleStatusUpdate(app.id, 'Completed')}
                      style={{ padding: 8, borderRadius: 8, border: `1.5px solid ${theme.border}`, background: theme.cardBg, cursor: 'pointer' }}
                      title="Mark as Completed"
                    >
                      <CheckCircle size={16} color="#10b981" />
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(app.id, 'Cancelled')}
                      style={{ padding: 8, borderRadius: 8, border: `1.5px solid ${theme.border}`, background: theme.cardBg, cursor: 'pointer' }}
                      title="Cancel Appointment"
                    >
                      <XCircle size={16} color="#f59e0b" />
                    </button>
                    <button 
                      onClick={() => handleDelete(app.id)}
                      style={{ padding: 8, borderRadius: 8, border: `1.5px solid ${theme.border}`, background: theme.cardBg, cursor: 'pointer' }}
                      title="Delete Appointment"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <Card padding="40px" style={{ width: '100%', maxWidth: 550, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              
              {!confirmationStep ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <h2 style={{ fontFamily: theme.fontHeading, fontSize: 24, fontWeight: 800, margin: 0 }}>Schedule Appointment</h2>
                      <p style={{ color: theme.textMuted, margin: '4px 0 0 0' }}>{formData.instructionId ? `Acting on Doctor Instruction` : `Set up a review session for a patient.`}</p>
                    </div>
                    <button onClick={() => { setShowModal(false); setFormData({ ...formData, instructionId: null }); }} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer' }}><XCircle size={24} /></button>
                  </div>

                  <form onSubmit={(e) => e.preventDefault()}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={labelStyle}><User size={16} /> Patient</label>
                        <select style={inputStyle} value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} required>
                          <option value="">Choose patient...</option>
                          {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Urgency</label>
                        <select style={inputStyle} value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}>
                          <option value="Routine">Routine</option>
                          <option value="Early">Early</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={labelStyle}><Calendar size={16} /> Date</label>
                        <input style={inputStyle} type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                      </div>
                      <div>
                        <label style={labelStyle}>Department</label>
                        <select 
                          style={inputStyle} 
                          value={formData.department} 
                          onChange={async (e) => {
                            const dept = e.target.value;
                            setFormData({ ...formData, department: dept });
                            if (USE_DUMMY_DATA) {
                              const slots = await dummyApi.getAvailableSlots(dept);
                              setAvailableSlots(slots);
                            }
                          }}
                        >
                          <option value="OBGYN">OBGYN</option>
                          <option value="Psychiatry">Psychiatry</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={{ ...labelStyle, marginBottom: 12 }}>Pick an available slot</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        {availableSlots.length > 0 ? availableSlots.map(slot => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              // FIX: Store doctor_id AND doctor_name from the slot so the
                              // appointment record correctly identifies the assigned doctor.
                              setFormData({
                                ...formData,
                                time: slot.time,
                                doctorId: slot.doctor_id || slot.doctor,   // prefer id, fall back to name
                                doctor_name: slot.doctor                   // always keep readable name
                              });
                              setConfirmationStep(true);
                            }}
                            style={{
                              padding: '12px', borderRadius: 10, border: `1.5px solid ${theme.border}`,
                              background: theme.cardBg, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.primary}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.border}
                          >
                            <div style={{ fontWeight: 700, fontSize: 13, color: theme.text }}>{slot.time}</div>
                            <div style={{ fontSize: 11, color: theme.textMuted }}>{slot.doctor}</div>
                          </button>
                        )) : (
                          <div style={{ gridColumn: 'span 2', fontSize: 13, color: theme.textMuted, textAlign: 'center', padding: 20, background: theme.cardBgSecondary, borderRadius: 12 }}>
                            Select Date & Department to see slots.
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                // FIX 3: Confirmation step now has an X close button in the top-right corner
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <button
                      onClick={() => { setShowModal(false); setConfirmationStep(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: 4 }}
                      title="Close"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: 64, height: 64, borderRadius: '50%', background: theme.primary + '15', 
                      color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 24px'
                    }}>
                      <Calendar size={32} />
                    </div>
                    <h2 style={{ fontFamily: theme.fontHeading, fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Confirm Appointment?</h2>
                    <div style={{ 
                      background: theme.cardBgSecondary, padding: 20, borderRadius: 16, marginBottom: 32,
                      textAlign: 'left', border: `1px solid ${theme.border}`
                    }}>
                      {/* FIX 1: Use String() for type-safe comparison in confirmation view too */}
                      <div style={{ marginBottom: 8, fontSize: 14 }}><strong>Patient:</strong> {patients.find(p => String(p.id) === String(formData.patientId))?.name}</div>
                      <div style={{ marginBottom: 8, fontSize: 14 }}><strong>Date:</strong> {formData.date} at {formData.time}</div>
                      <div style={{ marginBottom: 8, fontSize: 14 }}><strong>Doctor:</strong> {formData.doctorId}</div>
                      <div style={{ fontSize: 14 }}><strong>Urgency:</strong> <Badge variant={formData.urgency === 'Urgent' ? 'danger' : 'info'}>{formData.urgency}</Badge></div>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                      <button 
                        onClick={() => setConfirmationStep(false)}
                        style={{ 
                          flex: 1, padding: '14px', borderRadius: 12, border: `1.5px solid ${theme.border}`, 
                          background: theme.cardBg, fontWeight: 700, cursor: 'pointer', color: theme.textMuted
                        }}
                      >
                        No, Change
                      </button>
                      <button 
                        onClick={handleCreate}
                        style={{ 
                          flex: 1, padding: '14px', borderRadius: 12, border: 'none', 
                          background: theme.primary, color: 'white', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        Yes, Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* FIX 2: Calendar Modal Overlay - triggered by 'View Calendar' button */}
        {showCalendarModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowCalendarModal(false); }}
          >
            <Card padding="32px" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
              {/* FIX 3: X close button on the calendar modal */}
              <button
                onClick={() => setShowCalendarModal(false)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: theme.textMuted, padding: 4, borderRadius: 6
                }}
                title="Close Calendar"
              >
                <X size={22} />
              </button>

              <h3 style={{ fontFamily: theme.fontHeading, fontSize: 20, fontWeight: 800, margin: '0 0 20px 0' }}>
                Appointment Calendar
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={{ padding: 6, borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                  <button onClick={() => setCurrentDate(new Date())} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Today</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={{ padding: 6, borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.text, cursor: 'pointer' }}><ChevronRight size={16} /></button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={`${d}-${i}`} style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, paddingBottom: 8 }}>{d}</div>
                ))}
                {getDaysInMonth(currentDate).map((date, idx) => {
                  const isToday = date && date.toDateString() === new Date().toDateString();
                  const events = getEventsForDay(date);
                  return (
                    <div
                      key={idx}
                      style={{
                        aspectRatio: '1', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', borderRadius: 8,
                        fontSize: 13, fontWeight: date ? 700 : 400,
                        background: isToday ? theme.primary : 'transparent',
                        color: isToday ? 'white' : theme.text,
                        position: 'relative', cursor: date ? 'pointer' : 'default',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => { if (date && !isToday) e.currentTarget.style.background = `${theme.primary}15`; }}
                      onMouseLeave={e => { if (date && !isToday) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {date && date.getDate()}
                      {events.length > 0 && !isToday && (
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: theme.primary, position: 'absolute', bottom: 3 }} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 20, fontSize: 12, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.primary }} />
                Dot indicates appointments on that day
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}


