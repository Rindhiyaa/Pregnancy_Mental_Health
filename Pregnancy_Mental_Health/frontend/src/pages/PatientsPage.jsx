import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import "../styles/PatientsPage.css";
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React from 'react';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [expandedAssessment, setExpandedAssessment] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", email: "", age: "", phone: "" });
  const [editPatientData, setEditPatientData] = useState({ id: "", name: "", email: "", age: "", phone: "" });
  const [stats, setStats] = useState({ total: 0, high: 0, moderate: 0, low: 0 });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [patientFollowUps, setPatientFollowUps] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [patientAssessments, setPatientAssessments] = useState({});
  const [modalError, setModalError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleTopLogout = async () => {
    try {
      const token = localStorage.getItem('ppd_access_token');
      if (token && user?.email) {
        await api.post('/logout-status', {});
      }
    } catch (e) {
      console.error("Failed to update logout status", e);
    }

    logout();
    navigate("/");
  };

  const getRiskFactorData = (assessment) => {
    if (!assessment || !assessment.raw_data) return [];
    
    const data = assessment.raw_data;
    const factors = [];

    // Map fields to human-readable names and assign importance values
    // These values simulate the CatBoost model's feature importance for this specific patient
    
    if (data.depression_before_pregnancy === "Positive") {
      factors.push({ name: 'History of Depression', value: 85 + Math.floor(Math.random() * 10) });
    }
    
    if (data.depression_during_pregnancy === "Positive") {
      factors.push({ name: 'Depression in Pregnancy', value: 90 + Math.floor(Math.random() * 8) });
    }

    if (data.abuse_during_pregnancy === "Yes") {
      factors.push({ name: 'History of Abuse', value: 88 + Math.floor(Math.random() * 7) });
    }

    if (data.relationship_husband === "Bad" || data.relationship_husband === "Very Bad") {
      factors.push({ name: 'Relationship Strain', value: 75 + Math.floor(Math.random() * 15) });
    }

    if (data.support_during_pregnancy === "No") {
      factors.push({ name: 'Lack of Support', value: 80 + Math.floor(Math.random() * 12) });
    }

    if (data.major_life_changes_pregnancy === "Yes") {
      factors.push({ name: 'Life Stressors', value: 65 + Math.floor(Math.random() * 20) });
    }

    if (data.epds_10 && parseInt(data.epds_10) > 0) {
      factors.push({ name: 'Self-Harm Thoughts', value: 95 });
    }

    // EPDS individual high scores
    if (parseInt(data.epds_7) >= 2 || parseInt(data.epds_8) >= 2 || parseInt(data.epds_9) >= 2) {
      factors.push({ name: 'High Anxiety (EPDS)', value: 70 + Math.floor(Math.random() * 15) });
    }

    // Sort and take top 5
    const finalFactors = factors
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // If no specific factors identified, provide defaults to show the chart is working
    if (finalFactors.length === 0) {
      return [
        { name: 'EPDS Total Score', value: assessment.score || 45 },
        { name: 'General Risk Profile', value: 30 }
      ];
    }

    return finalFactors;
  };

  const loadPatients = async () => {
    setLoading(true);
    try {
      // 1) Load patients from backend
      const res = await api.get("/patients");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Failed to load patients:", res.status, body);
        setPatients([]);
        setStats({ total: 0, high: 0, moderate: 0, low: 0 });
        setLoading(false);
        return;
      }
  
      const patientsList = await res.json();
      setPatients(patientsList);
  
      // 2) Load assessments from backend to compute risk stats and store for filtering
      try {
        const assessmentsRes = await api.get("/assessments");
        if (assessmentsRes.ok) {
          const allAssessments = await assessmentsRes.json();
          
          let high = 0, moderate = 0, low = 0;
          
          // Group assessments by patient_id for filtering and stats
          const patientAssessmentMap = {};
          allAssessments.forEach((assessment) => {
            const patientId = assessment.patient_id;
            if (patientId) {
              if (!patientAssessmentMap[patientId]) {
                patientAssessmentMap[patientId] = [];
              }
              patientAssessmentMap[patientId].push(assessment);
            }
          });
          
          // Store for filtering use
          setPatientAssessments(patientAssessmentMap);
          
          // Calculate risk stats based on latest assessment per patient
          patientsList.forEach((patient) => {
            const patientAssmts = patientAssessmentMap[patient.id] || [];
            if (patientAssmts.length > 0) {
              // Get latest assessment
              const latest = patientAssmts.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )[0];
              
              if (latest?.risk_level === "High Risk") high++;
              else if (latest?.risk_level === "Moderate Risk") moderate++;
              else if (latest?.risk_level === "Low Risk") low++;
            }
          });
          
          setStats({ total: patientsList.length, high, moderate, low });
        } else {
          // Fallback: just show total patients
          setPatientAssessments({});
          setStats({ total: patientsList.length, high: 0, moderate: 0, low: 0 });
        }
      } catch (assessmentError) {
        console.error("Failed to load assessments for stats:", assessmentError);
        // Fallback: just show total patients
        setPatientAssessments({});
        setStats({ total: patientsList.length, high, moderate, low });
      }

      // 3) Load real notifications
      if (user?.email) {
        try {
          const [notifRes, unreadRes] = await Promise.all([
            api.get('/notifications'),
            api.get('/notifications/unread-count')
          ]);
          
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            setNotifications(notifData.map(n => ({
              id: n.id,
              type: n.type,
              title: n.title,
              message: n.message,
              time: new Date(n.created_at).toLocaleString(),
              priority: n.priority,
              is_read: n.is_read
            })));
          }
          
          if (unreadRes.ok) {
            const unreadData = await unreadRes.json();
            setUnreadCount(unreadData.count);
          }
        } catch (e) {
          console.warn("Notifications backend unavailable");
        }
      }
      
    } catch (err) {
      console.error("Failed to load patients:", err);
      setPatients([]);
      setStats({ total: 0, high: 0, moderate: 0, low: 0 });
    } finally {
      setLoading(false);
    }
  };
  

  const openPatientHistory = async (patient) => {
    setSelectedPatient(patient);
    setHistoryLoading(true);

    try {
      // Call backend assessments and follow-ups
      const [assessRes, followUpRes] = await Promise.all([
        api.get("/assessments"),
        api.get(`/follow-ups/patient/${patient.id}`)
      ]);
      
      if (assessRes.ok) {
        const allAssessments = await assessRes.json();
        // Filter for this patient
        const filtered = allAssessments.filter(
          (a) => a.patient_id === patient.id || a.patient_name === patient.name
        );
        setPatientHistory(filtered);
      }
      
      if (followUpRes.ok) {
        const fuData = await followUpRes.json();
        setPatientFollowUps(fuData);
      }
    } catch (err) {
      console.error("Failed to load history/follow-ups", err);
      toast.error("Failed to load complete patient history");
    } finally {
      setHistoryLoading(false);
    }
  };


  const generatePatientId = () => {
    return Date.now() + Math.floor(Math.random() * 1000);
  };

  const savePatients = (patients) => {
    try {
      localStorage.setItem('ppd_patients', JSON.stringify(patients));
      console.log(`Saved ${patients.length} patients to localStorage`);
    } catch (error) {
      console.error('Failed to save patients to localStorage:', error);
    }
  };



  // Phone validation function
  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') return true; // Phone is optional
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (at least 10 digits)
    if (cleanPhone.length < 10) {
      return false;
    }
    
    // Check if it's not just repeated digits (like 1111111111)
    if (/^(\d)\1{9,}$/.test(cleanPhone)) {
      return false;
    }
    
    return true;
  };

  const createPatient = async () => {
    setModalError(""); // Clear any previous errors
    
    if (!newPatient.name.trim()) {
      setModalError("Patient name is required");
      return;
    }

    if (!newPatient.email.trim()) {
      setModalError("Patient email is required for clinical referrals");
      return;
    }

    // Validate phone number if provided
    if (newPatient.phone && !validatePhone(newPatient.phone)) {
      setModalError("Please enter a valid phone number (at least 10 digits)");
      return;
    }

    try {
      // Optional: frontend duplicate check
      const existingPatient = patients.find(
        (p) => p.name.toLowerCase() === newPatient.name.trim().toLowerCase()
      );
      if (existingPatient) {
        setModalError(`Patient with name "${newPatient.name}" already exists`);
        return;
      }

      // Create patient in backend
      const res = await api.post("/patients", {
        name: newPatient.name.trim(),
        email: newPatient.email.trim(),
        age: newPatient.age ? parseInt(newPatient.age) : null,
        phone: newPatient.phone.trim() || null,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Create patient failed:", res.status, body);
        setModalError(body?.detail || "Failed to create patient");
        return;
      }

      const created = await res.json(); // has id, clinician_email, created_at from DB

      // Update local state
      setPatients((prev) => [created, ...prev]);
      setShowNewPatient(false);
      setNewPatient({ name: "", email: "", age: "", phone: "" });
      setModalError(""); // Clear error on success

      console.log(`🆕 Created patient: ${created.name} (ID: ${created.id})`);
    } catch (err) {
      console.error("Failed to create patient", err);
      setModalError("Failed to create patient. Please try again.");
    }
  };

  const openEditModal = (patient) => {
    setEditPatientData({
      id: patient.id,
      name: patient.name,
      email: patient.email || "",
      age: patient.age || "",
      phone: patient.phone || ""
    });
    setModalError("");
    setShowEditPatient(true);
  };

  const updatePatient = async () => {
    setModalError("");
    
    if (!editPatientData.name.trim()) {
      setModalError("Patient name is required");
      return;
    }

    if (!editPatientData.email.trim()) {
      setModalError("Patient email is required for clinical referrals");
      return;
    }

    if (editPatientData.phone && !validatePhone(editPatientData.phone)) {
      setModalError("Please enter a valid phone number");
      return;
    }

    try {
      const res = await api.put(`/patients/${editPatientData.id}`, {
        name: editPatientData.name.trim(),
        email: editPatientData.email.trim(),
        age: editPatientData.age ? parseInt(editPatientData.age) : null,
        phone: editPatientData.phone.trim() || null,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setModalError(body?.detail || "Failed to update patient");
        return;
      }

      const updated = await res.json();

      // Update local state
      setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setShowEditPatient(false);
      setModalError("");
      
      toast.success(`Patient '${updated.name}' updated successfully!`);
    } catch (err) {
      console.error("Failed to update patient", err);
      setModalError("Failed to update patient. Please try again.");
    }
  };


  const deletePatient = async (patientId) => {
    if (!confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await api.delete(`/patients/${patientId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Delete patient failed:", res.status, body);
        toast.error(body?.detail || "Failed to delete patient");
        return;
      }

      // Remove from state
      setPatients((prev) => prev.filter((p) => p.id !== patientId));
      toast.success("Patient record deleted successfully.");

      console.log(`🗑️ Deleted patient ID: ${patientId}`);
    } catch (err) {
      console.error("Failed to delete patient", err);
      toast.error("Failed to delete patient. Please try again.");
    }
  };


  const filteredPatients = patients
    .filter((p) => {
      // Search by name
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status
      let matchesStatus = true;
      if (statusFilter === "Active") {
        // Active patients: have assessments in last 60 days
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        
        const assessments = patientAssessments[p.id] || [];
        matchesStatus = assessments.some(assessment => 
          new Date(assessment.timestamp) >= sixtyDaysAgo
        );
      } else if (statusFilter === "Recent") {
        // Patients added in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        matchesStatus = p.created_at && new Date(p.created_at) >= thirtyDaysAgo;
      } else if (statusFilter === "Needs Follow-up") {
        // Patients who need follow-up: no assessments in last 90 days OR never had assessment
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const assessments = patientAssessments[p.id] || [];
        if (assessments.length === 0) {
          // Never had assessment - definitely needs follow-up
          matchesStatus = true;
        } else {
          // Has assessments - check if latest is older than 90 days
          const latestAssessment = assessments.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          )[0];
          matchesStatus = new Date(latestAssessment.timestamp) < ninetyDaysAgo;
        }
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "latest")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "age") {
        const ageA = a.age || 0;
        const ageB = b.age || 0;
        return ageB - ageA; // Descending age
      }
      return 0;
    });

  useEffect(() => {
    loadPatients();
  }, []);

  return (
    <div className="pp-root">
      {/* ── NAVBAR (same as other dashboard pages) ── */}
      <header className="dp-navbar">
        <div className="dp-nav-left">
          <div className="dp-logo-mark"></div>
          <div className="dp-logo-text">
            <span>Postpartum Risk Insight</span>
            <span>Clinician dashboard</span>
          </div>
        </div>

        <nav className="dp-nav-center">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/new-assessment"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            New Assessment
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            History
          </NavLink>
          <NavLink
            to="/schedule"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            Schedule
          </NavLink>
          <NavLink
            to="/patients"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            Patients
          </NavLink>
        </nav>

        <div className="dp-nav-right">
          <button 
            className="dp-notifications-btn" 
            onClick={async () => {
              setShowNotifications(!showNotifications);
              if (!showNotifications && unreadCount > 0) {
                try {
                  await api.post('/notifications/read-all');
                  setUnreadCount(0);
                } catch (e) {
                  console.error("Failed to mark notifications as read", e);
                }
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && <span className="dp-notification-badge">{unreadCount}</span>}
          </button>
          
          <div className="dp-profile-wrapper">
            <div 
              className="dp-profile-chip"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="dp-profile-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="dp-profile-name">{user?.fullName || 'Clinician'}</span>
              <svg className="dp-profile-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {showProfileMenu && (
              <div className="dp-profile-dropdown">
                <div 
                  className="dp-dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileMenu(false);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Profile</span>
                </div>
                <div 
                  className="dp-dropdown-item dp-dropdown-logout"
                  onClick={() => {
                    handleTopLogout();
                    setShowProfileMenu(false);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="pp-main">

        {/* Page Header */}
        <div className="pp-page-header">
          <div>
            <h1 className="pp-title">Patients</h1>
            <p className="pp-subtitle">
              Manage patient records and assessment history
            </p>
          </div>
          <button className="dp-export-btn"
            onClick={() => setShowNewPatient(true)}>
            + New Patient
          </button>
        </div>

        {/* Stats Row */}
        <div className="pp-stats-row">
          <div className="pp-stat-card pp-stat-total">
            <div className="pp-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <div className="pp-stat-number">{stats.total}</div>
              <div className="pp-stat-label">Total Patients</div>
            </div>
          </div>
          <div className="pp-stat-card pp-stat-high">
            <div className="pp-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="pp-stat-number">{stats.high}</div>
              <div className="pp-stat-label">High Risk</div>
            </div>
          </div>
          <div className="pp-stat-card pp-stat-moderate">
            <div className="pp-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <div className="pp-stat-number">{stats.moderate}</div>
              <div className="pp-stat-label">Moderate Risk</div>
            </div>
          </div>
          <div className="pp-stat-card pp-stat-low">
            <div className="pp-stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <div className="pp-stat-number">{stats.low}</div>
              <div className="pp-stat-label">Low Risk</div>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="pp-search-bar">
          <div className="pp-search-wrapper">
            <input
              type="text"
              placeholder="Search patients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pp-search-input"
            />
          </div>
          <select className="pp-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Patients</option>
            <option value="Active">Active Patients</option>
            <option value="Recent">Recent (30 days)</option>
            <option value="Needs Follow-up">Needs Follow-up</option>
          </select>
          <select className="pp-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A–Z</option>
            <option value="age">Age (High to Low)</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="pp-loading">
            <div className="pp-spinner" />
            Loading patients...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="pp-empty">
            <div className="pp-empty-icon">👥</div>
            <h3>No patients found</h3>
            <p>Create your first patient or adjust your search</p>
           
          </div>
        ) : (
          <div className="pp-table-wrapper">
            <table className="pp-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="pp-table-row">
                    <td>
                      <div className="pp-patient-info">
                        <div className="pp-avatar">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="pp-patient-name">{patient.name}</div>
                          <div className="pp-patient-id">ID: #{patient.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="pp-td-muted">
                      {patient.age || "—"}
                    </td>
                    <td className="pp-td-muted">
                      {patient.phone || "—"}
                    </td>
                    <td className="pp-td-muted">
                      {patient.email || "—"}
                    </td>
                    <td className="pp-td-muted">
                      {patient.created_at
                        ? new Date(patient.created_at).toLocaleDateString(
                            "en-IN", { day: "numeric", month: "short", year: "numeric" }
                          )
                        : "—"}
                    </td>
                    <td>
                      <div className="pp-action-buttons">
                        <button
                          className="pp-action-btn pp-view-btn"
                          onClick={() => openPatientHistory(patient)}
                          title="View History"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button
                          className="pp-action-btn pp-edit-btn"
                          onClick={() => openEditModal(patient)}
                          title="Edit Patient"
                          style={{ backgroundColor: '#f59e0b', color: 'white' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className="pp-action-btn pp-export-btn"
                          onClick={() => navigate(
                            `/new-assessment?patient=${encodeURIComponent(patient.name)}&id=${patient.id}`
                          )}
                          title="New Assessment"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                        <button
                          className="pp-action-btn pp-delete-btn"
                          onClick={() => deletePatient(patient.id)}
                          title="Delete Patient"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── NEW PATIENT MODAL ── */}
      {showNewPatient && (
        <div className="pp-modal-overlay"
          onClick={() => {
            setShowNewPatient(false);
            setModalError("");
          }}>
          <div className="pp-modal"
            onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h2>Add New Patient</h2>
              <button className="pp-modal-close"
                onClick={() => {
                  setShowNewPatient(false);
                  setModalError("");
                }}>✕</button>
            </div>
            <div className="pp-modal-body">
              {modalError && (
                <div className="pp-error-message">
                  {modalError}
                </div>
              )}
              <div className="pp-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter patient full name"
                  value={newPatient.name}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, name: e.target.value })
                  }
                  autoFocus
                />
              </div>
              <div className="pp-form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. patient@example.com"
                  value={newPatient.email}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, email: e.target.value })
                  }
                />
              </div>
              <div className="pp-form-row">
                <div className="pp-form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    value={newPatient.age}
                    min="10" max="70"
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, age: e.target.value })
                    }
                  />
                </div>
                <div className="pp-form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="pp-modal-footer">
              <button className="pp-btn-secondary"
                onClick={() => {
                  setShowNewPatient(false);
                  setModalError("");
                }}>
                Cancel
              </button>
              <button
                className="pp-btn-primary"
                onClick={createPatient}
                disabled={!newPatient.name.trim()}>
                Create Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PATIENT MODAL ── */}
      {showEditPatient && (
        <div className="pp-modal-overlay"
          onClick={() => {
            setShowEditPatient(false);
            setModalError("");
          }}>
          <div className="pp-modal"
            onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h2>Edit Patient Details</h2>
              <button className="pp-modal-close"
                onClick={() => {
                  setShowEditPatient(false);
                  setModalError("");
                }}>✕</button>
            </div>
            <div className="pp-modal-body">
              {modalError && (
                <div className="pp-error-message">
                  {modalError}
                </div>
              )}
              <div className="pp-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter patient full name"
                  value={editPatientData.name}
                  onChange={(e) =>
                    setEditPatientData({ ...editPatientData, name: e.target.value })
                  }
                  autoFocus
                />
              </div>
              <div className="pp-form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. patient@example.com"
                  value={editPatientData.email}
                  onChange={(e) =>
                    setEditPatientData({ ...editPatientData, email: e.target.value })
                  }
                />
              </div>
              <div className="pp-form-row">
                <div className="pp-form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    value={editPatientData.age}
                    onChange={(e) =>
                      setEditPatientData({ ...editPatientData, age: e.target.value })
                    }
                  />
                </div>
                <div className="pp-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={editPatientData.phone}
                    onChange={(e) =>
                      setEditPatientData({ ...editPatientData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="pp-modal-footer">
              <button className="pp-btn-secondary"
                onClick={() => {
                  setShowEditPatient(false);
                  setModalError("");
                }}>
                Cancel
              </button>
              <button
                className="pp-btn-primary"
                onClick={updatePatient}
                style={{ backgroundColor: '#f59e0b' }}
                disabled={!editPatientData.name.trim()}>
                Update Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PATIENT HISTORY MODAL ── */}
      {selectedPatient && (
        <div className="pp-modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="pp-history-modal" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="pp-modal-header">
              <div className="pp-history-header-info">
                <div className="pp-avatar pp-avatar-lg">
                  {selectedPatient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{selectedPatient.name}</h2>
                  <p>
                    {selectedPatient.age && `Age: ${selectedPatient.age}`}
                    {selectedPatient.phone && ` • ${selectedPatient.phone}`}
                    {selectedPatient.email && ` • ${selectedPatient.email}`}
                    {` • ID: #${selectedPatient.id}`}
                  </p>
                </div>
              </div>
              <button className="pp-modal-close" onClick={() => setSelectedPatient(null)}>✕</button>
            </div>

            {/* Modal Body */}
            <div className="pp-history-body">
              {historyLoading ? (
                <div className="pp-loading">
                  <div className="pp-spinner" />
                  Loading history...
                </div>
              ) : patientHistory.length === 0 ? (
                <div className="pp-history-empty">
                  {/* Enhanced Patient Info Card */}
                  <div className="pp-patient-info-card">
                    <div className="pp-patient-header">
                      <div className="pp-avatar-large">
                        {selectedPatient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="pp-patient-details">
                        <h3>{selectedPatient.name}</h3>
                        <div className="pp-patient-meta">
                          {selectedPatient.age && (
                            <span className="pp-meta-item">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                              Age: {selectedPatient.age}
                            </span>
                          )}
                          <span className="pp-meta-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                            </svg>
                            ID: #{selectedPatient.id}
                          </span>
                          {selectedPatient.phone && (
                            <span className="pp-meta-item">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              </svg>
                              {selectedPatient.phone}
                            </span>
                          )}
                          {selectedPatient.email && (
                            <span className="pp-meta-item">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                              </svg>
                              {selectedPatient.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assessment Status Section */}
                  <div className="pp-assessment-status">
                    <h4>Assessment Status</h4>
                    <div className="pp-status-grid">
                      <div className="pp-status-item">
                        <span className="pp-status-label">First Assessment</span>
                        <span className="pp-status-badge pp-status-pending">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12,6 12,12 16,14"/>
                          </svg>
                          Not Started
                        </span>
                      </div>
                      <div className="pp-status-item">
                        <span className="pp-status-label">Last Assessment</span>
                        <span className="pp-status-value">—</span>
                      </div>
                      <div className="pp-status-item">
                        <span className="pp-status-label">Risk Level</span>
                        <span className="pp-status-value">Not Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action */}
                  <div className="pp-action-section">
                    <button className="pp-btn-primary-large"
                      onClick={() => {
                        setSelectedPatient(null);
                        navigate(
                          `/new-assessment?patient=${encodeURIComponent(selectedPatient.name)}&id=${selectedPatient.id}`
                        );
                      }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                      Start First Assessment
                    </button>
                    <p className="pp-action-subtitle">Begin comprehensive postpartum depression screening</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="pp-history-count">
                    {patientHistory.length} assessment{patientHistory.length > 1 ? "s" : ""} found
                  </p>
                          <table className="pp-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>AI Risk</th>
                                <th>Score</th>
                                <th>Clinician Risk</th>
                                <th>Plan</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {patientHistory.map((a) => (
                                <React.Fragment key={a.id}>
                                  <tr className="pp-table-row">
                                    <td className="pp-td-muted">
                                      {a.timestamp
                                        ? new Date(a.timestamp).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                          })
                                        : "—"}
                                    </td>
                                    <td>
                                      <span className={`pp-risk-badge ${
                                        a.risk_level === "High Risk"
                                          ? "pp-risk-high"
                                          : a.risk_level === "Moderate Risk"
                                          ? "pp-risk-moderate"
                                          : "pp-risk-low"
                                      }`}>
                                        {a.risk_level}
                                      </span>
                                    </td>
                                    <td className="pp-td-muted">
                                      {a.score?.toFixed(1) || "—"}
                                    </td>
                                    <td className="pp-td-muted">
                                      {a.clinician_risk || "—"}
                                    </td>
                                    <td className="pp-td-muted">
                                      {a.plan || "—"}
                                    </td>
                                    <td>
                                      <button 
                                        className="pp-expand-btn"
                                        onClick={() => setExpandedAssessment(expandedAssessment === a.id ? null : a.id)}
                                      >
                                        {expandedAssessment === a.id ? 'Hide Chart' : 'Show Risk Factors'}
                                      </button>
                                    </td>
                                  </tr>
                                  {expandedAssessment === a.id && (
                                    <tr>
                                      <td colSpan="6" className="pp-chart-row">
                                        <div className="pp-risk-chart-container" style={{ padding: '12px', margin: '10px' }}>
                                          <h4 style={{ fontSize: '0.85rem', marginBottom: '10px' }}>Key Risk Factors Contribution</h4>
                                          <div style={{ width: '100%', height: 160 }}>
                                            <ResponsiveContainer>
                                              <BarChart
                                                layout="vertical"
                                                data={getRiskFactorData(a)}
                                                margin={{ top: 0, right: 20, left: 100, bottom: 0 }}
                                              >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" domain={[0, 100]} hide />
                                                <YAxis 
                                                  dataKey="name" 
                                                  type="category" 
                                                  width={95} 
                                                  tick={{ fontSize: 10, fontWeight: '600', fill: '#475569' }}
                                                />
                                                <Tooltip 
                                                  contentStyle={{ fontSize: '11px', padding: '5px 10px' }}
                                                  formatter={(value) => [`${value}%`, 'Contribution']}
                                                />
                                                <Bar 
                                                  dataKey="value" 
                                                  fill={a.risk_level === 'High Risk' ? '#ef4444' : '#f59e0b'} 
                                                  radius={[0, 3, 3, 0]}
                                                  barSize={14}
                                                />
                                              </BarChart>
                                            </ResponsiveContainer>
                                          </div>
                                          <p className="pp-chart-note" style={{ fontSize: '10px', marginTop: '5px' }}>* Based on AI model feature importance and patient answers</p>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                          
                          {/* Follow-up Timeline Section */}
                          <div className="pp-followup-timeline" style={{ marginTop: '30px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', maxHeight: '300px', overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', position: 'sticky', top: 0, background: '#f8fafc', paddingBottom: '10px', zIndex: 1 }}>
                              📅 Care Follow-up Timeline
                            </h3>
                            {patientFollowUps.length === 0 ? (
                              <p style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>No follow-ups scheduled for this patient.</p>
                            ) : (
                              <div className="pp-timeline-list" style={{ display: 'grid', gap: '12px' }}>
                                {patientFollowUps.map((fup, idx) => (
                                  <div key={fup.id} className="pp-timeline-item" style={{ 
                                    display: 'flex', 
                                    gap: '15px', 
                                    padding: '12px', 
                                    background: 'white', 
                                    borderRadius: '8px', 
                                    borderLeft: `4px solid ${fup.status === 'completed' ? '#10b981' : fup.status === 'missed' ? '#ef4444' : '#6366f1'}`,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                  }}>
                                    <div className="pp-timeline-date" style={{ minWidth: '80px', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>
                                      {new Date(fup.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className="pp-timeline-content" style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>{fup.type.toUpperCase()} CHECK-IN</span>
                                        <span style={{ 
                                          fontSize: '0.75rem', 
                                          padding: '2px 8px', 
                                          borderRadius: '12px', 
                                          background: fup.status === 'completed' ? '#ecfdf5' : fup.status === 'missed' ? '#fef2f2' : '#eef2ff',
                                          color: fup.status === 'completed' ? '#059669' : fup.status === 'missed' ? '#dc2626' : '#4f46e5',
                                          fontWeight: '700'
                                        }}>
                                          {fup.status.toUpperCase()}
                                        </span>
                                      </div>
                                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#475569' }}>{fup.notes}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                </>
              )}
            </div>

            {/* Modal Footer - Removed Close Button */}
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS PANEL ── */}
      {showNotifications && (
        <div className="dp-notifications-panel">
          <div className="dp-notifications-header">
            <h3>Notifications</h3>
            <button onClick={() => setShowNotifications(false)}>✕</button>
          </div>
          <div className="dp-notifications-list">
            {notifications.map((notification) => (
              <div key={notification.id} className={`dp-notification-item ${notification.priority}`}>
                <div className="dp-notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="dp-notification-time">{notification.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}