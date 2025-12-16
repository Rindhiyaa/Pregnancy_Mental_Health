import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

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
        throw new Error(data?.detail || "Sign in failed");
      }
  
      const data = await res.json();
      console.log("Login success", data);
      navigate("/");
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
