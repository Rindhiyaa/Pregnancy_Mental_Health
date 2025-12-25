import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    terms: false,
  });
  const [error, setError] = useState("");

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
    if (!form.terms) {
      setError("You must agree to the guidelines to continue.");
      return;
    }
  
    try {
      const res = await fetch("http://127.0.0.1:8000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });
  
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Signup failed");
      }
  
      // success → go to sign-in
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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

          <h1>Create your clinician account</h1>
          <p className="lead">
            Set up a secure workspace to screen pregnancy and postpartum depression risk for your
            patients.
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
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange}
              />
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
