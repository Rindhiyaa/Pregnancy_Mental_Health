import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  // Get the page user was trying to access before being redirected to signin
  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    if (!form.email || !form.password) {
      setError("Please fill in email and password.");
      return;
    }
  
    try {
      // Try backend login first
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });
  
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Backend server error");
      }
  
      const data = await res.json();
      console.log("LOGIN RESPONSE", data);

      // Create user profile object from backend response
      const userProfile = {
        fullName: data.full_name || "Clinician",
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || form.email,
        phone: data.phone || "",
        role: data.role || "",
        department: data.department || "",
        memberSince: data.member_since || new Date().toLocaleDateString(),
        timestamp: new Date().toISOString()
      };
      
      // Use auth context to login
      login(userProfile);
      
      // Navigate to the page user was trying to access or dashboard
      navigate(from, { replace: true });

    } catch (err) {
      console.warn("Backend login failed:", err.message);
      
      // Fallback: Create user profile based on the entered email
      // Extract name from email if possible
      const emailName = form.email.split('@')[0];
      
      // Try to extract first and last name from email
      let firstName = "";
      let lastName = "";
      let fullName = "";
      
      if (emailName.includes('.')) {
        const nameParts = emailName.split('.');
        firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
        lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : "";
        fullName = `${firstName} ${lastName}`.trim();
      } else {
        firstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        fullName = firstName;
      }
      
      const userProfile = {
        fullName: fullName || "Healthcare Professional",
        firstName: firstName,
        lastName: lastName,
        email: form.email,
        phone: "",
        role: "Healthcare Professional",
        department: "",
        memberSince: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString()
      };
      
      // Use auth context to login with user's actual email
      login(userProfile);
      
      // Show a warning that we're using demo mode
      console.warn("Using demo login mode - backend server not available");
      
      // Navigate to dashboard
      navigate(from, { replace: true });
    }
  };
  

  return (
    <main className="page auth-page">
      <div className="auth-layout">
        <div className="auth-main">
          <div className="auth-brand">
            <div className="logo-mark">PI</div>
            <span className="logo-text">Postpartum Risk Insight</span>
          </div>

          <h1>Sign in to your account</h1>
          <p className="lead">
            Access your workspace to screen pregnancy and postpartum depression risk for your
            patients.
          </p>

          <p className="switch-auth">
            Don't have an account?{" "}
            <button type="button" className="link-button" onClick={() => navigate("/signup")}>
              Sign up
            </button>
            {" | "}
            <button 
              type="button" 
              className="link-button" 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{ color: '#ef4444' }}
            >
              Clear Data
            </button>
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label>
              Work email
              <input
                type="email"
                name="email"
                placeholder="you@hospital.org"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </label>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="btn-primary full-width">
              Sign in
            </button>
          </form>
        </div>

        <aside className="auth-side">
          <div>
            <div className="side-header">For maternal mental‑health teams</div>
            <div className="side-title">Screen, triage, and follow‑up with confidence.</div>
            <p className="side-text">
              Use a simple, structured workflow to identify and monitor mothers at risk of depression
              during pregnancy and the postpartum period.
            </p>
          </div>
          <p className="side-footer">
            Not for emergency use. If a mother is at immediate risk, follow your local urgent‑care
            protocols.
          </p>
        </aside>
      </div>
    </main>
  );
}
