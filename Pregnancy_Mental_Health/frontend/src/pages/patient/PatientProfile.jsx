import React, { useState, useEffect, useRef } from "react";
import PatientSidebar from "../../components/PatientSidebar";
import { useTheme } from "../../ThemeContext";
import { api } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import toast from 'react-hot-toast';
import { Loader2 } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELATIONS = ["Husband", "Mother", "Father", "Sister", "Brother", "Friend", "Other"];

// ── SVG Icons (no emojis) ── 
const Icon = {
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  Mail: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
  Phone: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.9 19.79 19.79 0 0 1 1.62 3.3 2 2 0 0 1 3.6 1.1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.74a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Hash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>,
  Drop: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>,
  Home: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  Alert: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  Heart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  Doctor: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg>,
  Hospital: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><rect x="9" y="12" width="6" height="9" /></svg>,
  Baby: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Camera: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
  Edit: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Save: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
  Check: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
  Key: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
};

export default function PatientProfile() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const fileRef = useRef();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [avatar, setAvatar] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    age: "",
    bloodGroup: "",
    address: "",
    city: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
    currentWeek: "",
    doctorName: "",
    hospitalName: "",
    gravida: "",
    para: "",
  });

  // ── Load from auth context / API ── 
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setFetching(true);
        const res = await api.get("/patient/profile");
        if (res.ok) {
          const data = await res.json();
          setForm({
            fullName: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            dob: data.dob ? data.dob.split('T')[0] : "",
            age: data.age ? String(data.age) : "",
            bloodGroup: data.blood_group || "",
            address: data.address || "",
            city: data.city || "",
            emergencyName: data.emergency_name || "",
            emergencyPhone: data.emergency_phone || "",
            emergencyRelation: data.emergency_relation || "",
            doctorName: data.doctor_name || "Dr. Priya",
            hospitalName: data.hospital_name || "City Hospital",
            gravida: data.gravida ? String(data.gravida) : "",
            para: data.para ? String(data.para) : "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data.");
      } finally {
        setFetching(false);
      }
    };
    loadProfile();
  }, [user]);

  // Auto-calc age 
  useEffect(() => {
    if (form.dob) {
      const birth = new Date(form.dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      setForm(prev => ({ ...prev, age: String(age) }));
    }
  }, [form.dob]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/patient/profile", {
        name: form.fullName,
        phone: form.phone,
        dob: form.dob || null,
        age: form.age ? parseInt(form.age) : null,
        blood_group: form.bloodGroup,
        address: form.address,
        city: form.city,
        emergency_name: form.emergencyName,
        emergency_phone: form.emergency_phone,
        emergency_relation: form.emergencyRelation,
        pregnancy_week: form.currentWeek ? parseInt(form.currentWeek) : null,
        gravida: form.gravida ? parseInt(form.gravida) : null,
        para: form.para ? parseInt(form.para) : null,
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error("Failed to save changes.");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // ── Reusable Field ── 
  const Field = ({ label, name, type = "text", options, IconComp, disabled, half }) => (
    <div style={{ ...S.fieldWrap(theme), ...(half ? { gridColumn: "span 1" } : {}) }}>
      <label style={S.fieldLabel(theme)}>
        {IconComp && (
          <span style={S.fieldLabelIcon(theme)}>
            <IconComp />
          </span>
        )}
        {label}
      </label>
      {options ? (
        <select
          name={name}
          value={form[name]}
          onChange={handleChange}
          disabled={!editing || disabled}
          style={{ ...S.input(theme), ...(!editing || disabled ? S.inputOff(theme) : S.inputOn(theme)) }}
        >
          <option value="">Select</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          disabled={!editing || disabled}
          placeholder={editing && !disabled ? `Enter ${label.toLowerCase()}` : "—"}
          style={{ ...S.input(theme), ...(!editing || disabled ? S.inputOff(theme) : S.inputOn(theme)) }}
        />
      )}
    </div>
  );

  // ── Pregnancy stat card ── 
  const PregCard = ({ label, value }) => (
    <div style={S.pregCard(theme)}>
      <div style={S.pregCardLabel(theme)}>{label}</div>
      <div style={S.pregCardValue(theme)}>{value || "—"}</div>
    </div>
  );

  if (fetching) return (
    <div style={S.portal(theme)}>
      <PatientSidebar />
      <main className="portal-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color={theme.primary} style={{ marginBottom: 16 }} />
          <div style={{ color: theme.textMuted, fontWeight: 500 }}>Loading your profile...</div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={S.portal(theme)}>
      <PatientSidebar />

      <main className="portal-main" style={{ background: theme.pageBg }}>

        {/* ── HEADER ── */}
        <div style={S.header(theme)}>
          <div>
            <h1 style={S.pageTitle(theme)}>My Profile</h1>
            <p style={S.pageSubtitle(theme)}>
              Manage your personal information and pregnancy details
            </p>
          </div>
          <div style={S.headerRight(theme)}>
            {saved && (
              <span style={S.savedPill(theme)}>
                <Icon.Check /> Saved
              </span>
            )}
            {!editing ? (
              <button style={S.editBtn(theme)} onClick={() => setEditing(true)}>
                <Icon.Edit /> Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <button style={S.cancelBtn(theme)} onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button style={S.saveBtn(theme)} onClick={handleSave} disabled={saving}>
                  <Icon.Save /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={S.divider(theme)} />

        {/* ── AVATAR CARD ── */}
        <div style={S.avatarCard(theme)}>
          <div style={S.avatarLeft(theme)}>
            <div style={S.avatarWrap(theme)}>
              {avatar ? (
                <img src={avatar} alt="profile" style={S.avatarImg(theme)} />
              ) : (
                <div style={S.avatarFallback(theme)}>
                  {(form.fullName || "R").charAt(0).toUpperCase()}
                </div>
              )}
              {editing && (
                <button style={S.cameraBtn(theme)} onClick={() => fileRef.current.click()}>
                  <Icon.Camera />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>
            <div style={S.avatarInfo(theme)}>
              <div style={S.avatarName(theme)}>
                {form.fullName || "—"}
              </div>
              <div style={S.avatarEmail(theme)}>{form.email || "—"}</div>
              <div style={S.avatarWeekBadge(theme)}>
                Week {form.currentWeek || "N/A"} of Pregnancy
              </div>
            </div>
          </div>

          {/* Quick stats on right */}
          <div style={S.avatarStats(theme)}>
            <div style={S.avatarStat(theme)}>
              <div style={S.avatarStatVal(theme)}>
                {form.currentWeek || "—"}
              </div>
              <div style={S.avatarStatLabel(theme)}>Current Week</div>
            </div>
            <div style={S.avatarStatDivider(theme)} />
            <div style={S.avatarStat(theme)}>
              <div style={S.avatarStatVal(theme)}>
                {form.bloodGroup || "—"}
              </div>
              <div style={S.avatarStatLabel(theme)}>Blood Group</div>
            </div>
            <div style={S.avatarStatDivider(theme)} />
            <div style={S.avatarStat(theme)}>
              <div style={S.avatarStatVal(theme)}>
                {form.age || "—"}
              </div>
              <div style={S.avatarStatLabel(theme)}>Age</div>
            </div>
            <div style={S.avatarStatDivider(theme)} />
            <div style={S.avatarStat(theme)}>
              <div style={S.avatarStatVal(theme)}>
                {form.doctorName || "—"}
              </div>
              <div style={S.avatarStatLabel(theme)}>Doctor</div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════ 
            SECTION 1 — PERSONAL INFO 
        ════════════════════════════ */}
        <Section title="Personal Information" IconComp={Icon.User} theme={theme}>
          <div style={S.grid2(theme)}>
            <Field label="Full Name" name="fullName" IconComp={Icon.User} />
            <Field label="Email Address" name="email" IconComp={Icon.Mail} disabled />
          </div>
          <div style={S.grid2(theme)}>
            <Field label="Phone Number" name="phone" IconComp={Icon.Phone} type="tel" />
            <Field label="Date of Birth" name="dob" IconComp={Icon.Calendar} type="date" />
          </div>
          <div style={S.grid2(theme)}>
            <Field label="Age" name="age" IconComp={Icon.Hash} disabled />
            <Field label="Blood Group" name="bloodGroup" IconComp={Icon.Drop} options={BLOOD_GROUPS} />
          </div>
          <div style={S.grid2(theme)}>
            <Field label="Address" name="address" IconComp={Icon.Home} />
            <Field label="City" name="city" IconComp={Icon.MapPin} />
          </div>
        </Section>

        {/* ════════════════════════════ 
            SECTION 2 — EMERGENCY 
        ════════════════════════════ */}
        <Section
          title="Emergency Contact"
          IconComp={Icon.Alert}
          theme={theme}
          note="This person will be contacted in an emergency"
          accent
        >
          <div style={S.grid3(theme)}>
            <Field label="Contact Name" name="emergencyName" IconComp={Icon.User} />
            <Field label="Phone Number" name="emergencyPhone" IconComp={Icon.Phone} type="tel" />
            <Field label="Relationship" name="emergencyRelation" IconComp={Icon.Heart} options={RELATIONS} />
          </div>
        </Section>

        {/* ════════════════════════════ 
            SECTION 3 — PREGNANCY 
        ════════════════════════════ */}
        <Section title="Pregnancy Details" IconComp={Icon.Heart} theme={theme}>

          {/* Stat row */}
          <div style={S.pregCards(theme)}>
            <PregCard label="Current Week" value={`Week ${form.currentWeek}`} />
            <PregCard label="Doctor" value={form.doctorName} />
            <PregCard label="Hospital" value={form.hospitalName} />
          </div>

          <div style={S.grid2(theme)}>
            <Field label="Current Pregnancy Week" name="currentWeek" IconComp={Icon.Hash} type="number" />
          </div>
          <div style={S.grid2(theme)}>
            <Field label="Doctor Name" name="doctorName" IconComp={Icon.Doctor} />
            <Field label="Hospital Name" name="hospitalName" IconComp={Icon.Hospital} />
          </div>
          <div style={S.grid2(theme)}>
            <Field label="Gravida (No. of pregnancies)" name="gravida" IconComp={Icon.Hash} type="number" />
            <Field label="Para (No. of deliveries)" name="para" IconComp={Icon.Baby} type="number" />
          </div>
        </Section>

        {/* ════════════════════════════ 
            SECTION 4 — ACCOUNT 
        ════════════════════════════ */}
        <Section title="Account & Security" IconComp={Icon.Lock} theme={theme}>
          <div style={S.grid2(theme)}>
            <div style={S.infoBlock(theme)}>
              <div style={S.infoBlockLabel(theme)}>Member Since</div>
              <div style={S.infoBlockVal(theme)}>19 March 2026</div>
            </div>
            <div style={S.infoBlock(theme)}>
              <div style={S.infoBlockLabel(theme)}>Account Type</div>
              <div style={S.roleBadge(theme)}>Patient</div>
            </div>
          </div>
          <button
            style={S.changePassBtn(theme)}
            onClick={() => window.location.href = "/patient/change-password"}
          >
            <Icon.Key /> Change Password
          </button>
        </Section>

      </main>
    </div>
  );
}

// ── Section wrapper component ── 
function Section({ title, IconComp, note, accent, theme, children }) {
  return (
    <div style={{
      ...S.section(theme),
      borderTop: accent ? `3px solid ${theme.primary}` : `1px solid ${theme.cardBorder}`,
    }}>
      <div style={S.sectionHead(theme)}>
        <span style={S.sectionIconWrap(theme)}>
          {IconComp && <IconComp />}
        </span>
        <h2 style={S.sectionTitle(theme)}>{title}</h2>
        {note && <span style={S.sectionNote(theme)}>{note}</span>}
      </div>
      {children}
    </div>
  );
}

// ════════════════════════════ 
//  STYLES 
// ════════════════════════════ 
const S = {
  portal: (theme) => ({
    display: "flex", minHeight: "100vh",
    background: theme.pageBg,
    fontFamily: theme.fontBody,
  }),
  main: (theme) => ({
    flex: 1,
    padding: "40px 52px",
    boxSizing: "border-box",
  }),

  // Header 
  header: (theme) => ({
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start",
  }),
  pageTitle: (theme) => ({
    fontFamily: theme.fontHeading,
    fontSize: 28, fontWeight: 800,
    color: theme.textPrimary, margin: "0 0 6px 0",
    letterSpacing: "-0.5px",
  }),
  pageSubtitle: (theme) => ({ fontSize: 15, color: theme.textMuted, margin: 0 }),
  divider: (theme) => ({
    height: 1, background: theme.border,
    margin: "20px 0 28px 0",
  }),
  headerRight: (theme) => ({
    display: "flex", gap: 10, alignItems: "center",
  }),
  savedPill: (theme) => ({
    display: "flex", alignItems: "center", gap: 6,
    background: theme.successBg, color: theme.successText,
    padding: "8px 14px", borderRadius: 8,
    fontSize: 13, fontWeight: 600,
  }),
  editBtn: (theme) => ({
    display: "flex", alignItems: "center", gap: 7,
    background: theme.primaryBg, color: theme.primary,
    border: `1.5px solid ${theme.primary}`,
    padding: "10px 22px", borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: theme.fontHeading,
  }),
  cancelBtn: (theme) => ({
    background: theme.cardBg, color: theme.textMuted,
    border: `1px solid ${theme.border}`,
    padding: "10px 18px", borderRadius: 10,
    fontSize: 14, cursor: "pointer",
  }),
  saveBtn: (theme) => ({
    display: "flex", alignItems: "center", gap: 7,
    background: theme.primary, color: "white",
    border: "none", padding: "10px 22px",
    borderRadius: 10, fontSize: 14,
    fontWeight: 700, cursor: "pointer",
    fontFamily: theme.fontHeading,
  }),

  // Avatar card 
  avatarCard: (theme) => ({
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: "28px 32px",
    marginBottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
  }),
  avatarLeft: (theme) => ({
    display: "flex", alignItems: "center", gap: 20,
  }),
  avatarWrap: (theme) => ({ position: "relative", flexShrink: 0 }),
  avatarImg: (theme) => ({
    width: 80, height: 80, borderRadius: "50%",
    objectFit: "cover",
    border: `3px solid ${theme.primaryBg}`,
  }),
  avatarFallback: (theme) => ({
    width: 80, height: 80, borderRadius: "50%",
    background: theme.primaryBg,
    color: theme.primary,
    fontFamily: theme.fontHeading,
    fontSize: 30, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: `3px solid ${theme.border}`,
  }),
  cameraBtn: (theme) => ({
    position: "absolute", bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: "50%",
    background: theme.primary, color: "white",
    border: `2px solid ${theme.cardBg}`, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  }),
  avatarInfo: (theme) => ({}),
  avatarName: (theme) => ({
    fontFamily: theme.fontHeading,
    fontSize: 20, fontWeight: 700,
    color: theme.textPrimary, marginBottom: 4,
  }),
  avatarEmail: (theme) => ({ fontSize: 14, color: theme.textMuted, marginBottom: 8 }),
  avatarWeekBadge: (theme) => ({
    display: "inline-block",
    background: theme.primaryBg,
    color: theme.primary,
    padding: "4px 14px", borderRadius: 20,
    fontSize: 12, fontWeight: 700,
  }),

  // Avatar quick stats 
  avatarStats: (theme) => ({
    display: "flex", alignItems: "center", gap: 0,
    background: theme.isDark ? theme.innerBg : "#FAFAFA", borderRadius: 12,
    border: `1px solid ${theme.border}`,
    padding: "16px 24px",
  }),
  avatarStat: (theme) => ({ textAlign: "center", padding: "0 24px" }),
  avatarStatVal: (theme) => ({
    fontFamily: theme.fontHeading,
    fontSize: 18, fontWeight: 800,
    color: theme.textPrimary, marginBottom: 4,
  }),
  avatarStatLabel: (theme) => ({ fontSize: 11, color: theme.textMuted, fontWeight: 600, letterSpacing: "0.5px" }),
  avatarStatDivider: (theme) => ({
    width: 1, height: 36,
    background: theme.border, flexShrink: 0,
  }),

  // Section 
  section: (theme) => ({
    background: theme.cardBg,
    borderRadius: 16,
    border: `1px solid ${theme.border}`,
    padding: "28px 32px",
    marginBottom: 16,
  }),
  sectionHead: (theme) => ({
    display: "flex", alignItems: "center",
    gap: 10, marginBottom: 24,
  }),
  sectionIconWrap: (theme) => ({
    width: 34, height: 34,
    background: theme.primaryBg,
    color: theme.primary,
    borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  }),
  sectionTitle: (theme) => ({
    fontSize: 20,
    fontWeight: 800,
    color: theme.textPrimary,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 12
  }),
  sectionNote: (theme) => ({
    fontSize: 12, color: theme.textMuted, marginLeft: 4,
  }),

  // Grid 
  grid2: (theme) => ({
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 20, marginBottom: 20,
  }),
  grid3: (theme) => ({
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    gap: 20, marginBottom: 20,
  }),

  // Field 
  fieldWrap: (theme) => ({ display: "flex", flexDirection: "column", gap: 7 }),
  fieldLabel: (theme) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 800,
    color: theme.isDark ? "#FFFFFF" : theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4
  }),
  fieldLabelIcon: (theme) => ({
    color: theme.primary,
    display: "flex", alignItems: "center",
  }),
  input: (theme) => ({
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 15,
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    transition: "border 0.2s",
    fontFamily: theme.fontBody,
  }),
  inputOff: (theme) => ({
    background: theme.isDark ? theme.innerBg : "#F9FAFB",
    border: `1px solid ${theme.border}`,
    color: theme.textMuted,
    cursor: "not-allowed",
  }),
  inputOn: (theme) => ({
    background: theme.inputBg,
    border: `1.5px solid ${theme.primary}`,
    color: theme.textPrimary,
    cursor: "text",
  }),

  // Pregnancy stat cards 
  pregCards: (theme) => ({
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14, marginBottom: 24,
  }),
  pregCard: (theme) => ({
    background: theme.isDark ? theme.innerBg : "#FAFAFA",
    border: `1px solid ${theme.border}`,
    borderRadius: 12, padding: "18px 16px",
    textAlign: "center",
  }),
  pregCardLabel: (theme) => ({
    fontSize: 11, fontWeight: 700,
    color: theme.textMuted, letterSpacing: "0.8px",
    textTransform: "uppercase", marginBottom: 6,
  }),
  pregCardValue: (theme) => ({
    fontFamily: theme.fontHeading,
    fontSize: 16, fontWeight: 700, color: theme.textPrimary,
  }),

  // Account block 
  infoBlock: (theme) => ({
    padding: "14px 0",
    borderBottom: `1px solid ${theme.border}`,
  }),
  infoBlockLabel: (theme) => ({ fontSize: 13, color: theme.textMuted, marginBottom: 5 }),
  infoBlockVal: (theme) => ({
    fontSize: 15,
    fontWeight: 600,
    color: theme.textPrimary,
  }),
  fieldValue: (theme) => ({
    fontSize: 15,
    fontWeight: 600,
    color: theme.textPrimary,
    lineHeight: '1.5'
  }),
  roleBadge: (theme) => ({
    display: "inline-block",
    background: theme.primaryBg, color: theme.primary,
    padding: "4px 14px", borderRadius: 20,
    fontSize: 12, fontWeight: 700,
  }),
  changePassBtn: (theme) => ({
    display: "flex", alignItems: "center", gap: 8,
    marginTop: 16,
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    color: theme.textPrimary,
    padding: "10px 20px", borderRadius: 10,
    fontSize: 14, cursor: "pointer",
    fontFamily: theme.fontBody,
    fontWeight: 600,
  }),
};
