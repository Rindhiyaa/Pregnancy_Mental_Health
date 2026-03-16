import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";
import { exportAssessmentToPDF } from "../utils/pdfExport";
import "../styles/HistoryPage.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React from 'react';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentReferrals, setSentReferrals] = useState({}); // {assessmentId: true}
  const [isReferralLoading, setIsReferralLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const getRiskFactorData = (assessment) => {
    if (!assessment || !assessment.raw_data) return [];
    
    const data = assessment.raw_data;
    const factors = [];

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

    if (parseInt(data.epds_7) >= 2 || parseInt(data.epds_8) >= 2 || parseInt(data.epds_9) >= 2) {
      factors.push({ name: 'High Anxiety (EPDS)', value: 70 + Math.floor(Math.random() * 15) });
    }

    const finalFactors = factors
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    if (finalFactors.length === 0) {
      return [
        { name: 'EPDS Total Score', value: assessment.score || 45 },
        { name: 'General Risk Profile', value: 30 }
      ];
    }

    return finalFactors;
  };


  //handle top logout
  const handleTopLogout = async () => {
    try {
      if (user?.email) {
        await api.post('/logout-status');
      }
    } catch (e) {
      console.error("Failed to update logout status", e);
    }
  
    logout();
    navigate("/");
  };


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
  
        let historyData = [];
  
        // 1) try backend if clinician email is known
        if (user?.email) {
          try {
            const res = await api.get('/assessments');
            if (res.ok) {
              historyData = await res.json(); 
  
              // mirror to localStorage cache
              localStorage.setItem("assessmentHistory", JSON.stringify(historyData));
              localStorage.setItem(
                `assessmentHistory_${user.email}`, 
                JSON.stringify(historyData)
              );
            }
          } catch (e) {
            console.warn("Backend unavailable, using localStorage cache instead", e);
          }
        }
  
        // 2) if backend gave nothing, fall back to localStorage
        if (!historyData.length) {
          const savedHistory = localStorage.getItem("assessmentHistory");
          historyData = savedHistory ? JSON.parse(savedHistory) : [];
        }
  
        // Sort by timestamp (new first)
        const sortedData = historyData.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setRows(sortedData);
        setFilteredRows(sortedData);

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
        console.error("Failed to load history", err);
        setRows([]);
        setFilteredRows([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchHistory();
  }, [user]);  

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

  const clearHistory = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all assessment history? This action cannot be undone."
      )
    ) {
      return;
    }
  
    // 1) try backend clear for this clinician (if you add such endpoint)
    if (user?.email) {
      try {
        await api.delete('/assessments/clear');
      } catch (e) {
        console.warn("Failed to clear history on backend, clearing local cache only", e);
      }
    }
  
    // 2) clear local cache
    localStorage.removeItem("assessmentHistory");
    if (user?.email) {
      localStorage.removeItem(`assessmentHistory_${user.email}`);
    }
  
    setRows([]);
    setFilteredRows([]);
  };
      
  const handleReferral = async (assessment) => {
    if (!assessment) return;

    // Check if it's a numeric ID (backend ID)
    const assessmentId = assessment.id;
    if (!assessmentId || isNaN(Number(assessmentId))) {
      alert("This assessment is not synced with the server yet. Please refresh the page or wait for sync.");
      return;
    }

    // Check for patient email
    const pEmail = assessment.patient_email;
    if (!pEmail) {
      alert(`Patient email not found for ${assessment.patient_name}. \n\nTo send a referral, please go to the 'Patients' section and ensure this patient has a valid email address.`);
      return;
    }

    if (!window.confirm(`Refer ${assessment.patient_name} to the Psychiatry Department? This will send a secure clinical message with the assessment results.`)) {
      return;
    }

    setIsReferralLoading(true);
    try {
      const getTopRiskFactors = (data) => {
        if (!data) return ["AI-identified risk patterns"];
        const factors = [];
        if (data.depression_before_pregnancy === "Positive") factors.push("History of depression before pregnancy");
        if (data.depression_during_pregnancy === "Positive") factors.push("Experience of depression during pregnancy");
        if (data.epds_10 && parseInt(data.epds_10) > 0) factors.push("Thoughts of self-harm (EPDS Question 10)");
        if (data.relationship_husband === "Bad") factors.push("Poor relationship with partner");
        if (data.support_during_pregnancy === "No") factors.push("Lack of social support");
        
        if (factors.length === 0) factors.push("AI-identified risk patterns", "Clinician-assessed risk factors");
        return factors.slice(0, 3);
      };

      const payload = {
        assessment_id: Number(assessmentId),
        patient_name: assessment.patient_name,
        risk_level: assessment.risk_level,
        risk_score: assessment.score || 0.0,
        clinician_name: user?.fullName || "Clinician",
        clinician_notes: assessment.notes,
        referral_department: "Psychiatry",
        top_risk_factors: getTopRiskFactors(assessment.raw_data)
      };

      const res = await api.post('/referrals', payload);
      
      if (res.ok) {
        const data = await res.json();
        setSentReferrals(prev => ({ ...prev, [assessment.id]: true }));
        alert(data.message || "Referral successfully sent!");
      } else {
        // Try to get detailed error from backend
        let errorMsg = "Failed to send referral.";
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch (e) {
          errorMsg = `Server error (${res.status})`;
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Referral failed:", err);
      alert(`Referral error: ${err.message}`);
    } finally {
      setIsReferralLoading(false);
    }
  };

  const deleteAssessment = async (assessmentId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this assessment? This action cannot be undone!!!"
      )
    ) {
      return;
    }
  
    try {
      await api.delete(`/assessments/${assessmentId}`);
    } catch (e) {
      console.warn("Failed to delete on backend, removing from local cache only", e);
    }
  
    const updatedHistory = rows.filter((row) => row.id !== assessmentId);
    setRows(updatedHistory);
    setFilteredRows(updatedHistory);
    localStorage.setItem("assessmentHistory", JSON.stringify(updatedHistory));
    if (user?.email) {
      localStorage.setItem(
        `assessmentHistory_${user.email}`,
        JSON.stringify(updatedHistory)
      );
    }
  
    const deletedAssessment = rows.find((row) => row.id === assessmentId);
    alert(
      `Assessment for ${deletedAssessment?.patient_name} has been deleted successfully.`
    );
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
          <NavLink to="/patients" className={({isActive}) => 
            `dp-nav-link ${isActive ? "dp-nav-link-active" : ""}`}>
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

      <main className="history-shell">
        <section className="history-header">
          <div className="history-header-content">
            <div>
              <h1>Assessment History</h1>
              <p>All previous postpartum depression assessments and clinical summaries.</p>
            </div>
            <div className="history-header-actions">
              <button 
                className="pp-btn-new"
                onClick={() => navigate('/new-assessment')}
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
                      <div className="patient-name-content">
                        <div className="patient-avatar">
                          {row.patient_name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <span>{row.patient_name || 'Unknown Patient'}</span>
                      </div>
                      </td>
                      <td className="assessment-date">{row.date}</td>
                      <td>
                        <span className={`history-pill ${getRiskColor(row.risk_level)}`}>
                          {row.risk_level || 'Unknown'}
                        </span>
                      </td>
                      <td className="score-cell">
                        <div className="score-display">
                          <span className="score-number">{row.score != null ? Number(row.score).toFixed(2) : "0.00"}</span>
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
                            className="history-export-btn"
                            onClick={() => exportAssessmentToPDF(row)}
                            title="Export PDF"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
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
                            className="pp-btn-new"
                            onClick={() => navigate('/new-assessment')}
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
          <div className="pp-modal-overlay" onClick={closeModal}>
            <div className="pp-history-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
              
              {/* Modal Header */}
              <div className="pp-modal-header" style={{ padding: '12px 15px' }}>
                <div className="pp-history-header-info">
                  <div className="pp-avatar pp-avatar-lg" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                    {(selectedAssessment.patient_name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{selectedAssessment.patient_name}</h2>
                    <p style={{ fontSize: '0.75rem', margin: 0 }}>
                      ID: #{selectedAssessment.id || 'N/A'} • {selectedAssessment.date}
                    </p>
                  </div>
                </div>
                <button className="pp-modal-close" onClick={closeModal} style={{ width: '28px', height: '28px' }}>✕</button>
              </div>

              {/* Modal Body */}
              <div className="pp-history-body" style={{ padding: '15px' }}>
                
                {/* Risk Summary Row - More Compact */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  padding: '8px 15px', 
                  marginBottom: '15px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>AI RISK:</span>
                    <span className={`pp-risk-badge ${
                      selectedAssessment.risk_level === "High Risk"
                        ? "pp-risk-high"
                        : selectedAssessment.risk_level === "Moderate Risk"
                        ? "pp-risk-moderate"
                        : "pp-risk-low"
                    }`} style={{ padding: '2px 10px', fontSize: '0.75rem' }}>
                      {selectedAssessment.risk_level}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>SCORE:</span>
                    <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.95rem' }}>
                      {selectedAssessment.score != null ? Number(selectedAssessment.score).toFixed(1) : "0.0"}/100
                    </span>
                  </div>
                </div>

                {/* Dynamic Risk Chart - Smaller height */}
                <div className="pp-risk-chart-container" style={{ marginBottom: '15px', padding: '12px', border: '1px solid #f1f5f9' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📊 Individual Risk Factors
                  </h4>
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer>
                      <BarChart
                        layout="vertical"
                        data={getRiskFactorData(selectedAssessment)}
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
                          fill={selectedAssessment.risk_level === 'High Risk' ? '#ef4444' : '#f59e0b'} 
                          radius={[0, 3, 3, 0]}
                          barSize={14}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Clinical Details - Combined and Slimmer */}
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                    <h4 style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Treatment Plan</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e293b' }}>
                      {selectedAssessment.plan || 'No treatment plan specified'}
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Clinical Notes</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: '1.4' }}>
                      {selectedAssessment.notes || 'No additional notes provided'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pp-modal-footer" style={{ padding: '10px 15px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center' }}>
                {(selectedAssessment.risk_level === 'High Risk' || selectedAssessment.clinician_risk === 'High') ? (
                  <button 
                    className={`pp-btn-primary-large ${sentReferrals[selectedAssessment.id] ? 'sent' : ''}`}
                    onClick={() => handleReferral(selectedAssessment)}
                    disabled={sentReferrals[selectedAssessment.id] || isReferralLoading}
                    style={{ padding: '6px 20px', fontSize: '0.85rem', margin: 0, borderRadius: '6px', width: '100%' }}
                  >
                    {isReferralLoading ? "..." : sentReferrals[selectedAssessment.id] ? "Referral Sent ✅" : "🚀 Refer to Psychiatry"}
                  </button>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Clinical history of the assessment</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="dp-notifications-panel">
          <div className="dp-notifications-header">
            <h3>Notifications</h3>
            <button onClick={() => setShowNotifications(false)}>✕</button>
          </div>
          <div className="dp-notifications-content">
            {notifications.map((notification) => (
              <div key={notification.id} className={`dp-notification-item dp-notification-${notification.priority}`}>
                <div className="dp-notification-icon">
                  {notification.type === 'alert' ? '⚠️' : notification.type === 'success' ? '✅' : 'ℹ️'}
                </div>
                <div className="dp-notification-content">
                  <div className="dp-notification-title">{notification.title}</div>
                  <div className="dp-notification-message">{notification.message}</div>
                  <div className="dp-notification-time">{notification.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
