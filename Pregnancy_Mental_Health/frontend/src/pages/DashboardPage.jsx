import React, { useEffect, useState } from "react";
import "../styles/DashboardPage.css";

import { NavLink, useNavigate } from "react-router-dom";



/**
 * Single-page clinician dashboard:
 * - Top navbar with logo, links, profile, logout
 * - Dynamic data: fetches assessments + stats from backend
 * - Search + risk filter on recent assessments
 *
 * NOTE: adjust API URLs to match your backend.
 */

const DashboardPage = () => {
    const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    low: 0,
    today: 0,
  });

  const [currentUserName, setCurrentUserName] = useState("");
    
      useEffect(() => {
        const storedName = localStorage.getItem("ppd_user_full_name");
        if (storedName) {
          setCurrentUserName(storedName);
        } else {
          setCurrentUserName("Clinician"); // fallback
        }
      }, []);


  const [loading, setLoading] = useState(true);

  // fetch data from localStorage (same as History page)
  useEffect(() => {
    const fetchData = () => {
      try {
        setLoading(true);

        // Load from localStorage instead of API
        const savedHistory = localStorage.getItem('assessmentHistory');
        if (savedHistory) {
          const historyData = JSON.parse(savedHistory);
          
          // Sort by timestamp (newest first) and take recent 10
          const sortedData = historyData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          const recentAssessments = sortedData.slice(0, 10);
          
          // Transform data to match expected format
          const transformedRows = recentAssessments.map(assessment => ({
            id: assessment.patient_name || 'Unknown',
            name: assessment.patient_name || 'Unknown Patient',
            date: assessment.date || new Date(assessment.timestamp).toLocaleDateString(),
            risk: assessment.risk_level?.toLowerCase() === 'high' ? 'high' : 'low'
          }));
          
          // Calculate statistics
          const totalAssessments = historyData.length;
          const highRiskCount = historyData.filter(a => 
            a.risk_level?.toLowerCase() === 'high' || 
            a.clinician_risk?.toLowerCase() === 'high'
          ).length;
          const lowRiskCount = historyData.filter(a => 
            a.risk_level?.toLowerCase() === 'low' || 
            a.clinician_risk?.toLowerCase() === 'low'
          ).length;
          
          // Today's assessments (assessments created today)
          const today = new Date().toDateString();
          const todayCount = historyData.filter(a => {
            const assessmentDate = new Date(a.timestamp || a.date).toDateString();
            return assessmentDate === today;
          }).length;
          
          setRows(transformedRows);
          setStats({
            total: totalAssessments,
            high: highRiskCount,
            low: lowRiskCount,
            today: todayCount
          });
        } else {
          setRows([]);
          setStats({ total: 0, high: 0, low: 0, today: 0 });
        }
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
      <div className="dp-profile-avatar" />
      <span className="dp-profile-name">{currentUserName}</span>
    </div>

    <button
      className="dp-logout-btn"
      onClick={() => navigate("/")} // go back to landing / login
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
                              : "dp-pill-low")
                          }
                        >
                          {row.risk === "high" ? "High" : "Low"}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="dp-view-btn"
                          onClick={() => {
                            // Find the full assessment data from localStorage
                            const savedHistory = localStorage.getItem('assessmentHistory');
                            if (savedHistory) {
                              const historyData = JSON.parse(savedHistory);
                              const assessment = historyData.find(a => a.patient_name === row.name);
                              if (assessment) {
                                alert(`Assessment Details:\n\nPatient: ${assessment.patient_name}\nDate: ${assessment.date}\nAI Risk: ${assessment.risk_level} (${assessment.score}/100)\nClinician Risk: ${assessment.clinician_risk || 'Not Set'}\nPlan: ${assessment.plan || 'No plan specified'}\n\nNotes: ${assessment.notes || 'No notes provided'}`);
                              } else {
                                alert('Assessment details not found.');
                              }
                            }
                          }}
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
    </div>
  );
};

export default DashboardPage;
