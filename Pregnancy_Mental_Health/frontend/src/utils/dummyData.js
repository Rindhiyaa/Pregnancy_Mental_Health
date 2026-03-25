/**
 * Dummy Data and Mock API Utility
 * This file provides a mock backend layer using localStorage for persistence.
 * It allows the Nurse Portal to function independently of the FastAPI backend
 * during UI development and demonstrations.
 */

const STORAGE_KEYS = {
  PATIENTS: 'ppd_nurse_patients',
  APPOINTMENTS: 'ppd_nurse_appointments',
  ASSESSMENTS: 'ppd_nurse_assessments',
  DOCTORS: 'ppd_nurse_doctors',
  STATS: 'ppd_nurse_stats',
  MESSAGES: 'ppd_messages',
  DOCTOR_INSTRUCTIONS: 'ppd_doctor_instructions'
};

// Simulation delay to make loading states visible
const sleep = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms));

// Flag to toggle between real API and dummy data
export const USE_DUMMY_DATA = false;

// --- Initial Data ---

const INITIAL_DOCTORS = [
  { id: 'doc1', fullName: 'Dr. Sarah Johnson', specialization: 'OB/GYN Specialist', email: 'sarah.j@hospital.com' },
  { id: 'doc2', fullName: 'Dr. Michael Chen', specialization: 'Perinatal Psychiatrist', email: 'm.chen@hospital.com' },
  { id: 'doc3', fullName: 'Dr. Elena Rodriguez', specialization: 'Maternal-Fetal Medicine', email: 'e.rodriguez@hospital.com' },
];

const INITIAL_PATIENTS = [
  {
    id: 'p1',
    name: 'Emily Thompson',
    email: 'emily.t@example.com',
    phone: '+1 234-567-8901',
    age: 28,
    pregnancy_week: 28,
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'Active',
    last_assessment_date: '2026-03-15',
    created_at: '2026-02-10'
  },
  {
    id: 'p2',
    name: 'Jessica Williams',
    email: 'jess.w@example.com',
    phone: '+1 234-567-8902',
    age: 24,
    pregnancy_week: 14,
    assigned_doctor_name: 'Dr. Michael Chen',
    assigned_doctor_id: 'doc2',
    status: 'Draft',
    last_assessment_date: null,
    created_at: '2026-03-18'
  },
  {
    id: 'p3',
    name: 'Sophia Garcia',
    email: 'sophia.g@example.com',
    phone: '+1 234-567-8903',
    age: 31,
    pregnancy_week: 36,
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'submitted',
    last_assessment_date: '2026-03-10',
    created_at: '2026-01-05'
  },
  {
    id: 'p4',
    name: 'Olivia Brown',
    email: 'olivia.b@example.com',
    phone: '+1 234-567-8904',
    age: 29,
    pregnancy_week: 22,
    assigned_doctor_name: 'Unassigned',
    assigned_doctor_id: null,
    status: 'Active',
    last_assessment_date: '2026-03-17',
    created_at: '2026-03-12'
  },
  {
    id: 'p5',
    name: 'Isabella Martinez',
    email: 'isabella.m@example.com',
    phone: '+1 234-567-8905',
    age: 26,
    pregnancy_week: 10,
    assigned_doctor_name: 'Dr. Elena Rodriguez',
    assigned_doctor_id: 'doc3',
    status: 'Active',
    last_assessment_date: '2026-03-19',
    created_at: '2026-03-19'
  },
  {
    id: 'p6',
    name: 'Ava Wilson',
    email: 'ava.w@example.com',
    phone: '+1 234-567-8906',
    age: 32,
    pregnancy_week: 32,
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'submitted',
    last_assessment_date: '2026-03-20',
    created_at: '2026-02-28'
  },
  {
    id: 'p7',
    name: 'Mia Anderson',
    email: 'mia.a@example.com',
    phone: '+1 234-567-8907',
    age: 27,
    pregnancy_week: 18,
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'Active',
    last_assessment_date: '2026-03-12',
    created_at: '2026-03-01'
  },
  {
    id: 'p8',
    name: 'Charlotte Taylor',
    email: 'charlotte.t@example.com',
    phone: '+1 234-567-8908',
    age: 30,
    pregnancy_week: 12,
    assigned_doctor_name: 'Dr. Michael Chen',
    assigned_doctor_id: 'doc2',
    status: 'Active',
    last_assessment_date: '2026-03-18',
    created_at: '2026-03-15'
  },
  {
    id: 'p9',
    name: 'Rindhiyaa Sathish',
    email: 'rindhiyaa@patient.com',
    phone: '+91 98765 43210',
    age: 23,
    pregnancy_week: 20,
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'Active',
    last_assessment_date: null,
    created_at: '2026-03-20'
  },
  {
    id: 'p10',
    name: 'Kavitha B',
    email: 'kavitha.b@example.com',
    phone: '+91 99887 76655',
    age: 29,
    pregnancy_week: 34,
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'Critical',
    last_assessment_date: '2026-03-20',
    created_at: '2026-02-15'
  }
];

