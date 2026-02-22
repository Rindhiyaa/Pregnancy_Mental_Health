import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      
      // Check if OTP is required
      if (data.requires_otp) {
        // Redirect to OTP verification page
        navigate("/verify-otp", {
          state: {
            userData: {
              email: data.email,
              full_name: data.full_name,
              role: data.role,
              password: form.password, // Store temporarily for resend
            },
            otpCode: data.otp_code, // For testing only - remove in production
          },
        });
        return;
      }
      
      // If no OTP required, login directly (backward compatibility)
      const userProfile = {
        fullName: data.full_name || "Clinician",
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || form.email,
        phone: data.phone || "",
        role: data.role || "",
        department: data.department || "",
        memberSince: data.member_since || new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        access_token: data.access_token, // Store JWT token
      };
      
      // Store JWT token
      if (data.access_token) {
        localStorage.setItem('ppd_access_token', data.access_token);
      }
      
      login(userProfile);
      navigate(from, { replace: true });
      
      } catch (err) {
        console.warn("Backend login failed:", err.message);
        setError(err.message || "Login failed. Please check your credentials.");
        return;
      }      
  };
  

  return (
    <main className="page auth-page">
      <div className="auth-layout">
        <div className="auth-main">
          <div className="auth-brand">
            <div className="logo-mark"></div>
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
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              <button 
                type="button" 
                className="link-button" 
                onClick={() => navigate("/forgot-password")}
                style={{ fontSize: '0.9rem', color: '#8b5cf6' }}
              >
                Forgot password?
              </button>
            </div>

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
