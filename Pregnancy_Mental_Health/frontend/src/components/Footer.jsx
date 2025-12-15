import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span>© {new Date().getFullYear()} Postpartum Risk Insight</span>
        <div className="footer-links">
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          <Link to="/clinicians">For Clinicians</Link>
          <Link to="/patients">For Patients</Link>
        </div>
      </div>
    </footer>
  );
}
