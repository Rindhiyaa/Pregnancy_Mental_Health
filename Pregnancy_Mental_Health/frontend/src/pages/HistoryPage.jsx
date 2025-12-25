import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import "../styles/HistoryPage.css";

const HistoryPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/assessments/history");
        const data = await res.json();
        setRows(data || []);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

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
            <div className="dp-profile-avatar" />
            <span className="dp-profile-name">Dr. Smith</span>
          </div>
          <button className="dp-logout-btn" onClick={() => navigate("/")}>
            Logout
          </button>
        </div>
      </header>

      <main className="history-shell">
        <section className="history-header">
          <h1>Assessment History</h1>
          <p>All previous postpartum depression assessments.</p>
        </section>

        <section className="history-card">
          {loading ? (
            <p className="history-muted">Loading history…</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Risk Level</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="history-row">
                    <td>
                      {row.id} • {row.name}
                    </td>
                    <td>{row.date}</td>
                    <td>
                      <span
                        className={
                          "history-pill " +
                          (row.risk === "high"
                            ? "history-pill-high"
                            : "history-pill-low")
                        }
                      >
                        {row.risk === "high" ? "High" : "Low"}
                      </span>
                    </td>
                    <td>
                      <button className="history-view-btn">
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="4" className="history-muted">
                      No assessments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

export default HistoryPage;
