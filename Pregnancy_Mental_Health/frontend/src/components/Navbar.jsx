import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import logo from "../Images/Postpartum_Risk_Insight_Logo.png";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = user && Object.keys(user).length > 0 && user.isAuthenticated;
  const authPages = ["/signin", "/change-password", "/forgot-password"];
  const isAuthPage = authPages.includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
    setIsMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* 1. LEFT END: Logo Section */}
        <Link to="/" className="logo-section" onClick={() => setIsMenuOpen(false)}>
          <img src={logo} alt="Logo" className="logo-img" />
          <span className="logo-text">Postpartum Risk Insight</span>
        </Link>

        {/* 2. RIGHT END: Nav Links */}
        <nav className={`nav-right-links ${isMenuOpen ? 'mobile-active' : ''}`}>
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink 
            to="/about" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </NavLink>
        </nav>

        {/* Mobile hamburger - hidden on desktop */}
        <button className="mobile-menu" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          ☰
        </button>
      </div>
    </header>
  );
}
