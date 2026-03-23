
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { Card } from "../../components/UI";
import toast from "react-hot-toast";

export default function NurseCreatePatient() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    blood_group: "",
    address: "",
    city: "",
    pregnancy_week: "",
    emergency_name: "",
    emergency_phone: "",
    emergency_relation: "",
    gravida: "",
    para: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.name || !form.phone) {
        toast.error("Name and Phone are required");
        return;
      }

      const res = await api.post("/patients", form);
      if (res.ok) {
        toast.success("Patient created successfully!");
        toast.info("Patient login: " + (form.email || form.phone) + " / Patient@123", { duration: 6000 });
        navigate("/nurse/patients");
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to create patient");
      }
    } catch (err) {
      console.error("Create patient error:", err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <NurseSidebar />

      <main className="portal-main" style={{ background: theme.pageBg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: theme.fontHeading, fontSize: 28, fontWeight: 800, color: theme.textPrimary, margin: 0 }}>
              Register New Patient
            </h1>
            <p style={{ color: theme.textMuted, marginTop: 4 }}>Create a patient portal account and medical record.</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              padding: '10px 20px',
              borderRadius: 10,
              color: theme.text,
              color: theme.textPrimary,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Back
          </button>
        </div>

        <Card padding="40px">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
              {/* Personal Info */}
              <section>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.primary, marginBottom: 24, borderBottom: `2px solid ${theme.primaryBg}`, paddingBottom: 8 }}>
                  Personal Details
                </h3>
                <div style={S.field}>
                  <label style={S.label(theme)}>Full Name *</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required style={S.input(theme)} />
                </div>
                <div style={S.field}>
                  <label style={S.label(theme)}>Phone Number *</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} required style={S.input(theme)} />
                </div>
                <div style={S.field}>
                  <label style={S.label(theme)}>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} style={S.input(theme)} />
                </div>
                <div style={S.field}>
                  <label style={S.label(theme)}>Date of Birth</label>
                  <input type="date" name="dob" value={form.dob} onChange={handleChange} style={S.input(theme)} />
                </div>
              </section>
 
               {/* Pregnancy Info */}
               <section>
                 <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.secondary, marginBottom: 24, borderBottom: `2px solid ${theme.secondaryBg}`, paddingBottom: 8 }}>
                   Pregnancy Status
                 </h3>
                 <div style={S.field}>
                   <label style={S.label(theme)}>Current Week</label>
                   <input type="number" name="pregnancy_week" value={form.pregnancy_week} onChange={handleChange} style={S.input(theme)} />
                 </div>
                 <div style={{ display: 'flex', gap: 16 }}>
                   <div style={{ ...S.field, flex: 1 }}>
                     <label style={S.label(theme)}>Gravida</label>
                     <input type="number" name="gravida" value={form.gravida} onChange={handleChange} style={S.input(theme)} />
                   </div>
                   <div style={{ ...S.field, flex: 1 }}>
                     <label style={S.label(theme)}>Para</label>
                     <input type="number" name="para" value={form.para} onChange={handleChange} style={S.input(theme)} />
                   </div>
                 </div>
               </section>
 
               {/* Location & Emergency */}
               <section>
                 <h3 style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginBottom: 24, borderBottom: '2px solid #ecfdf5', paddingBottom: 8 }}>
                   Emergency Contact
                 </h3>
                 <div style={S.field}>
                   <label style={S.label(theme)}>Contact Name</label>
                   <input type="text" name="emergency_name" value={form.emergency_name} onChange={handleChange} style={S.input(theme)} />
                 </div>
                 <div style={S.field}>
                   <label style={S.label(theme)}>Relationship</label>
                   <input type="text" name="emergency_relation" value={form.emergency_relation} onChange={handleChange} style={S.input(theme)} />
                 </div>
                 <div style={S.field}>
                   <label style={S.label(theme)}>Contact Phone</label>
                   <input type="tel" name="emergency_phone" value={form.emergency_phone} onChange={handleChange} style={S.input(theme)} />
                 </div>
              </section>
            </div>

            <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: theme.primary,
                  color: 'white',
                  border: 'none',
                  padding: '14px 40px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(155, 35, 53, 0.2)'
                }}
              >
                {loading ? "Registering..." : "Create Patient Portal"}
              </button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}

const S = {
  field: { marginBottom: 20 },
  label: (theme) => ({ 
    display: 'block', 
    marginBottom: 8, 
    fontWeight: 800, 
    fontSize: 13, 
    color: theme.isDark ? "#FFFFFF" : theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }),
  input: (theme) => ({
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.inputBg,
    color: theme.textPrimary,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box'
  })
};


