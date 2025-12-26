import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/DashboardPage.css";
import "../styles/ProfilePage.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    role: "",
    memberSince: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/me");
        if (!res.ok) {
          throw new Error("Failed to load profile");
        }
        const data = await res.json();
        setProfile({
          fullName: data.full_name,
          email: data.email,
          role: data.role || "",
          memberSince: data.member_since || "",
        });
      } catch (err) {
        setError(err.message || "Could not load profile");
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.fullName,
          role: profile.role,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Failed to save profile");
      }
      const data = await res.json();
      setProfile((prev) => ({
        ...prev,
        fullName: data.full_name,
        role: data.role || "",
        memberSince: data.member_since || prev.memberSince,
      }));
    } catch (err) {
      setError(err.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="dp-root profile-root">
      {/* clinician navbar (same as dashboard) */}
      <header className="dp-navbar">
        <div className="dp-nav-left">
          <div className="dp-logo-mark">PR</div>
          <div className="dp-logo-text">
            <span>PPD Predictor</span>
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
            <span className="dp-profile-name">{profile.fullName}</span>
          </div>
          <button className="dp-logout-btn" onClick={() => navigate("/")}>
            Logout
          </button>
        </div>
      </header>

      <main className="profile-shell">
        {/* page heading */}
        <section className="profile-header">
          <div className="profile-header-title-row">
            <div className="profile-header-icon">👤</div>
            <div>
              <h1>Profile</h1>
              <p>Manage your account settings and preferences.</p>
            </div>
          </div>
        </section>

        {/* main card */}
        <section className="profile-card">
          <h2 className="profile-card-title">Account Information</h2>
          <p className="profile-card-subtitle">
            Update your personal details here.
          </p>

          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-field">
              <div className="profile-label-row">
                <span>Full Name</span>
              </div>
              <input
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className="profile-input"
                type="text"
              />
            </div>

            <div className="profile-field">
              <div className="profile-label-row">
                <span>Email Address</span>
              </div>
              <input
                name="email"
                value={profile.email}
                disabled
                className="profile-input"
                type="email"
              />
              <span className="profile-label-helper">
                Email cannot be changed.
              </span>
            </div>

            <div className="profile-row-two">
              <div className="profile-field">
                <div className="profile-label-row">
                  <span>Role</span>
                </div>
                <input
                  name="role"
                  value={profile.role}
                  onChange={handleChange}
                  className="profile-input"
                  type="text"
                />
              </div>

              <div className="profile-field">
                <div className="profile-label-row">
                  <span>Member Since</span>
                </div>
                <input
                  name="memberSince"
                  value={profile.memberSince}
                  disabled
                  className="profile-input"
                  type="text"
                />
              </div>
            </div>

            <button type="submit" className="profile-save-btn">
              Save Changes
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
