import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import "../styles/PatientsPage.css";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: "", age: "", phone: "" });
  const [stats, setStats] = useState({ total: 0, high: 0, moderate: 0, low: 0 });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'alert',
      title: 'Patient Update',
      message: 'New high-risk assessment requires attention',
      time: '5 min ago',
      priority: 'high'
    }
  ]);
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

  const loadPatients = async () => {
    setLoading(true);
    try {
      // 1) Load patients from backend
      const res = await api.get("/patients"); // this is /api/patients on FastAPI
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
  
      // 2) For now, reuse local assessmentHistory to compute stats
      const storedAssessments = localStorage.getItem("assessmentHistory");
      const assessments = storedAssessments ? JSON.parse(storedAssessments) : [];
  
      let high = 0, moderate = 0, low = 0;
  
      // Group assessments by patient_id
      const patientAssessments = {};
      assessments.forEach((assessment) => {
        const key = assessment.patient_id || assessment.patient_name;
        if (!patientAssessments[key]) {
          patientAssessments[key] = [];
        }
        patientAssessments[key].push(assessment);
      });
  
      patientsList.forEach((patient) => {
        const patientAssmts =
          patientAssessments[patient.id] || patientAssessments[patient.name] || [];
        if (patientAssmts.length > 0) {
          const latest = patientAssmts.sort(
            (a, b) =>
              new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
          )[0];
          if (latest?.risk_level === "High Risk") high++;
          else if (latest?.risk_level === "Moderate Risk") moderate++;
          else if (latest?.risk_level === "Low Risk") low++;
        }
      });
  
      setStats({ total: patientsList.length, high, moderate, low });
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
      // Call backend assessments list, filtered by clinician (already done server‑side)
      const res = await api.get("/assessments");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Failed to load history from API:", res.status, body);
        setPatientHistory([]);
        setHistoryLoading(false);
        return;
      }

      const allAssessments = await res.json();

      // Filter for this patient using patient_id (preferred) or name as fallback
      const patientAssessments = allAssessments.filter(
        (assessment) =>
          assessment.patient_id === patient.id ||
          assessment.patient_name === patient.name
      );

      setPatientHistory(patientAssessments);
    } catch (err) {
      console.error("Failed to load history", err);
      setPatientHistory([]);
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
      console.log(`💾 Saved ${patients.length} patients to localStorage`);
    } catch (error) {
      console.error('Failed to save patients to localStorage:', error);
    }
  };



  const createPatient = async () => {
    if (!newPatient.name.trim()) {
      alert("Patient name is required");
      return;
    }

    try {
      // Optional: frontend duplicate check
      const existingPatient = patients.find(
        (p) => p.name.toLowerCase() === newPatient.name.trim().toLowerCase()
      );
      if (existingPatient) {
        alert(`Patient with name "${newPatient.name}" already exists`);
        return;
      }

      // Create patient in backend
      const res = await api.post("/patients", {
        name: newPatient.name.trim(),
        age: newPatient.age ? parseInt(newPatient.age) : null,
        phone: newPatient.phone.trim() || null,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Create patient failed:", res.status, body);
        alert(body?.detail || "Failed to create patient");
        return;
      }

      const created = await res.json(); // has id, clinician_email, created_at from DB

      // Update local state
      setPatients((prev) => [created, ...prev]);
      setShowNewPatient(false);
      setNewPatient({ name: "", age: "", phone: "" });

      console.log(`🆕 Created patient: ${created.name} (ID: ${created.id})`);
    } catch (err) {
      console.error("Failed to create patient", err);
      alert("Failed to create patient. Please try again.");
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
        alert(body?.detail || "Failed to delete patient");
        return;
      }

      // Remove from state
      setPatients((prev) => prev.filter((p) => p.id !== patientId));

      console.log(`🗑️ Deleted patient ID: ${patientId}`);
    } catch (err) {
      console.error("Failed to delete patient", err);
      alert("Failed to delete patient. Please try again.");
    }
  };


  const filteredPatients = patients
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "latest")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "name") return a.name.localeCompare(b.name);
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
            to="/dashboard/new-assessment"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            New Assessment
          </NavLink>
          <NavLink
            to="/dashboard/history"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            History
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
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifications.length > 0 && <span className="dp-notification-badge">{notifications.length}</span>}
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
                    navigate('/dashboard/profile');
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
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="All">All Risk Levels</option>
            <option value="High Risk">High Risk</option>
            <option value="Moderate Risk">Moderate Risk</option>
            <option value="Low Risk">Low Risk</option>
          </select>
          <select className="pp-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A–Z</option>
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
            <button className="dp-export-btn"
              onClick={() => setShowNewPatient(true)}>
              + Add First Patient
            </button>
          </div>
        ) : (
          <div className="pp-table-wrapper">
            <table className="pp-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Phone</th>
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
                          className="pp-action-btn pp-export-btn"
                          onClick={() => navigate(
                            `/dashboard/new-assessment?patient=${encodeURIComponent(patient.name)}&id=${patient.id}`
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
          onClick={() => setShowNewPatient(false)}>
          <div className="pp-modal"
            onClick={(e) => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h2>Add New Patient</h2>
              <button className="pp-modal-close"
                onClick={() => setShowNewPatient(false)}>✕</button>
            </div>
            <div className="pp-modal-body">
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
                onClick={() => setShowNewPatient(false)}>
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
                  <p>📋 No assessments yet for this patient.</p>
                  <button className="dp-export-btn"
                    onClick={() => {
                      setSelectedPatient(null);
                      navigate(
                        `/dashboard/new-assessment?patient=${encodeURIComponent(selectedPatient.name)}&id=${selectedPatient.id}`
                      );
                    }}>
                    + Start First Assessment
                  </button>
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
                      </tr>
                    </thead>
                    <tbody>
                      {patientHistory.map((a) => (
                        <tr key={a.id} className="pp-table-row">
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pp-modal-footer">
              <button className="pp-btn-secondary" onClick={() => setSelectedPatient(null)}>
                Close
              </button>
              <button className="dp-export-btn"
                onClick={() => {
                  setSelectedPatient(null);
                  navigate(
                    `/dashboard/new-assessment?patient=${encodeURIComponent(selectedPatient.name)}&id=${selectedPatient.id}`
                  );
                }}>
                + New Assessment
              </button>
            </div>
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