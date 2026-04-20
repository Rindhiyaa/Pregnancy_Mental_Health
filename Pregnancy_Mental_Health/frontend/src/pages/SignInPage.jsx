import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api, getErrorMessage } from "../utils/api";

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");

    if (errorParam === "first_login" || errorParam === "first-login") {
      setError("First-time login: Password reset required. Please log in again.");
    }
  }, [location.search]);

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
      const isEmail = form.identifier.includes("@");

      const payload = isEmail
        ? { email: form.identifier.trim(), password: form.password }
        : { phone_number: form.identifier.trim(), password: form.password };

      const { data } = await api.post("/login", payload);

      const userProfile = {
        fullName: data?.full_name || "User",
        firstName: data?.first_name || "",
        lastName: data?.last_name || "",
        email: data?.email || form.identifier.trim(),
        phone: data?.phone_number || "",
        role: data?.role || "patient",
        department: data?.department || "",
        memberSince: data?.member_since || new Date().toLocaleDateString(),
        timestamp: new Date().toISOString(),
        access_token: data?.access_token,
        refresh_token: data?.refresh_token,
        first_login: data?.first_login,
      };

      login(userProfile);

      const role = data?.role ? data.role.toLowerCase() : "patient";

      if (data?.first_login && role !== "admin") {
        navigate("/change-password", { replace: true });
        return;
      }

      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "nurse") {
        navigate("/nurse/dashboard", { replace: true });
      } else if (role === "doctor") {
        navigate("/doctor/dashboard", { replace: true });
      } else if (role === "patient") {
        navigate("/patient/dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.warn("Backend login failed:", err);

      const status = err?.response?.status ?? err?.status ?? null;
      const msg = getErrorMessage(err, "Login failed. Please check your credentials.");

      // Only show inline box errors for actual auth/input problems.
      // For sleeping server, timeout, network, backend unavailable, 5xx:
      // keep the top banner only.
      if ([400, 401, 403, 404, 422].includes(status)) {
        setError(msg);
      } else {
        setError("");
      }
    } finally {
      setIsLoading(false);
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

          <h1>Sign in to your account</h1>
          <p className="lead">
            Access your workspace to screen pregnancy and postpartum depression risk for your patients.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label>
              Email or Phone Number
              <input
                type="text"
                name="identifier"
                placeholder="name@gmail.com"
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

            <div style={{ textAlign: "right", marginTop: "-0.5rem", marginBottom: "1rem" }}>
              <button
                type="button"
                className="link-button"
                onClick={() => navigate("/forgot-password")}
                style={{ fontSize: "0.9rem", color: "#2A9D8F" }}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="error" role="alert" aria-live="polite">
                {error}
              </div>
            )}

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
            Not for emergency use. If a mother is at immediate risk, follow your local urgent‑care protocols.
          </p>
        </aside>
      </div>
    </main>
  );
}