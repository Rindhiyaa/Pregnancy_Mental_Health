import { useEffect, useState } from "react";
import "../styles/DashboardPage.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    low: 0,
    today: 0,
  });

  const [loading, setLoading] = useState(true);

  // fetch data from localStorage (same as History page)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
    
        let historyData = [];
    
        // 1) try backend
        if (user?.email) {
          try {
            const res = await fetch(
              `http://127.0.0.1:8000/api/assessments?clinician_email=${encodeURIComponent(
                user.email
              )}`
            );
            if (res.ok) {
              historyData = await res.json();
              // mirror to localStorage cache
              localStorage.setItem(
                "assessmentHistory",
                JSON.stringify(historyData)
              );
              localStorage.setItem(
                `assessmentHistory_${user.email}`,
                JSON.stringify(historyData)
              );
            }
          } catch (e) {
            console.warn("Backend unavailable, using localStorage cache instead");
          }
        }
    
        // 2) if no backend data, use localStorage
        if (!historyData.length) {
          const savedHistory = localStorage.getItem("assessmentHistory");
          historyData = savedHistory ? JSON.parse(savedHistory) : [];
        }
    
        // your existing sorting + transformedRows + stats logic, but using historyData
        const sortedData = historyData.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        const recentAssessments = sortedData.slice(0, 10);
    
        const transformedRows = recentAssessments.map((assessment) => {
          const aiLevel = assessment.risk_level?.toLowerCase();
          let clinicianLevel = assessment.clinician_risk?.toLowerCase();
          if (clinicianLevel === "medium") clinicianLevel = "moderate";
          const level = clinicianLevel || aiLevel;
    
          let risk = "low";
          if (level === "high") risk = "high";
          else if (level === "moderate") risk = "moderate";
    
          return {
            id: assessment.patient_name || "Unknown",
            name: assessment.patient_name || "Unknown Patient",
            date:
              assessment.date ||
              new Date(assessment.timestamp).toLocaleDateString(),
            risk,
          };
        });
    
        const totalAssessments = historyData.length;
        const highRiskCount = historyData.filter((a) => {
          const l1 = a.risk_level?.toLowerCase();
          let l2 = a.clinician_risk?.toLowerCase();
          if (l2 === "medium") l2 = "moderate";
          return l1 === "high" || l2 === "high";
        }).length;
        const moderateRiskCount = historyData.filter((a) => {
          const l1 = a.risk_level?.toLowerCase();
          let l2 = a.clinician_risk?.toLowerCase();
          if (l2 === "medium") l2 = "moderate";
          return l1 === "moderate" || l2 === "moderate";
        }).length;
        const lowRiskCount = historyData.filter((a) => {
          const l1 = a.risk_level?.toLowerCase();
          const l2 = a.clinician_risk?.toLowerCase();
          return l1 === "low" || l2 === "low";
        }).length;
    
        const today = new Date().toDateString();
        const todayCount = historyData.filter((a) => {
          const assessmentDate = new Date(a.timestamp || a.date).toDateString();
          return assessmentDate === today;
        }).length;
    
        setRows(transformedRows);
        setStats({
          total: totalAssessments,
          high: highRiskCount,
          low: lowRiskCount,
          moderate: moderateRiskCount,
          today: todayCount,
        });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setRows([]);
        setStats({ total: 0, high: 0, low: 0, today: 0 });
      } finally {
        setLoading(false);
      }
    };
    

    fetchData();
  }, []);

  const filteredRows = rows.filter((row) => {
    const s = search.toLowerCase();
    const matchesSearch =
      (row.id && row.id.toLowerCase().includes(s)) ||
      (row.name && row.name.toLowerCase().includes(s));

      const matchesRisk =
        riskFilter === "all" ? true : row.risk === riskFilter;
    

    return matchesSearch && matchesRisk;
  });

  // Modal functions
  const viewAssessmentDetails = (assessment) => {
    // Find the full assessment data from localStorage
    const savedHistory = localStorage.getItem('assessmentHistory');
    if (savedHistory) {
      const historyData = JSON.parse(savedHistory);
      const fullAssessment = historyData.find(a => a.patient_name === assessment.name);
      if (fullAssessment) {
        setSelectedAssessment(fullAssessment);
        setShowModal(true);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAssessment(null);
  };

  return (
    <div className="dp-root">
      {/* NAVBAR */}
      {/* NAVBAR */}
<header className="dp-navbar">
  <div className="dp-nav-left">
    <div className="dp-logo-mark">PR</div>
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
      to="/dashboard/History"
      className={({ isActive }) =>
        "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
      }
    >
      History
    </NavLink>

    <NavLink
      to="/dashboard/Profile"
      className={({ isActive }) =>
        "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
      }
    >
      Profile
    </NavLink>
  </nav>

  <div className="dp-nav-right">
    <div className="dp-profile-chip">
      <div className="dp-profile-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <span className="dp-profile-name">{user?.fullName || 'Clinician'}</span>
    </div>

    <button
      className="dp-logout-btn"
      onClick={() => {
        logout();
        navigate("/");
      }}
    >
      Logout
    </button>
  </div>
</header>


      {/* MAIN */}
      <main className="dp-shell">
        {/* header + stats */}
        <section className="dp-header">
          <h1>Clinician Dashboard</h1>
          <p>Overview of assessments and risk levels.</p>

          <div className="dp-stats-row">
            <div className="dp-stat-card">
              <span className="dp-stat-label">Total Assessments</span>
              <div className="dp-stat-bottom">
                <span className="dp-stat-value">{stats.total}</span>
                <div className="dp-stat-icon dp-ic-blue">📋</div>
              </div>
            </div>

            <div className="dp-stat-card">
              <span className="dp-stat-label">High-Risk Cases</span>
              <div className="dp-stat-bottom">
                <span className="dp-stat-value">{stats.high}</span>
                <div className="dp-stat-icon dp-ic-red">⚠️</div>
              </div>
            </div>

            <div className="dp-stat-card">
              <span className="dp-stat-label">Low-Risk Cases</span>
              <div className="dp-stat-bottom">
                <span className="dp-stat-value">{stats.low}</span>
                <div className="dp-stat-icon dp-ic-green">✅</div>
              </div>
            </div>

            <div className="dp-stat-card">
              <span className="dp-stat-label">Today&apos;s Assessments</span>
              <div className="dp-stat-bottom">
                <span className="dp-stat-value">{stats.today}</span>
                <div className="dp-stat-icon dp-ic-purple">📆</div>
              </div>
            </div>
          </div>
        </section>

        {/* bottom */}
        <section className="dp-bottom-row">
          {/* Recent assessments */}
          <div className="dp-card">
            <div className="dp-card-header">
              <span className="dp-card-title">Recent Assessments</span>
              <div className="dp-search-row">
                <input
                  className="dp-search-input"
                  placeholder="Search by Patient ID or name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="dp-filter-select"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="high">High risk</option>
                  <option value="low">Low risk</option>
                  <option value="moderate">Moderate risk</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p className="dp-muted">Loading assessments…</p>
            ) : (
              <table className="dp-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Risk Level</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="dp-row">
                      <td>
                        <span className="dp-patient-id">{row.id}</span>
                        <span className="dp-patient-name">
                          {row.name ? " • " + row.name : ""}
                        </span>
                      </td>
                      <td>{row.date}</td>
                      <td>
                      <span
                        className={
                          "dp-pill " +
                          (row.risk === "high"
                            ? "dp-pill-high"
                            : row.risk === "moderate"
                            ? "dp-pill-moderate"
                            : "dp-pill-low")
                        }
                      >
                        {row.risk === "high"
                          ? "High"
                          : row.risk === "moderate"
                          ? "Moderate"
                          : "Low"}
                      </span>
                      </td>
                      <td>
                        <button 
                          className="dp-view-btn"
                          onClick={() => viewAssessmentDetails(row)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loading && filteredRows.length === 0 && (
                    <tr>
                      <td colSpan="4" className="dp-muted">
                        No assessments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick actions */}
         {/* Quick actions */}
<div className="dp-card dp-quick">
  <div className="dp-card-title">Quick Actions</div>

  <div className="dp-quick-inner">
    <div className="dp-qa-buttons">
      <button 
        className="dp-qa-primary"
        onClick={() => navigate('/dashboard/new-assessment')}
      >
        Start New Assessment
      </button>
      <button 
        className="dp-qa-secondary"
        onClick={() => navigate('/dashboard/History')}
      >
        View Full History
      </button>
    </div>

    <div className="dp-info-card">
      Use this tool to support, not replace, clinical judgment.
    </div>
  </div>
</div>


        </section>
      </main>

      {/* Assessment Details Modal */}
      {showModal && selectedAssessment && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assessment Details</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="assessment-detail-grid">
                <div className="detail-section">
                  <h3>Patient Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Patient Name:</span>
                    <span className="detail-value">{selectedAssessment.patient_name || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assessment Date:</span>
                    <span className="detail-value">{selectedAssessment.date}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Risk Assessment</h3>
                  <div className="detail-item">
                    <span className="detail-label">AI Risk Level:</span>
                    <span className={`detail-pill pill-${selectedAssessment.risk_level?.toLowerCase()}`}>
                      {selectedAssessment.risk_level || 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">AI Score:</span>
                    <span className="detail-score">{selectedAssessment.score || 0}/100</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Clinician Risk:</span>
                    <span className={`detail-pill pill-${selectedAssessment.clinician_risk?.toLowerCase()}`}>
                      {selectedAssessment.clinician_risk || 'Not Set'}
                    </span>
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h3>Treatment Plan</h3>
                  <div className="detail-notes">
                    {selectedAssessment.plan || 'No treatment plan specified'}
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h3>Clinical Notes</h3>
                  <div className="detail-notes">
                    {selectedAssessment.notes || 'No additional notes provided'}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;