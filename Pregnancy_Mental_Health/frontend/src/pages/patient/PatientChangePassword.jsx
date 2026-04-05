import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../utils/api";
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

export default function PatientChangePassword() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    const hasNumber = /\d/.test(form.newPassword);
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
      const { data } = await api.post('/change-password', {
        new_password: form.newPassword
      });

      if (data?.access_token) {
        localStorage.setItem('ppd_access_token', data.access_token);
      }

      login({ ...user, first_login: false, access_token: data?.access_token || user?.access_token, isAuthenticated: true });

      toast.success("Password updated successfully!");
      navigate("/patient/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <div className="auth-layout">
        <div className="auth-main">
          <h1> Set Your New Password</h1>
          <p className="lead">
            Welcome {user?.firstName}! Please set a new password before continuing.
          </p>

          {error && <div className="error-message">{error}</div>}

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
                />
                <button type="button" className="password-toggle" onClick={() => setShowNew(v => !v)} aria-label="Toggle new password">
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
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirm(v => !v)} aria-label="Toggle confirm password">
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </label>

            <div className="password-rules" style={{ fontSize: '0.85rem', color: '#64748b', margin: '1rem 0' }}>
              <p>Password must be:</p>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                <li> At least 8 characters</li>
                <li> One number</li>
                <li> One special character</li>
              </ul>
            </div>

            <button
              type="submit"
              className="primary-btn full-width"
              disabled={loading}
            >
              {loading ? "SETTING PASSWORD..." : "SET PASSWORD & CONTINUE"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}



