import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, getErrorMessage } from "../utils/api";
import { setToken, setRefreshToken, setTabRole, getRoleFromUrl } from "../auth/tokenStorage";
import toast from 'react-hot-toast';

const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  // ✅ Redirect if user already completed first login
  useEffect(() => {
    if (user && user.isAuthenticated && user.first_login === false) {
      console.log("User already set password, redirecting to dashboard...");
      const role = (user.role || getRoleFromUrl() || "").toLowerCase();
      if (role === "admin")        navigate("/admin/dashboard",   { replace: true });
      else if (role === "nurse")   navigate("/nurse/dashboard",   { replace: true });
      else if (role === "doctor")  navigate("/doctor/dashboard",  { replace: true });
      else if (role === "patient") navigate("/patient/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const hasNumber  = /\d/.test(form.newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword);

    if (!hasNumber || !hasSpecial) {
      setError("Password must contain at least one number and one special character.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/set-password', {
        new_password: form.newPassword
      });

      const role = user?.role?.toLowerCase() || getRoleFromUrl();

      // ✅ Save both access + refresh tokens (namespaced)
      if (role && data?.access_token) {
        setToken(role, data.access_token);
        setTabRole(role);
      }
      if (role && data?.refresh_token) {
        setRefreshToken(role, data.refresh_token);  // ← NEW
      }

      // ✅ Rebuild auth state — first_login cleared
      const updatedUser = {
        ...user,
        first_login:    false,
        access_token:   data?.access_token  || user?.access_token,
        refresh_token:  data?.refresh_token || user?.refresh_token,
        isAuthenticated: true,
      };
      login(updatedUser);

      toast.success("Password set successfully! Welcome 🎉");

      console.log("Navigating to dashboard for role:", role);
      if (role === 'admin')        navigate("/admin/dashboard",   { replace: true });
      else if (role === 'nurse')   navigate("/nurse/dashboard",   { replace: true });
      else if (role === 'doctor')  navigate("/doctor/dashboard",  { replace: true });
      else if (role === 'patient') navigate("/patient/dashboard", { replace: true });
      else {
        console.warn("Unknown role, falling back to signin:", role);
        navigate("/signin", { replace: true });
      }

    } catch (err) {
      console.error("Failed to set password:", err);
      setError(getErrorMessage(err, "Failed to set password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <div className="auth-main">
          <div className="auth-brand">
            <div className="logo-mark"></div>
            <span className="logo-text">Postpartum Risk Insight</span>
          </div>

          <h1>Set Your New Password</h1>
          <p className="lead">
            Welcome {user?.firstName || user?.fullName}! Please set a new password before continuing.
          </p>

          {error && <div className="error" role="alert" aria-live="polite">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>

            <label>
              New Password
              <div className="password-input-wrapper">
                <input
                  type={showNew ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="auth-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNew(v => !v)}
                  aria-label="Toggle new password visibility"
                >
                  <EyeIcon open={showNew} />
                </button>
              </div>
            </label>

            <label>
              Confirm Password
              <div className="password-input-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="auth-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label="Toggle confirm password visibility"
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </label>{/* ✅ FIXED: was missing closing > */}

            <div className="password-rules" style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                Password must be:
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                <li>• At least 8 characters</li>
                <li>• One number</li>
                <li>• One special character</li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn-primary full-width"
              disabled={loading}
            >
              {loading ? "SETTING PASSWORD..." : "SET PASSWORD & CONTINUE"}
            </button>

          </form>
        </div>

        <aside className="auth-side">
          <div>
            <div className="side-header">Account Security</div>
            <div className="side-title">Protecting patient information is our priority.</div>
            <p className="side-text">
              By setting a strong, unique password, you help ensure that sensitive maternal
              mental health data remains secure and accessible only to authorized clinical staff.
            </p>
          </div>
          <p className="side-footer">
            Your account is being initialized. Once you set your password, you'll have full
            access to your clinical workspace.
          </p>
        </aside>
      </div>
    </main>
  );
}