const INITIAL_DOCTOR_INSTRUCTIONS = [
  { 
    id: 'inst1', 
    patient_id: 'p10', 
    patient_name: 'Kavitha B', 
    doctor_name: 'Dr. Sarah Johnson', 
    instruction: 'Schedule Kavitha with psychiatry next week',
    urgency: 'Urgent',
    window: 'within 7 days',
    department: 'Psychiatry',
    status: 'pending'
  },
  { 
    id: 'inst2', 
    patient_id: 'p9', 
    patient_name: 'Rindhiyaa Sathish', 
    doctor_name: 'Dr. Michael Chen', 
    instruction: 'Schedule Rindhiyaa follow-up',
    urgency: 'Routine',
    window: 'within 14 days',
    department: 'OBGYN',
    status: 'pending'
  }
];

// FIX 1: Slots now reference real doctors from INITIAL_DOCTORS so appointments
// display the correct assigned doctor instead of 'Dr. Priya' / unknown names.
const INITIAL_SLOTS = [
  { id: 's1', doctor_id: 'doc2', doctor: 'Dr. Michael Chen', time: 'Tue 10:00 AM', department: 'Psychiatry' },
  { id: 's2', doctor_id: 'doc2', doctor: 'Dr. Michael Chen', time: 'Wed 02:00 PM', department: 'Psychiatry' },
  { id: 's3', doctor_id: 'doc1', doctor: 'Dr. Sarah Johnson', time: 'Fri 11:00 AM', department: 'OBGYN' },
  { id: 's4', doctor_id: 'doc3', doctor: 'Dr. Elena Rodriguez', time: 'Mon 09:30 AM', department: 'General' },
];

const INITIAL_APPOINTMENTS = [
  { id: 'a1', patient_name: 'Emily Thompson', doctor_name: 'Dr. Sarah Johnson', date: '2026-03-25', time: '10:00 AM', type: 'Routine Checkup', status: 'Scheduled' },
  { id: 'a2', patient_name: 'Sophia Garcia', doctor_name: 'Dr. Michael Chen', date: '2026-03-22', time: '02:30 PM', type: 'Mental Health Follow-up', status: 'Confirmed' },
];

const INITIAL_ASSESSMENTS = [
  {
    id: 'as1',
    patient_id: 'p1',
    patient_name: 'Emily Thompson',
    created_at: '2026-03-20T09:30:00Z',
    epds_score: 14,
    risk_level: 'High',
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'reviewed',
    clinician_risk: 'High',
    plan: 'Urgent psychiatry referral sent. Immediate follow-up required.'
  },
  {
    id: 'as2',
    patient_id: 'p3',
    patient_name: 'Sophia Garcia',
    created_at: '2026-03-19T14:15:00Z',
    epds_score: 11,
    risk_level: 'Moderate',
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'submitted',
    clinician_risk: 'Moderate',
    plan: 'Scheduled for counseling. Monitor weekly.'
  },
  {
    id: 'as3',
    patient_id: 'p4',
    patient_name: 'Olivia Brown',
    created_at: '2026-03-18T11:00:00Z',
    epds_score: 4,
    risk_level: 'Low',
    assigned_doctor_name: 'Unassigned',
    assigned_doctor_id: null,
    status: 'submitted'
  },
  {
    id: 'as4',
    patient_id: 'p2',
    patient_name: 'Jessica Williams',
    created_at: '2026-03-20T10:45:00Z',
    epds_score: 0,
    risk_level: 'Pending',
    assigned_doctor_name: 'Dr. Michael Chen',
    assigned_doctor_id: 'doc2',
    status: 'draft'
  },
  {
    id: 'as5',
    patient_id: 'p5',
    patient_name: 'Isabella Martinez',
    created_at: '2026-03-17T08:20:00Z',
    epds_score: 18,
    risk_level: 'High',
    assigned_doctor_name: 'Dr. Elena Rodriguez',
    assigned_doctor_id: 'doc3',
    status: 'reviewed',
    clinician_risk: 'High',
    plan: 'Hospitalization recommended for safety monitoring.'
  },
  {
    id: 'as6',
    patient_id: 'p6',
    patient_name: 'Ava Wilson',
    created_at: '2026-03-20T11:15:00Z',
    epds_score: 15,
    risk_level: 'High',
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'submitted'
  },
  {
    id: 'as7',
    patient_id: 'p7',
    patient_name: 'Mia Anderson',
    created_at: '2026-03-12T14:30:00Z',
    epds_score: 7,
    risk_level: 'Low',
    assigned_doctor_name: 'Dr. Sarah Johnson',
    assigned_doctor_id: 'doc1',
    status: 'submitted'
  }
];

