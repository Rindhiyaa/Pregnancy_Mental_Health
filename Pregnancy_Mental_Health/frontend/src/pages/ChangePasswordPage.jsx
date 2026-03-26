import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, getErrorMessage } from "../utils/api";
import toast from 'react-hot-toast';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
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
      // Use the generic change-password endpoint
      const { data } = await api.post('/change-password', {
        new_password: form.newPassword
      });

      toast.success("Password updated successfully!");
      
      // Update local user state to reflect first_login is now false
      if (user) {
        const updatedUser = { ...user, first_login: false };
        login(updatedUser);
        
        // Redirect to appropriate dashboard
        const role = user.role?.toLowerCase();
        setTimeout(() => {
          if (role === 'admin') navigate("/admin/dashboard", { replace: true });
          else if (role === 'nurse') navigate("/nurse/dashboard", { replace: true });
          else if (role === 'doctor') navigate("/doctor/dashboard", { replace: true });
          else navigate("/patient/dashboard", { replace: true });
        }, 1500);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout">
        <div className="auth-main">
          <h1>Set Your New Password</h1>
          <p className="lead">
            Welcome {user?.firstName || user?.fullName}! Please set a new password before continuing.
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
                className="auth-input"
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
                className="auth-input"
              />
            </label>

            <div className="password-rules">
              <p>Password must be:</p>
              <ul>
                <li>At least 8 characters</li>
                <li>One number</li>
                <li>One special character</li>
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
            <div className="side-title">Protect your clinical workspace.</div>
            <p className="side-text">
              Setting a strong, unique password ensures that sensitive patient data remains
              confidential and accessible only to authorized personnel.
            </p>
          </div>
          <p className="side-footer">
            Your security is our priority. If you have trouble resetting your password, please contact
            your system administrator.
          </p>
        </aside>
      </div>
    </main>
  );
}
