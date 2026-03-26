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
        </nav>

        {/* Right side: Auth buttons */}
        <div className="nav-right">
          {user && user.isAuthenticated ? (
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <Link to="/signin">
              <button className="btn-signin">Sign In</button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
