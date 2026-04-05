import React, { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import {
  PageTitle,
  Card,
  Badge,
  Loader2,
  Divider,
  Table,
  TableRow,
  TableCell,
  Pagination
} from "../../components/UI";
import { api } from "../../utils/api";
import { getAvatarColor } from "../../utils/helpers";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import {
  PlusCircle,
  Clock,
  Stethoscope,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Trash2,
  X
} from "lucide-react";

export default function NurseAppointmentsPage() {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const prefilledPatientId = searchParams.get("patient");
  const prefilledType = searchParams.get("type");

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [showModal, setShowModal] = useState(prefilledPatientId ? true : false);
  const [filter, setFilter] = useState("All"); // Today | Week | All | Urgent
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("All Doctors");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    id: null,                    // NEW: for editing existing appointment
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
    
        const [appRes, patRes, docRes, taskRes] = await Promise.all([
          api.get("/nurse/appointments"),
          api.get("/nurse/patients"),
          api.get("/nurse/doctors"),
          api.get("/nurse/scheduling-tasks"),
        ]);

        // api returns data directly, not a Response object
        setAppointments(Array.isArray(appRes) ? appRes : appRes?.data || []);

        const patientsList = Array.isArray(patRes) ? patRes : patRes?.data || [];
        const uniquePatients = [];
        const patIds = new Set();
        patientsList.forEach((p) => {
          if (!patIds.has(p.id)) {
            patIds.add(p.id);
            uniquePatients.push(p);
          }
        });
        setPatients(uniquePatients);

        const docsList = Array.isArray(docRes) ? docRes : docRes?.data || [];
        const uniqueDocs = [];
        const docIds = new Set();
        docsList.forEach((d) => {
          if (!docIds.has(d.id)) {
            docIds.add(d.id);
            uniqueDocs.push(d);
          }
        });
        const normalized = uniqueDocs.map((d) => {
          const first = d.first_name ?? "";
          const last = d.last_name ?? "";
          const fullName = d.fullName || `${first} ${last}`.trim() || d.email || "Doctor";
          return { ...d, fullName };
        });
        setDoctors(normalized);

        // Doctor-prescribed scheduling tasks — shown as action cards above the table
        const tasks = Array.isArray(taskRes) ? taskRes : taskRes?.data || [];
        console.log("SCHEDULING TASKS FETCHED:", tasks);
        setInstructions(tasks);
    
      } catch (err) {
        console.error("Failed to fetch appointment data", err);
        toast.error("Failed to load appointments data");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  const dismissInstruction = async (fupId) => {
    if (!window.confirm("Are you sure you want to dismiss this doctor instruction?")) return;
    try {
      await api.delete(`/nurse/scheduling-tasks/${fupId}`);
      setInstructions((prev) => prev.filter((inst) => inst.follow_up_id !== fupId));
      toast.success("Instruction dismissed");
    } catch (err) {
      toast.error("Failed to dismiss instruction");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.post(`/nurse/appointments/${id}/status?status=${status}`);
      toast.success(`Appointment marked as ${status}`);
      // Remove from table immediately instead of refetching
      setAppointments((prev) => prev.filter((app) => app.id !== id));
    } catch (err) {
      toast.error("Failed to update status");
    }
  };
  
  const handleDelete = async (id) => {
    try {
      await api.delete(`/nurse/appointments/${id}`);
      toast.success("Appointment deleted");
      setAppointments((prev) => prev.filter((app) => app.id !== id));
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
    return appointments.filter((a) => {
      const aDate = new Date(a.date);
      return (
        aDate.getDate() === date.getDate() &&
        aDate.getMonth() === date.getMonth() &&
        aDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
    console.log("Step 1 - building payload");
    try {
      const payload = {
        patientid: Number(formData.patientId),
        doctorid: Number(formData.doctorId),
        date: formData.date,
        time: formData.time,
        type: formData.type,
        notes: formData.notes,
        urgency: formData.urgency,
        department: formData.department,
        instruction_id: formData.instructionId ? Number(formData.instructionId) : null
      };
      console.log("Step 2 - payload built", payload);
  
      let res;
      if (formData.id) {
        res = await api.put(`/nurse/appointments/${formData.id}`, payload);
      } else {
        res = await api.post("/nurse/appointments", payload);
      }
      console.log("Step 3 - API response", res);

      const success = res !== undefined && res !== null && !res?.error && !res?.detail;

      if (res?.response?.ok || res?.data?.id || res?.data?.appointment_id) {
        toast.success(formData.id ? "Appointment updated!" : "Appointment scheduled successfully!");

        // 1. Immediately filter out the instruction card from local state
        if (formData.instructionId) {
          setInstructions((prev) =>
            prev.filter((inst) => String(inst.instruction_id || inst.id) !== String(formData.instructionId))
          );
        }

        // 2. If it's a new appointment, we can also optimistically update the appointments table
        // but since we're fetching anyway, we'll just close the modal and refresh
        setShowModal(false);
        setConfirmationStep(false);
        setFormData({
          id: null,
          patientId: "",
          doctorId: "",
          date: "",
          time: "",
          type: "Follow-up",
          notes: "",
          urgency: "Routine",
          department: "OBGYN",
          instructionId: null
        });

        // Refresh the lists to sync with server
        try {
          const [appRes, taskRes] = await Promise.all([
            api.get("/nurse/appointments"),
            api.get("/nurse/scheduling-tasks"),
          ]);
          
          if (appRes?.data) setAppointments(appRes.data);
          else if (Array.isArray(appRes)) setAppointments(appRes);

          if (taskRes?.data) setInstructions(taskRes.data);
          else if (Array.isArray(taskRes)) setInstructions(taskRes);
        } catch (refreshErr) {
          console.error("Error refreshing data:", refreshErr);
        }
      } else {
        const errMsg = res?.data?.detail || "Failed to schedule appointment";
        toast.error(errMsg);
      }
    } catch (err) {
      toast.error("Failed to schedule appointment");
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (selectedDoctorFilter !== "All Doctors" && (a.doctor_name || a.doctorname) !== selectedDoctorFilter) {
      return false;
    }

    const appDate = new Date(a.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "Today") {
      const dateStr = typeof a.date === "string" ? a.date : appDate.toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      return dateStr === todayStr;
    }
    if (filter === "Week") {
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return appDate >= today && appDate <= nextWeek;
    }
    if (filter === "Urgent") {
      return a.urgency === "Urgent" || a.type === "Urgent Review" || a.type === "Urgent";
    }
    return true;
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: `1.5px solid ${theme.border}`,
    fontSize: 15,
    fontFamily: theme.fontBody,
    outline: "none",
    marginTop: 8,
    boxSizing: "border-box"
  };

  const labelStyle = {
    fontSize: 14,
    fontWeight: 700,
    color: theme.text,
    display: "flex",
    alignItems: "center",
    gap: 8
  };

  const getUrgencyColor = (urgency) => {
    if (!urgency) return theme.textSecondary;
    const u = String(urgency).toLowerCase();
    if (u.includes('high') || u.includes('urgent')) return theme.error;
    if (u.includes('moderate') || u.includes('medium')) return theme.warning;
    return theme.success;
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: theme.pageBg,
        fontFamily: theme.fontBody
      }}
    >
      <NurseSidebar />

      <main className="portal-main" style={{ background: theme.pageBg, fontFamily: theme.fontBody }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32
          }}
        >
          <PageTitle
            title="Clinical Appointments"
            subtitle="Schedule and manage patient reviews and follow-ups"
          />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={() => setShowCalendarModal(true)}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: `1.5px solid ${theme.border}`,
                background: "white",
                color: theme.text,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                transition: "border-color 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = theme.border)}
            >
              <Calendar size={18} color={theme.primary} /> View Calendar
            </button>
            <button
              onClick={() => {
                setFormData({
                  id: null,
                  patientId: "",
                  doctorId: "",
                  date: "",
                  time: "",
                  type: "Follow-up",
                  notes: "",
                  urgency: "Routine",
                  department: "OBGYN",
                  instructionId: null
                });
                setConfirmationStep(false);
                setShowModal(true);
              }}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: theme.primary,
                color: "white",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                boxShadow: `0 8px 20px -6px ${theme.primary}50`
              }}
            >
              <PlusCircle size={20} /> Schedule Appointment
            </button>
          </div>
        </div>

        {instructions.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: theme.primary + "15",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <ClipboardList size={20} color={theme.primary} />
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: theme.text,
                  margin: 0
                }}
              >
                Doctor Instructions (Action Required)
              </h3>
              <Badge variant="danger" style={{ padding: "2px 8px", marginLeft: 8 }}>
                {instructions.length} Pending
              </Badge>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 20
              }}
            >
              {instructions.map((inst) => (
                <Card
                  key={`task-${inst.follow_up_id || inst.id}`}
                  padding="24px"
                  style={{
                    border: `1px solid ${theme.border}`,
                    background: "white",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                    borderRadius: "16px",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          color: theme.text,
                          marginBottom: 4
                        }}
                      >
                        {inst.patient_name}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: theme.textMuted,
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <Stethoscope size={14} /> Ref: {inst.doctor_name}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Badge
                        variant={String(inst.urgency).includes("High") || String(inst.urgency).includes("Urgent") ? "danger" : "warning"}
                        size="sm"
                      >
                        {inst.urgency}
                      </Badge>
                      <button
                        onClick={() => dismissInstruction(inst.follow_up_id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 4,
                          cursor: "pointer",
                          color: theme.textMuted,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = theme.error + "15")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        title="Dismiss instruction"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      background: theme.pageBg,
                      padding: "16px",
                      borderRadius: 12,
                      border: `1px solid ${theme.border}80`,
                      marginBottom: 20,
                      flex: 1
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: theme.text,
                        marginBottom: 8,
                        lineHeight: 1.5
                      }}
                    >
                      <span style={{ color: theme.textMuted, fontWeight: 500 }}>Task:</span>{" "}
                      {inst.instruction || "Schedule follow-up based on assessment results"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.primary,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        opacity: 0.9
                      }}
                    >
                      <Clock size={12} /> Window: {inst.window}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFormData({
                        id: null,
                        patientId: inst.patient_id,
                        doctorId: inst.doctor_id,
                        date: "",
                        time: "",
                        type: "Follow-up",
                        notes: inst.instruction || "",
                        urgency:
                          String(inst.urgency).includes("High") || String(inst.urgency).includes("Urgent") ? "Urgent" : "Routine",
                        department: "OBGYN",
                        instructionId: inst.instruction_id || inst.id
                      });
                      setConfirmationStep(false);
                      setShowModal(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "12px",
                      border: "none",
                      background: theme.primary,
                      color: "white",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: `0 8px 16px ${theme.primary}25`,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 12px 20px ${theme.primary}35`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = `0 8px 16px ${theme.primary}25`;
                    }}
                  >
                    <Calendar size={16} /> Book Appointment
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            gap: 16,
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.textMuted }}>View:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ ...inputStyle, marginTop: 0, width: "auto", padding: "8px 16px", fontWeight: 600 }}
            >
              <option value="Today">Today's Schedule</option>
              <option value="Week">Next 7 Days</option>
              <option value="All">All Appointments</option>
              <option value="Urgent">Urgent Reviews</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.textMuted }}>Filter by Doctor:</span>
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              style={{ ...inputStyle, marginTop: 0, width: "auto", padding: "8px 16px" }}
            >
              <option value="All Doctors">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.fullName}>
                 Dr. {d.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Table
            headers={["S.No", "Date & Time", "Patient", "Doctor", "Type", "Actions"]}
            loading={loading}
            loadingMessage="Loading appointments..."
            emptyMessage="No appointments scheduled for this period."
          >
            {paginatedAppointments.map((app, idx) => (
              <TableRow key={`appt-${app.id}`}>
                <TableCell style={{ fontWeight: 700, color: theme.textMuted }}>
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </TableCell>
                <TableCell>
                  <div style={{ fontWeight: 700 }}>{app.date}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>{app.time}</div>
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: getAvatarColor(app.patient_name) + "15",
                        color: getAvatarColor(app.patient_name),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 16,
                        flexShrink: 0
                      }}
                    >
                      {(app.patient_name || app.patientname)?.charAt(0) || "?"}
                    </div>
                    <div style={{ fontWeight: 800, color: theme.text }}>{app.patient_name || app.patientname}</div>
                  </div>
                </TableCell>
                <TableCell>Dr. {app.doctor_name || app.doctorname || app.assigned_doctor || "Unassigned"}</TableCell>
                <TableCell>
                  <Badge variant={app.type === "Urgent Review" ? "danger" : "info"}>{app.type}</Badge>
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => handleStatusUpdate(app.id, "Completed")}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: `1.5px solid ${theme.border}`,
                        background: "white",
                        cursor: "pointer"
                      }}
                      title="Mark as Completed"
                    >
                      <CheckCircle size={16} color="#10b981" />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app.id, "Cancelled")}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: `1.5px solid ${theme.border}`,
                        background: "white",
                        cursor: "pointer"
                      }}
                      title="Cancel Appointment"
                    >
                      <XCircle size={16} color="#f59e0b" />
                    </button>
                    <button
                      onClick={() => {
                        setFormData({
                          id: app.id,
                          patientId: app.patient_id,
                          doctorId: app.doctor_id,
                          date: app.date,
                          time: app.time,
                          type: app.type || "Follow-up",
                          notes: app.notes || "",
                          urgency: app.urgency || "Routine",
                          department: app.department || "OBGYN",
                          instructionId: null
                        });
                        setConfirmationStep(false);
                        setShowModal(true);
                      }}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: `1.5px solid ${theme.border}`,
                        background: "white",
                        cursor: "pointer"
                      }}
                      title="Edit Appointment"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        border: `1.5px solid ${theme.border}`,
                        background: "white",
                        cursor: "pointer"
                      }}
                      title="Delete Appointment"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>

        {showModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}
          >
            <Card
              padding="40px"
              style={{
                width: "100%",
                maxWidth: 550,
                position: "relative",
                maxHeight: "90vh",
                overflowY: "auto"
              }}
            >
              {!confirmationStep ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 24
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontFamily: theme.fontHeading,
                          fontSize: 24,
                          fontWeight: 800,
                          margin: 0
                        }}
                      >
                        {formData.id ? "Edit Appointment" : "Schedule Appointment"}
                      </h2>
                      <p
                        style={{
                          color: theme.textMuted,
                          margin: "4px 0 0 0"
                        }}
                      >
                        {formData.instructionId
                          ? "Acting on Doctor Instruction"
                          : "Set up a review session for a patient."}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setConfirmationStep(false);
                        setFormData((prev) => ({ ...prev, id: null, instructionId: null }));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: theme.textMuted,
                        cursor: "pointer"
                      }}
                    >
                      <XCircle size={24} />
                    </button>
                  </div>

                  <form onSubmit={(e) => e.preventDefault()}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 20
                      }}
                    >
                      <div>
                        <label style={labelStyle}>
                          <User size={16} /> Patient
                        </label>
                        <select
                          style={inputStyle}
                          value={formData.patientId || ""}
                          onChange={(e) =>
                            !formData.instructionId && setFormData({ ...formData, patientId: e.target.value })
                          }
                          disabled={!!formData.instructionId}
                          required
                        >
                          <option value="">Choose patient...</option>
                          {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Urgency</label>
                        <select
                          style={inputStyle}
                          value={formData.urgency || "Routine"}
                          onChange={(e) =>
                            !formData.instructionId && setFormData({ ...formData, urgency: e.target.value })
                          }
                          disabled={!!formData.instructionId}
                        >
                          <option value="Routine">Routine</option>
                          <option value="Early">Early</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 20
                      }}
                    >
                      <div>
                        <label style={labelStyle}>
                          <Calendar size={16} /> Date
                        </label>
                        <input
                          style={inputStyle}
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Department</label>
                        <select
                          style={inputStyle}
                          value={formData.department || "OBGYN"}
                          onChange={(e) =>
                            !formData.instructionId && setFormData({ ...formData, department: e.target.value })
                          }
                          disabled={!!formData.instructionId}
                        >
                          <option value="OBGYN">OBGYN</option>
                          <option value="Psychiatry">Psychiatry</option>
                          <option value="General">General</option>
                        </select>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 20
                      }}
                    >
                      <div>
                        <label style={labelStyle}>Time</label>
                        <input
                          style={inputStyle}
                          type="time"
                          value={formData.time}
                          onChange={(e) =>
                            setFormData({ ...formData, time: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Doctor</label>
                        <select
                          style={inputStyle}
                          value={formData.doctorId || ""}
                          onChange={(e) =>
                            !formData.instructionId && setFormData({ ...formData, doctorId: e.target.value })
                          }
                          disabled={!!formData.instructionId}
                          required
                        >
                          <option value="">Choose doctor...</option>
                          {doctors.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.fullName ||
                                `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() ||
                                d.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>Notes</label>
                      <textarea
                        style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                        value={formData.notes}
                        onChange={(e) =>
                          !formData.instructionId && setFormData({ ...formData, notes: e.target.value })
                        }
                        disabled={!!formData.instructionId}
                        placeholder="Any specific instructions for this appointment..."
                      />
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmationStep(true);
                        }}
                        style={{
                          flex: 1,
                          padding: "13px",
                          borderRadius: 12,
                          border: "none",
                          background: theme.primary,
                          color: "white",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginBottom: 8
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setConfirmationStep(false);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: theme.textMuted,
                        padding: 4
                      }}
                      title="Close"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: theme.primary + "15",
                        color: theme.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px"
                      }}
                    >
                      <Calendar size={32} />
                    </div>
                    <h2
                      style={{
                        fontFamily: theme.fontHeading,
                        fontSize: 22,
                        fontWeight: 800,
                        marginBottom: 12
                      }}
                    >
                      Confirm Appointment?
                    </h2>
                    <div
                      style={{
                        background: theme.cardBgSecondary,
                        padding: 20,
                        borderRadius: 16,
                        marginBottom: 32,
                        textAlign: "left",
                        border: `1px solid ${theme.border}`
                      }}
                    >
                      <div style={{ marginBottom: 8, fontSize: 14 }}>
                        <strong>Patient:</strong>{" "}
                        {
                          patients.find(
                            (p) => String(p.id) === String(formData.patientId)
                          )?.name
                        }
                      </div>
                      <div style={{ marginBottom: 8, fontSize: 14 }}>
                        <strong>Date:</strong> {formData.date} at {formData.time}
                      </div>
                      <div style={{ marginBottom: 8, fontSize: 14 }}>
                        <strong>Doctor:</strong>{" "}
                        {
                          doctors.find(
                            (d) => String(d.id) === String(formData.doctorId)
                          )?.fullName
                        }
                      </div>
                      <div style={{ fontSize: 14 }}>
                        <strong>Urgency:</strong>{" "}
                        <Badge
                          variant={
                            formData.urgency === "Urgent" ? "danger" : "info"
                          }
                        >
                          {formData.urgency}
                        </Badge>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16 }}>
                      <button
                        onClick={() => setConfirmationStep(false)}
                        style={{
                          flex: 1,
                          padding: "14px",
                          borderRadius: 12,
                          border: `1.5px solid ${theme.border}`,
                          background: "white",
                          fontWeight: 700,
                          cursor: "pointer",
                          color: theme.textMuted
                        }}
                      >
                        No, Change
                      </button>
                      <button
                        onClick={handleCreate}
                        style={{
                          flex: 1,
                          padding: "14px",
                          borderRadius: 12,
                          border: "none",
                          background: theme.primary,
                          color: "white",
                          fontWeight: 700,
                          cursor: "pointer"
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

        {showCalendarModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCalendarModal(false);
            }}
          >
            <Card padding="32px" style={{ width: "100%", maxWidth: 420, position: "relative" }}>
              <button
                onClick={() => setShowCalendarModal(false)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: theme.textMuted,
                  padding: 4,
                  borderRadius: 6
                }}
                title="Close Calendar"
              >
                <X size={22} />
              </button>

              <h3
                style={{
                  fontFamily: theme.fontHeading,
                  fontSize: 20,
                  fontWeight: 800,
                  margin: "0 0 20px 0"
                }}
              >
                Appointment Calendar
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: theme.text
                  }}
                >
                  {currentDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric"
                  })}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() - 1,
                          1
                        )
                      )
                    }
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      border: `1px solid ${theme.border}`,
                      background: "white",
                      cursor: "pointer"
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${theme.border}`,
                      background: "white",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    Today
                  </button>
                  <button
                    onClick={() =>
                      setCurrentDate(
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          1
                        )
                      )
                    }
                    style={{
                      padding: 6,
                      borderRadius: 6,
                      border: `1px solid ${theme.border}`,
                      background: "white",
                      cursor: "pointer"
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 4,
                  textAlign: "center"
                }}
              >
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div
                    key={`${d}-${i}`}
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: theme.textMuted,
                      paddingBottom: 8
                    }}
                  >
                    {d}
                  </div>
                ))}
                {getDaysInMonth(currentDate).map((date, idx) => {
                  const isToday =
                    date && date.toDateString() === new Date().toDateString();
                  const events = getEventsForDay(date);
                  return (
                    <div
                      key={idx}
                      style={{
                        aspectRatio: "1",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: date ? 700 : 400,
                        background: isToday ? theme.primary : "transparent",
                        color: isToday ? "white" : theme.text,
                        position: "relative",
                        cursor: date ? "pointer" : "default",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => {
                        if (date && !isToday)
                          e.currentTarget.style.background = `${theme.primary}15`;
                      }}
                      onMouseLeave={(e) => {
                        if (date && !isToday)
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {date && date.getDate()}
                      {events.length > 0 && !isToday && (
                        <div
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: theme.primary,
                            position: "absolute",
                            bottom: 3
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 20,
                  fontSize: 12,
                  color: theme.textMuted,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: theme.primary
                  }}
                />
                Dot indicates appointments on that day
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
