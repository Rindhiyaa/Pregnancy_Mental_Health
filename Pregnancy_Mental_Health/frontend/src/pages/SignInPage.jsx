import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" }); // identifier can be email or phone
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get the page user was trying to access before being redirected to signin
  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!form.identifier || !form.password) {
      setError("Please fill in email/phone and password.");
      setIsLoading(false);
      return;
    }

    try {
      // Determine if identifier is email or phone
      const isEmail = form.identifier.includes("@");
      const payload = isEmail
        ? { email: form.identifier, password: form.password }
        : { phone_number: form.identifier, password: form.password };

      // Try login using api utility (handles mocking)
      const res = await api.post('/login', payload);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Backend server error");
      }

      const data = await res.json();

      // Clear any old, stale profile data before logging in
      localStorage.removeItem('ppd_user_email');
      localStorage.removeItem('ppd_user_role');
      localStorage.removeItem('ppd_user_full_name');

      const userProfile = {
        fullName: data.full_name || "User",
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || form.identifier,
        phone: data.phone_number || "",
        role: data.role || "patient", // Default to patient if not provided
        department: data.department || "",
        memberSince: data.member_since || new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        access_token: data.access_token, // Store JWT token
      };

      // Store JWT token and role explicitly for context
      if (data.access_token) {
        localStorage.setItem('ppd_access_token', data.access_token);
      }
      if (data.role) {
        localStorage.setItem('ppd_user_role', data.role);
      }

      login(userProfile);

      // success → redirect based on role and first_login status
      const role = data.role ? data.role.toLowerCase() : 'patient';

      if (role === 'admin') {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === 'nurse') {
        navigate("/nurse/dashboard", { replace: true });
      } else if (role === 'doctor') {
        navigate("/doctor/dashboard", { replace: true });
      } else if (role === 'patient') {
        if (data.first_login) {
          navigate("/patient/change-password", { replace: true });
        } else {
          navigate("/patient/dashboard", { replace: true });
        }
      } else {
        // Fallback for any other roles
        navigate(from, { replace: true });
      }

    } catch (err) {
      console.warn("Backend login failed:", err.message);
      setError(err.message || "Login failed. Please check your credentials.");
      return;
    } finally {
      setIsLoading(false);
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

          {/* <p className="switch-auth">
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
          </p> */}

          <form onSubmit={handleSubmit} noValidate>
            <label>
              Email or Phone Number
              <input
                type="text"
                name="identifier"
                placeholder="you@hospital.com or 8148282009"
                value={form.identifier}
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
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
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

            {error && <div className="error" role="alert" aria-live="polite">{error}</div>}

            <button type="submit" className="btn-primary full-width" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
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
