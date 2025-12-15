import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Change to true to test logged-in state

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Logo on left */}
        <Link to="/" className="nav-left" onClick={() => setIsMenuOpen(false)}>
          <div className="logo-mark">PI</div>
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
          <NavLink to="/features" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
            Features
          </NavLink>
          <NavLink to="/clinicians" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
            For Clinicians
          </NavLink>
          <NavLink to="/patients" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setIsMenuOpen(false)}>
            For Patients
          </NavLink>
        </nav>

        {/* Right side: Profile or Auth buttons */}
        <div className="nav-right">
          {isLoggedIn ? (
            // Profile icon for logged-in users
            <div className="profile-section">
              <button className="profile-icon" title="Profile">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>
              <button className="logout-btn" onClick={() => setIsLoggedIn(false)}>
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

