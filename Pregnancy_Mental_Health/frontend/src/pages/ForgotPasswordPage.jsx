import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../utils/api";
import { setResetCode, clearResetCode, getRoleFromUrl } from "../auth/tokenStorage";
import toast from "react-hot-toast";
import { 
  BellRing, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";

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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter email, 2: Reset password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  // WebSocket for Real-time Mock Push Notification
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showNotification = (code) => {
    if (!code) return;
    console.log("Showing Recovery Notification:", code);
    
    // Namespacing: Store reset code by role if role is detectable
    const role = getRoleFromUrl();
    if (role) {
      setResetCode(role, code);
    }

    // Automatically transition to the reset step so the user can enter the code
    if (step === 1) {
      setStep(2);
    }

    // Check if this code was already shown to avoid duplicates
    toast.custom((t) => (
      <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        style={{ 
          borderLeft: '5px solid #6366f1',
          background: '#ffffff',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <div className="flex-1 w-0 p-1">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <BellRing className="h-10 w-10" color="#6366f1" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-gray-900" style={{ margin: 0, color: '#111827', fontWeight: 800 }}>
                New Notification
              </p>
              <p className="mt-1 text-sm text-gray-500" style={{ margin: '4px 0 0', color: '#4b5563', fontSize: 13 }}>
                Your recovery code is:
              </p>
              <div style={{ 
                  marginTop: 8, 
                  background: '#f3f4f6', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  textAlign: 'center',
                  fontSize: '20px',
                  letterSpacing: '0.2em',
                  fontWeight: 'bold',
                  color: '#6366f1',
                  border: '1px dashed #6366f1'
              }}>
                  {code}
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200" style={{ borderLeft: '1px solid #e5e7eb', marginLeft: 16, paddingLeft: 12, display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => {
              setCode(code);
              toast.dismiss(t.id);
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer' }}
          >
            Use Code
          </button>
        </div>
      </div>
    ), { duration: 15000, id: `recovery-${code}` });
  };

  useEffect(() => {
    if (!email || success === "") return;

    let wsUrl;
    if (import.meta.env.VITE_API_URL) {
      // Production or custom VITE_API_URL
      wsUrl = import.meta.env.VITE_API_URL.replace(/^http/, "ws");
      // If the URL doesn't already have /ws at the end, add it
      if (!wsUrl.endsWith("/ws")) {
        // Handle cases where VITE_API_URL might have a trailing slash
        wsUrl = wsUrl.replace(/\/$/, "") + "/ws";
      }
    } else {
      // Fallback for local development
      wsUrl = `ws://${window.location.hostname}:8000/ws`;
    }

    console.log("Connecting to WebSocket:", wsUrl);
    const socket = new WebSocket(wsUrl);
    let isMounted = true;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (isMounted && data.type === "RECOVERY_READY" && data.email === email) {
          showNotification(data.code);
        }
      } catch (err) { }
    };

    return () => {
      isMounted = false;
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [email, success]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/recovery/request', { email });
      setSuccess(data.message);
      
      // If the code is already in the response (auto-approved patient path), show it now!
      if (data.code) {
        showNotification(data.code);
      }

      // Only move to step 2 (reset password) if it was auto-approved (patient flow)
      // Otherwise stay on step 1 to show the "Pending Admin Approval" message
      if (data.auto_approved) {
        setTimeout(() => {
          setStep(2);
          // Don't clear success here, we need it to keep the socket alive
        }, 1500);
      }
    } catch (err) {
      setError(getErrorMessage(err, "An error occurred. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasNumber || !hasSpecial) {
      setError("Password must contain at least one number and one special character.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!code || code.length < 6) {
      setError("Please enter the 6-digit verification code.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/recovery/verify', {
        email,
        code,
        new_password: newPassword,
      });

      setSuccess(data.message);

      // Namespacing: Clear reset code for this role
      const role = getRoleFromUrl();
      if (role) {
        clearResetCode(role);
      }

      // Redirect to signin after 2 seconds
      setTimeout(() => {
        toast.success("Password reset! Please sign in with your new password.");
        navigate("/signin", { replace: true });
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, "An error occurred. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-layout narrow">
        <div className="auth-main">
          <div className="auth-brand">
            <div className="logo-mark"></div>
            <span className="logo-text">Postpartum Risk Insight</span>
          </div>

          {step === 1 ? (
            <>
              <h1>Reset your password</h1>
              <p className="lead">
                Enter your work email and we'll help you reset your password.
              </p>

              <p className="switch-auth">
                Remember your password?{" "}
                <button type="button" className="link-button" onClick={() => navigate("/signin")}>
                  Sign in
                </button>
              </p>

              <p className="switch-auth" style={{ marginTop: "-10px", marginBottom: "20px" }}>
                Already have an approval code?{" "}
                <button type="button" className="link-button" onClick={() => setStep(2)}>
                  Enter it here
                </button>
              </p>

              <form onSubmit={handleEmailSubmit} noValidate>
                <label>
                  Work email
                  <input
                    type="email"
                    name="email"
                    placeholder="you@hospital.org"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </label>

                {error && <div className="error" role="alert">{error}</div>}
                {success && <div className="success" role="alert">{success}</div>}

                <button type="submit" className="btn-primary full-width" disabled={loading}>
                  {loading ? "Processing..." : "Continue"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1>Create new password</h1>
              <p className="lead">
                Enter a new password for <strong>{email}</strong>
              </p>

              <form onSubmit={handlePasswordReset} noValidate>
                <label>
                  Verification Code
                  <input
                    type="text"
                    name="code"
                    placeholder="6-digit code"
                    className="auth-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={loading}
                    maxLength={6}
                    style={{ marginBottom: '1rem', letterSpacing: '0.2em', fontFamily: 'monospace', fontSize: '1.2rem', textAlign: 'center' }}
                  />
                </label>

                <label>
                  New password
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="At least 8 characters"
                      className="auth-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showNewPassword} />
                    </button>
                  </div>
                </label>

                <label>
                  Confirm new password
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter your password"
                      className="auth-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>
                </label>

               

                {error && <div className="error" role="alert">{error}</div>}
                {success && <div className="success" role="alert">{success}</div>}

                <button type="submit" className="btn-primary full-width" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setStep(1);
                    setCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                    setSuccess("");
                  }}
                  disabled={loading}
                  style={{ marginTop: "1rem", textAlign: 'center', width: '100%', fontSize: '0.9rem' }}
                >
                  Back to email entry
                </button>
              </form>
            </>
          )}
        </div>

        <aside className="auth-side">
          <div>
            <div className="side-header">Secure password reset</div>
            <div className="side-title">Your account security is important to us.</div>
            <p className="side-text">
              We'll verify your identity and help you create a new secure password for your
              clinician account.
            </p>
          </div>
          <p className="side-footer">
            If you continue to have issues accessing your account, please contact your system
            administrator.
          </p>
        </aside>
      </div>
    </main>
  );
}
