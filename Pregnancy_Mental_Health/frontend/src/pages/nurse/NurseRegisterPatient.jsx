import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Loader2 } from "../../components/UI";
import { api, getErrorMessage } from "../../utils/api";
import toast from "react-hot-toast";
import { User, Mail, Phone, Calendar, Droplet, Baby, Hospital, Stethoscope, Hash, Lock } from "lucide-react";
import "../../styles/RegisterPatient.css";

export default function NurseRegisterPatient() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  // const [tempPassword, setTempPassword] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    age: "",
    bloodGroup: "",
    address: "",
    city: "",
    pregnancyWeek: "",
    previousPregnancies: "0",
    hospitalName: "",
    assignedDoctor: "",
    wardBed: ""
  });
  const [tempPassword] = useState("TempPass123!");
  useEffect(() => {
    // Only fetch doctors now
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get("/nurse/doctors");
        setDoctors(data || []);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
        toast.error("Failed to load doctors");
      }
    };
  
    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Update handleSubmit - remove dummy data check
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const payload = {
        ...formData,
        // optional: keep for documentation/debug, but backend forces same temp
        password: "TempPass123!",
        role: "patient",
      };
  
      const { data } = await api.post("/nurse/register", payload);

      toast.success("Patient registered successfully!");
      toast("Temporary password: TempPass123!", { icon: "🔑" });
      // Go directly to new assessment with this patient pre-selected
      navigate(`/nurse/assessment/new?patientId=${data.patient_id}`);
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-page">
      <NurseSidebar />

      <main className="portal-main rp-main">
        <PageTitle title="Register New Patient" subtitle="Create a new mother account and set up portal access" />

        <form onSubmit={handleSubmit} className="rp-form-container">
          <div className="rp-grid">

            {/* Column 1: Personal Information */}
            <div className="rp-card">
              <div className="rp-section-title"><User size={20} /> Personal Information</div>

              <div className="rp-row">
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Full Name *</label>
                  <input className="rp-input" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Enter full name" />
                </div>
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Email Address *</label>
                  <input className="rp-input" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="patient@example.com" />
                </div>
              </div>

              <div className="rp-row">
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Phone Number *</label>
                  <input className="rp-input" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1234567890" />
                </div>
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Date of Birth *</label>
                  <input className="rp-input" type="date" name="dob" value={formData.dob} onChange={handleChange} required />
                </div>
              </div>

              <div className="rp-row">
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Age</label>
                  <input className="rp-input" type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 28" />
                </div>
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Blood Group</label>
                  <select className="rp-select" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                    <option value="">Select</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rp-row">
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Home Address</label>
                  <input className="rp-input" name="address" value={formData.address || ""} onChange={handleChange} placeholder="123 Main St" />
                </div>
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">City</label>
                  <input className="rp-input" name="city" value={formData.city || ""} onChange={handleChange} placeholder="City name" />
                </div>
              </div>
            </div>

            {/* Column 2: Pregnancy Details + Hospital Assignment */}
            <div className="rp-card">
              <div className="rp-section-title"><Baby size={20} /> Pregnancy Details</div>

              <div className="rp-row">
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Pregnancy Week</label>
                  <input className="rp-input" type="number" name="pregnancyWeek" value={formData.pregnancyWeek} onChange={handleChange} placeholder="e.g. 24" />
                </div>
              </div>

              <div className="rp-form-group">
                <label className="rp-label">Previous Pregnancies</label>
                <input className="rp-input" type="number" name="previousPregnancies" value={formData.previousPregnancies} onChange={handleChange} />
              </div>

              <div className="rp-section-title-sub"><Hospital size={20} /> Hospital Assignment</div>

              <div className="rp-form-group">
                <label className="rp-label">Assign Doctor *</label>
                <select className="rp-select" name="assignedDoctor" value={formData.assignedDoctor} onChange={handleChange} required>
                  <option value="">Select available doctor</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}> Dr. {doc.fullName} ({doc.specialization || 'OB/GYN'})</option>
                  ))}
                </select>
              </div>

              <div className="rp-row">
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Hospital (Optional)</label>
                  <input className="rp-input" name="hospitalName" value={formData.hospitalName} onChange={handleChange} placeholder="Hospital Name" />
                </div>
                <div className="rp-form-group" style={{ marginBottom: 0 }}>
                  <label className="rp-label">Ward/Bed</label>
                  <input className="rp-input" name="wardBed" value={formData.wardBed} onChange={handleChange} placeholder="Ward & Bed" />
                </div>
              </div>
            </div>
          </div>

          {/* System Generated Access */}
          <div className="rp-system-access">
            <div className="rp-system-left">
              <div className="rp-system-title">
                <Lock size={18} /> System Generated Access
              </div>
              <div className="rp-system-desc">
                Patient will use their email and this temporary password to log in.
              </div>
            </div>
            <div className="rp-system-right">
              <div className="rp-pwd-block">
                <div className="rp-pwd-label">Temporary Password</div>
                <div className="rp-pwd-value">{tempPassword}</div>
              </div>
            </div>
          </div>

          <div className="rp-footer">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rp-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rp-btn-submit"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Patient"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}


