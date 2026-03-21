import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../Images/Postpartum_Risk_Insight_Logo.png";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return "/dashboard";
    const role = user.role?.toLowerCase();
    if (role === 'admin') return "/admin/dashboard";
    if (role === 'nurse') return "/nurse/dashboard";
    if (role === 'patient') return "/patient/dashboard";
    if (role === 'doctor') return "/doctor/dashboard";
    return "/signin";
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Logo on left */}
        <Link to="/" className="nav-left" onClick={() => setIsMenuOpen(false)}>
          {/* <div className="logo-mark"></div> */}
          <img src={logo} alt="Postpartum Risk Insight" className="logo-mark" />
          <span className="logo-text">Postpartum Risk Insight</span>
        </Link>

        {/* Hamburger menu for mobile */}
        <button className="hamburger" onClick={toggleMenu} aria-label="Toggle menu">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Nav links (mobile + desktop) */}
        <nav className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
            About
          </NavLink>
          <NavLink to={getDashboardLink()} className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
            Dashboard
          </NavLink>
        </nav>

        {/* Right side: Profile or Auth buttons */}
        <div className="nav-right">
          {user && user.isAuthenticated ? (
            // Profile icon for logged-in users
            <div className="profile-section">
              <Link to="/profile" className="profile-icon" title="Profile" onClick={() => setIsMenuOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="user-name-display">{user.fullName || "User"}</span>
              </Link>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            // Sign In and Sign Up buttons
            <>
              <Link to="/signin">
                <button className="btn-signin">Sign In</button>
              </Link>
              <Link to="/signup">
                <button className="btn-signup">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