// --- Helper Functions ---

const getFromStorage = (key, initialValue) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialValue));
    return initialValue;
  }
  return JSON.parse(data);
};

const saveToStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// --- Mock API Functions ---

export const dummyApi = {
  // Stats
  getNurseStats: async () => {
    await sleep();
    const patients = getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const assessments = getFromStorage(STORAGE_KEYS.ASSESSMENTS, []);

    return {
      new_patients_today: patients.filter(p => p.created_at === new Date().toISOString().split('T')[0]).length,
      pending_assessments: patients.filter(p => p.status === 'Draft').length,
      waiting_review: patients.filter(p => p.status === 'Pending').length,
      total_patients: patients.length
    };
  },

  // Patients
  getPatients: async (params = {}) => {
    await sleep();
    let patients = getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);

    if (params.limit) {
      patients = patients.slice(0, params.limit);
    }

    return patients;
  },

  getPatientById: async (id) => {
    await sleep();
    const patients = getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    return patients.find(p => p.id === id) || null;
  },

  registerPatient: async (patientData) => {
    await sleep(1000);
    const patients = getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const doctors = getFromStorage(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);

    const assignedDoctor = doctors.find(d => d.id === patientData.assignedDoctor);

    const newPatient = {
      id: `p${Date.now()}`,
      name: patientData.fullName,
      email: patientData.email,
      phone: patientData.phone,
      pregnancy_week: parseInt(patientData.pregnancyWeek),
      assigned_doctor_name: assignedDoctor ? assignedDoctor.fullName : 'Unassigned',
      assigned_doctor_id: patientData.assignedDoctor,
      status: 'Active',
      last_assessment_date: null,
      created_at: new Date().toISOString().split('T')[0],
      ...patientData
    };

    patients.unshift(newPatient);
    saveToStorage(STORAGE_KEYS.PATIENTS, patients);
    return { ok: true, data: newPatient };
  },

  // Doctors
  getDoctors: async () => {
    await sleep();
    return getFromStorage(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
  },

  // Appointments
  getAppointments: async () => {
    await sleep();
    return getFromStorage(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  },

  createAppointment: async (appointmentData) => {
    await sleep(800);
    const appointments = getFromStorage(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const instructions = getFromStorage(STORAGE_KEYS.DOCTOR_INSTRUCTIONS, INITIAL_DOCTOR_INSTRUCTIONS);

    const newAppointment = {
      id: `a${Date.now()}`,
      ...appointmentData,
      status: 'Scheduled'
    };
    appointments.unshift(newAppointment);
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);

    // Resolve instruction if provided
    if (appointmentData.instructionId) {
      const idx = instructions.findIndex(inst => inst.id === appointmentData.instructionId);
      if (idx !== -1) {
        instructions[idx].status = 'resolved';
        saveToStorage(STORAGE_KEYS.DOCTOR_INSTRUCTIONS, instructions);
      }
    }

    return { ok: true, data: newAppointment };
  },

  updateAppointmentStatus: async (id, status) => {
    await sleep(400);
    const appointments = getFromStorage(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const idx = appointments.findIndex(app => app.id === id);
    if (idx !== -1) {
      appointments[idx].status = status;
      saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);
      return { ok: true };
    }
    return { ok: false };
  },

  deleteAppointment: async (id) => {
    await sleep(400);
    const appointments = getFromStorage(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const filtered = appointments.filter(app => app.id !== id);
    if (filtered.length < appointments.length) {
      saveToStorage(STORAGE_KEYS.APPOINTMENTS, filtered);
      return { ok: true };
    }
    return { ok: false };
  },

  updatePatientStatus: async (id, status) => {
    await sleep(400);
    const patients = getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const idx = patients.findIndex(p => String(p.id) === String(id));
    if (idx !== -1) {
      patients[idx].status = status;
      saveToStorage(STORAGE_KEYS.PATIENTS, patients);
      return { ok: true };
    }
    return { ok: false };
  },


  getDoctorInstructions: async () => {
    await sleep();
    return getFromStorage(STORAGE_KEYS.DOCTOR_INSTRUCTIONS, INITIAL_DOCTOR_INSTRUCTIONS);
  },

  getAvailableSlots: async (department = null) => {
    await sleep(400);
    if (!department) return INITIAL_SLOTS;
    return INITIAL_SLOTS.filter(s => s.department === department);
  },

  // Assessments
  getAssessments: async (patientId = null) => {
    await sleep();
    const assessments = getFromStorage(STORAGE_KEYS.ASSESSMENTS, INITIAL_ASSESSMENTS);
    if (patientId) {
      return assessments.filter(a => a.patient_id === patientId);
    }
    return assessments;
  },

  saveAssessment: async (assessmentData) => {
    await sleep(1200);
    const assessments = getFromStorage(STORAGE_KEYS.ASSESSMENTS, []);
    const patients = getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);

    const newAssessment = {
      id: `as${Date.now()}`,
      created_at: new Date().toISOString(),
      ...assessmentData
    };

    assessments.unshift(newAssessment);
    saveToStorage(STORAGE_KEYS.ASSESSMENTS, assessments);

    // Update patient status if needed
    const patientIdx = patients.findIndex(p => p.id === assessmentData.patient_id);
    if (patientIdx !== -1) {
      patients[patientIdx].status = assessmentData.is_draft ? 'Draft' : (assessmentData.status || 'submitted');
      patients[patientIdx].last_assessment_date = new Date().toISOString().split('T')[0];
      saveToStorage(STORAGE_KEYS.PATIENTS, patients);
    }

    return { ok: true, data: newAssessment };
  },

  // --- DOCTOR PORTAL MOCKS ---

  getDoctorDashboard: async () => {
    await sleep(800);
    const patients = getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const assessments = getFromStorage(STORAGE_KEYS.ASSESSMENTS, []);

    const stats = {
      total: patients.length,
      high: assessments.filter(a => a.risk_level?.toLowerCase().includes('high')).length,
      moderate: assessments.filter(a => a.risk_level?.toLowerCase().includes('moderate')).length,
      low: assessments.filter(a => a.risk_level?.toLowerCase().includes('low')).length,
      today: assessments.filter(a => a.created_at?.startsWith(new Date().toISOString().split('T')[0])).length
    };

    return {
      stats,
      recent_assessments: assessments.slice(0, 5),
      urgent_cases: assessments.filter(a => a.risk_level?.toLowerCase().includes('high')).slice(0, 3)
    };
  },

  getDoctorAssessments: async (status = null) => {
    await sleep(600);
    let assessments = getFromStorage(STORAGE_KEYS.ASSESSMENTS, []);
    if (status) {
      assessments = assessments.filter(a => a.status === status);
    }
    return assessments;
  },

  reviewAssessment: async (id, reviewData) => {
    await sleep(800);
    const assessments = getFromStorage(STORAGE_KEYS.ASSESSMENTS, []);
    const idx = assessments.findIndex(a => a.id === id);
    if (idx !== -1) {
      const updated = { 
        ...assessments[idx], 
        ...reviewData, 
        status: reviewData.status || 'reviewed' 
      };
      assessments[idx] = updated;
      saveToStorage(STORAGE_KEYS.ASSESSMENTS, assessments);

      // If status is approved, create a nurse instruction task
      if (reviewData.status === 'approved') {
        const instructions = getFromStorage(STORAGE_KEYS.DOCTOR_INSTRUCTIONS, []);
        const newInst = {
          id: `inst_${Date.now()}`,
          assessment_id: id,
          patient_id: updated.patient_id,
          patient_name: updated.patient_name,
          doctor_id: updated.doctor_id || 'doc1',
          doctor_name: updated.doctor_name || 'Dr. Sarah Johnson',
          urgency: reviewData.followup_urgency || 'Routine',
          window: reviewData.followup_window || 'within 14 days',
          instruction: reviewData.nurse_instruction || 'Please schedule follow-up.',
          status: 'pending',
          created_at: new Date().toISOString()
        };
        instructions.push(newInst);
        saveToStorage(STORAGE_KEYS.DOCTOR_INSTRUCTIONS, instructions);
      }

      return { ok: true, data: updated };
    }
    return { ok: false, error: 'Assessment not found' };
  },

  loginMock: async (payload) => {
    await sleep(500);
    const email = payload.email?.toLowerCase() || "";
    const phone = payload.phone_number || "";

    // 1. Admin Login (Keyword or specific)
    if (email.includes('admin') || email === 'admin@test.com') {
      return {
        ok: true,
        data: {
          access_token: 'mock-token-admin',
          role: 'admin',
          full_name: 'System Administrator',
          email: 'admin@cityhospital.com'
        }
      };
    }

    // 2. Doctor Login (Keyword or specific)
    if (email.includes('doctor') || email === 'doctor1@hospital.com' || phone === '8148282009') {
      return {
        ok: true,
        data: {
          access_token: 'mock-token-doctor',
          role: 'doctor',
          id: 'doc1', // Assign to Dr. Sarah Johnson
          full_name: 'Dr. Sarah Johnson',
          email: 'doctor1@hospital.com',
          first_name: 'Sarah',
          last_name: 'Johnson'
        }
      };
    }

    // 3. Nurse Login (Keyword or specific)
    if (email.includes('nurse') || email === 'nurse1@hospital.com') {
      return {
        ok: true,
        data: {
          access_token: 'mock-token-nurse',
          role: 'nurse',
          full_name: 'Nurse Priya R',
          email: 'nurse1@hospital.com'
        }
      };
    }

    // 4. Patient Login (Keyword or specific)
    if (email.includes('patient') || email === 'rindhiyaa@patient.com' || email === 'patient@test.com') {
      return {
        ok: true,
        data: {
          access_token: 'mock-token-patient',
          role: 'patient',
          full_name: 'Rindhiyaa Sathish',
          email: 'rindhiyaa@patient.com'
        }
      };
    }

    return { ok: false, detail: 'Invalid credentials (Mock)' };
  },

  // Messages
  getMessages: async (userEmail, role) => {
    await sleep(400);
    const messages = getFromStorage(STORAGE_KEYS.MESSAGES, []);
    const patients = getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const patient = patients.find(p => p.email === userEmail);
    const patientId = patient ? patient.id : null;
    
    // If clinician (doctor/nurse/admin), show messages they SENT or received
    if (['doctor', 'nurse', 'admin'].includes(role)) {
      return messages.filter(m => m.sender_email === userEmail || m.receiver_email === userEmail);
    }
    
    // For patients, show messages they RECEIVED (match by email or patient ID)
    return messages.filter(m => 
      m.receiver_email === userEmail || 
      (patientId && m.receiver_id === patientId) ||
      m.patient_id === userEmail ||
      (patientId && m.patient_id === patientId)
    );
  },

  sendMessage: async (senderData, payload) => {
    await sleep(600);
    const messages = getFromStorage(STORAGE_KEYS.MESSAGES, []);
    const patients = getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    
    // Find patient email if not provided
    let receiver_email = payload.receiver_email;
    if (!receiver_email) {
      const patient = patients.find(p => p.id === payload.patient_id || p.email === payload.patient_id);
      if (patient) receiver_email = patient.email;
    }
    
    const newMessage = {
      id: Date.now(),
      sender_id: senderData.id || 'mock-id',
      sender_name: senderData.fullName || 'Care Team',
      sender_email: senderData.email,
      sender_role: senderData.role || 'Clinician',
      receiver_id: payload.patient_id,
      receiver_email: receiver_email,
      patient_id: payload.patient_id, // include for compatibility
      subject: payload.subject,
      content: payload.content,
      type: payload.type || 'general',
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    messages.unshift(newMessage);
    saveToStorage(STORAGE_KEYS.MESSAGES, messages);
    return { ok: true, data: newMessage };
  }
};

// --- ADMIN PORTAL API ---

export const HOSPITAL_NAME = "City Hospital, Coimbatore";
const APP_PREFIX = "ppd_admin_";

export const getUsers = async () => {
  await sleep(400);
  return JSON.parse(localStorage.getItem(`${APP_PREFIX}users`)) || [
    {
      id: 1, name: "Nurse Priya R", email: "priya@cityhospital.com",
      phone: "+91 98765 43210", role: "nurse", ward: "Ward A",
      status: "active", created: "2026-03-15",
    },
    {
      id: 2, name: "Dr. Priya Sharma", email: "priya.doctor@cityhospital.com",
      phone: "+91 87654 32109", role: "doctor", ward: "",
      status: "active", created: "2026-03-10",
    },
    {
      id: 3, name: "Patient Rindhiyaa S", email: "rindhiyaa@patient.com",
      phone: "+91 76543 21098", role: "patient", ward: "OPD",
      status: "active", created: "2026-03-18",
    },
  ];
};

export const addUser = async (user) => {
  await sleep(800);
  const users = await getUsers();
  const newUser = {
    ...user,
    id: Date.now(),
    status: "active",
    created: new Date().toISOString().split("T")[0],
  };
  const updated = [newUser, ...users];
  localStorage.setItem(`${APP_PREFIX}users`, JSON.stringify(updated));
  await addAuditLog(`Created new user: ${user.name} (${user.role})`);
  return newUser;
};

export const updateUser = async (id, data) => {
  await sleep(500);
  let users = await getUsers();
  users = users.map(u => u.id === id ? { ...u, ...data } : u);
  localStorage.setItem(`${APP_PREFIX}users`, JSON.stringify(users));
  await addAuditLog(`Updated user ID: ${id}`);
  return true;
};

export const deleteUser = async (id) => {
  await sleep(500);
  let users = await getUsers();
  users = users.filter(u => u.id !== id);
  localStorage.setItem(`${APP_PREFIX}users`, JSON.stringify(users));
  await addAuditLog(`Deleted user ID: ${id}`);
  return true;
};

// --- AUDIT LOGS ---
export const getAuditLogs = async () => {
  await sleep(300);
  const logs = JSON.parse(localStorage.getItem(`${APP_PREFIX}audit_logs`));
  if (logs) return logs;

  // Seed dummy logs
  const dummyLogs = [
    { id: 101, timestamp: "2026-03-20T10:00:00Z", user: "Admin", action: "User Created", details: "Nurse Priya R created", ip: "192.168.1.10" },
    { id: 102, timestamp: "2026-03-19T14:30:00Z", user: "Dr. Priya Sharma", action: "Assessment Approved", details: "Assessment #123 approved", ip: "192.168.1.12" },
    { id: 103, timestamp: "2026-03-19T09:15:00Z", user: "Patient Rindhiyaa S", action: "Mood Logged", details: "Logged mood: anxious", ip: "10.0.0.5" },
    { id: 104, timestamp: "2026-03-18T16:45:00Z", user: "Admin", action: "Password Reset", details: "Reset password for Dr. Priya", ip: "192.168.1.10" },
  ];
  localStorage.setItem(`${APP_PREFIX}audit_logs`, JSON.stringify(dummyLogs));
  return dummyLogs;
};

export const addAuditLog = async (details, action = "System Action") => {
  const logs = await getAuditLogs();
  const newLog = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    user: "System / Admin",
    action,
    details,
    ip: "127.0.0.1"
  };
  const updated = [newLog, ...logs];
  localStorage.setItem(`${APP_PREFIX}audit_logs`, JSON.stringify(updated));
  return newLog;
};

// --- ANALYTICS DATA --
export const getAdminAnalytics = async () => {
  await sleep(600);
  return {
    accuracyData: [
      { month: 'Oct', accuracy: 82 },
      { month: 'Nov', accuracy: 85 },
      { month: 'Dec', accuracy: 88 },
      { month: 'Jan', accuracy: 89 },
      { month: 'Feb', accuracy: 91 },
      { month: 'Mar', accuracy: 92 },
    ],
    riskDistribution: [
      { name: 'Low Risk', value: 60, color: '#10B981' },
      { name: 'Moderate Risk', value: 30, color: '#F59E0B' },
      { name: 'High Risk', value: 10, color: '#EF4444' },
    ],
    usageStats: [
      { day: 'Mon', assessments: 12 },
      { day: 'Tue', assessments: 19 },
      { day: 'Wed', assessments: 15 },
      { day: 'Thu', assessments: 22 },
      { day: 'Fri', assessments: 28 },
      { day: 'Sat', assessments: 10 },
      { day: 'Sun', assessments: 5 },
    ],
    hospitalStats: {
      name: HOSPITAL_NAME,
      patients: 130,
      clinicians: 24,
      accuracy: 92
    }
  };
};

export const getAvatarColor = (name) => {
  const AVATAR_COLORS = [
    '#0D9488', '#0891B2', '#4F46E5', '#7C3AED', 
    '#C026D3', '#DB2777', '#E11D48', '#EA580C', 
    '#D97706', '#65A30D', '#059669', '#10B981'
  ];
  if (!name) return AVATAR_COLORS[0];
  const charCode = name.charCodeAt(0);
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
};
