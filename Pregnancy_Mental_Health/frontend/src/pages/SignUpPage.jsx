import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../utils/api";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",          // ✅ added phone 
    password: "",
    role: "",
    terms: false,
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstName || !form.email || !form.password) {
      setError("Please fill in first name, email, and password.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!form.role) {
      setError("Please select your role.");              // ✅ validate role 
      return;
    }
    if (!form.terms) {
      setError("You must agree to the guidelines to continue.");
      return;
    }

    try {
      const res = await api.post("/signup", {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone_number: form.phone,                       // ✅ send phone 
        password: form.password,
        role: form.role,                        // ✅ from select only 
      });

      if (!res.ok) {
        let errorMessage = "Signup failed";
        try {
          const data = await res.json();
          errorMessage = data?.detail || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        if (
          errorMessage.includes("already exists") ||
          errorMessage.includes("already registered")
        ) {
          setError(
            "This email is already registered. Please sign in instead."
          );
        } else {
          setError(errorMessage);
        }
        return;
      }

      const data = await res.json();

      const profileData = {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        department: "",
        memberSince: new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
      };

      if (data.access_token) {
        localStorage.setItem("ppd_access_token", data.access_token);
        localStorage.setItem("ppd_user_role", form.role);
      }

      login(profileData);

      // ── Role-based redirect ── 
      const role = form.role.toLowerCase();
      if (data.role?.toLowerCase() === 'admin') {
        navigate("/admin/dashboard", { replace: true });
      } else if (data.role?.toLowerCase() === 'nurse') {
        navigate("/nurse/dashboard", { replace: true });
      } else if (data.role?.toLowerCase() === 'doctor') {
        navigate("/doctor/dashboard", { replace: true });
      } else { // Default for patient or any other role
        navigate("/patient/dashboard", { replace: true });
      }

    } catch (err) {
      console.error("Signup error:", err);
      setError("Network error. Please check your connection and try again.");
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

          <h1>Create your account</h1>
          <p className="lead">
            Set up your secure portal to access postpartum depression risk monitoring.
          </p>

          <p className="switch-auth">
            Already have an account?{" "}
            <button type="button" className="link-button" onClick={() => navigate("/signin")}>
              Sign in
            </button>
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="two-col-row">
              <label>
                First name
                <input
                  type="text"
                  name="firstName"
                  placeholder="Ananya"
                  value={form.firstName}
                  onChange={handleChange}
                />
              </label>
              <label>
                Last name
                <input
                  type="text"
                  name="lastName"
                  placeholder="Sharma"
                  value={form.lastName}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label>
              Email address
              <input
                type="email"
                name="email"
                placeholder="ananya.sharma@hospital.com"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label>
              Role
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginTop: '8px',
                  backgroundColor: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select your role</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="patient">Patient</option>
              </select>
            </label>

            <label>
              Password
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 8 characters"
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
              <span className="hint">Use at least 8 characters, including a number.</span>
            </label>

            <label>
              Role
              <input
                type="text"
                name="role"
                placeholder="Ob‑Gyn, psychiatrist, nurse, social worker..."
                value={form.role}
                onChange={handleChange}
              />
            </label>

            <div className="checkbox-row">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
              />
              <label htmlFor="terms">
                I will use this tool to support, not replace, my clinical judgement and I agree to
                the data protection policy.
              </label>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="btn-primary full-width">
              Create clinician workspace
            </button>
          </form>
        </div>

        <aside className="auth-side">
          <div>
            <div className="side-header">For maternal mental‑health teams</div>
            <div className="side-title">Screen, triage, and follow‑up with confidence.</div>
            <p className="side-text">
              Capture key risk factors in 2 minutes during antenatal and postnatal visits, and keep
              mothers at higher risk clearly visible to your team.
            </p>

            <div className="side-card">
              <strong>How teams use Postpartum Risk Insight</strong>
              Register your clinic, invite colleagues, and use a shared view of risk scores, drivers,
              and follow‑up dates for every mother you care for.
              <div className="side-chip-row">
                <span className="side-chip">2‑minute screening</span>
                <span className="side-chip">Explainable risk level</span>
                <span className="side-chip">Follow‑up reminders</span>
              </div>
            </div>
          </div>

          <p className="side-footer">
            Not for emergency use. If a mother is at immediate risk, follow your local urgent‑care
            and safety protocols.
          </p>
        </aside>
      </div>
    </main>
  );
}
