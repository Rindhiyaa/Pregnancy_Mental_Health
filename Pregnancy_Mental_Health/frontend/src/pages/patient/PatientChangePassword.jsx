import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../utils/api";
import toast from 'react-hot-toast';

export default function PatientChangePassword() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });
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
      const res = await api.patch('/patient/change-password', {
        email: user.email,
        new_password: form.newPassword
      });

      if (res.ok) {
        toast.success("Password updated successfully!");
        setTimeout(() => navigate("/patient/dashboard", { replace: true }), 2000);
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to update password.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page auth-page">
      <div className="auth-layout">
        <div className="auth-main">
          <h1>🔐 Set Your New Password</h1>
          <p className="lead">
            Welcome {user?.firstName}! Please set a new password before continuing.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <label>
              New Password
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </label>

            <div className="password-rules" style={{ fontSize: '0.85rem', color: '#64748b', margin: '1rem 0' }}>
              <p>Password must be:</p>
              <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                <li>✅ At least 8 characters</li>
                <li>✅ One number</li>
                <li>✅ One special character</li>
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



