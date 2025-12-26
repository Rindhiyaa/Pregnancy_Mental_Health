import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/HistoryPage.css";

const HistoryPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // Load from localStorage instead of API
        const savedHistory = localStorage.getItem('assessmentHistory');
        if (savedHistory) {
          const historyData = JSON.parse(savedHistory);
          // Sort by timestamp (newest first)
          const sortedData = historyData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setRows(sortedData);
          setFilteredRows(sortedData);
        } else {
          setRows([]);
          setFilteredRows([]);
        }
      } catch (err) {
        console.error("Failed to load history", err);
        setRows([]);
        setFilteredRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = rows;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(row => 
        row.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by risk level
    if (filterRisk !== "all") {
      filtered = filtered.filter(row => 
        row.risk_level?.toLowerCase() === filterRisk.toLowerCase() ||
        row.clinician_risk?.toLowerCase() === filterRisk.toLowerCase()
      );
    }

    setFilteredRows(filtered);
  }, [searchTerm, filterRisk, rows]);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return 'history-pill-high';
      case 'moderate':
      case 'medium':
        return 'history-pill-medium';
      case 'low':
        return 'history-pill-low';
      default:
        return 'history-pill-unknown';
    }
  };

  const deleteAssessment = (assessmentId) => {
    if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      const updatedHistory = rows.filter(row => row.id !== assessmentId);
      setRows(updatedHistory);
      localStorage.setItem('assessmentHistory', JSON.stringify(updatedHistory));
      
      // Also update user-specific history
      if (user?.email) {
        localStorage.setItem(`assessmentHistory_${user.email}`, JSON.stringify(updatedHistory));
      }
      
      // Show success message
      const deletedAssessment = rows.find(row => row.id === assessmentId);
      alert(`Assessment for ${deletedAssessment?.patient_name} has been deleted successfully.`);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all assessment history? This action cannot be undone.')) {
      localStorage.removeItem('assessmentHistory');
      
      // Also clear user-specific history
      if (user?.email) {
        localStorage.removeItem(`assessmentHistory_${user.email}`);
      }
      
      setRows([]);
      setFilteredRows([]);
    }
  };

  const viewAssessmentDetails = (assessment) => {
    setSelectedAssessment(assessment);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAssessment(null);
  };

  return (
    <div className="dp-root history-root">
      {/* same navbar */}
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
          <button className="dp-logout-btn" onClick={() => {
            logout();
            navigate("/");
          }}>
            Logout
          </button>
        </div>
      </header>

      <main className="history-shell">
        <section className="history-header">
          <div className="history-header-content">
            <div>
              <h1>Assessment History</h1>
              <p>All previous postpartum depression assessments and clinical summaries.</p>
            </div>
            <div className="history-header-actions">
              <button 
                className="new-assessment-btn"
                onClick={() => navigate('/dashboard/new-assessment')}
              >
                + New Assessment
              </button>
              {rows.length > 0 && (
                <button 
                  className="clear-history-btn"
                  onClick={clearHistory}
                >
                  Clear All History
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="history-filters">
          <div className="search-container">
            <div className="search-input-wrapper">
              {/* <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg> */}
              <input
                type="text"
                placeholder="Search by patient name, plan, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="filter-container">
            <label className="filter-label">Filter by Risk:</label>
            <select 
              value={filterRisk} 
              onChange={(e) => setFilterRisk(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          <div className="results-count">
            {filteredRows.length} of {rows.length} assessments
          </div>
        </section>

        <section className="history-card">
          {loading ? (
            <div className="history-loading">
              <div className="loading-spinner"></div>
              <p className="history-muted">Loading assessment history...</p>
            </div>
          ) : (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Assessment Date</th>
                    <th>AI Risk Level</th>
                    <th>Score</th>
                    <th>Clinician Risk</th>
                    <th>Plan</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="history-row">
                      <td className="patient-name">
                        <div className="patient-avatar">
                          {row.patient_name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <span>{row.patient_name || 'Unknown Patient'}</span>
                      </td>
                      <td className="assessment-date">{row.date}</td>
                      <td>
                        <span className={`history-pill ${getRiskColor(row.risk_level)}`}>
                          {row.risk_level || 'Unknown'}
                        </span>
                      </td>
                      <td className="score-cell">
                        <div className="score-display">
                          <span className="score-number">{row.score || 0}</span>
                          <span className="score-total">/100</span>
                        </div>
                      </td>
                      <td>
                        <span className={`history-pill ${getRiskColor(row.clinician_risk)}`}>
                          {row.clinician_risk || 'Not Set'}
                        </span>
                      </td>
                      <td className="plan-cell">
                        <span className="plan-text">{row.plan || 'No plan specified'}</span>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button 
                            className="history-view-btn"
                            onClick={() => viewAssessmentDetails(row)}
                            title="View Details"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button 
                            className="history-delete-btn"
                            onClick={() => deleteAssessment(row.id)}
                            title="Delete Assessment"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredRows.length === 0 && rows.length > 0 && (
                    <tr>
                      <td colSpan="7" className="no-results">
                        <div className="no-results-content">
                          <div className="no-results-icon">🔍</div>
                          <h3>No matching assessments found</h3>
                          <p>Try adjusting your search terms or filters.</p>
                          <button 
                            className="clear-filters-btn"
                            onClick={() => {
                              setSearchTerm("");
                              setFilterRisk("all");
                            }}
                          >
                            Clear Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan="7" className="no-data">
                        <div className="no-data-content">
                          <div className="no-data-icon">📋</div>
                          <h3>No assessments found</h3>
                          <p>Start by creating your first postpartum depression assessment.</p>
                          <button 
                            className="create-first-btn"
                            onClick={() => navigate('/dashboard/new-assessment')}
                          >
                            Create First Assessment
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
      </main>
    </div>
  );
};

export default HistoryPage;
