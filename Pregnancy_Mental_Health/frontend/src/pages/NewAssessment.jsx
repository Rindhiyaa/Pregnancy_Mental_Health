import { useState, useEffect } from "react";
import "../styles/NewAssessment.css";
import "../styles/DashboardPage.css";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SafetyAlert from "../components/SafetyAlert";
import { api } from "../utils/api";
import toast from 'react-hot-toast';


export default function NewAssessment() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isReferralSent, setIsReferralSent] = useState(false);
  const [isReferralLoading, setIsReferralLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // 'saving', 'saved', 'error'
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'alert',
      title: 'Assessment Reminder',
      message: 'Complete pending assessments for better patient care',
      time: '1 hour ago',
      priority: 'medium'
    },
    {
      id: 2,
      type: 'info',
      title: 'System Update',
      message: 'New features available in the assessment tool',
      time: '2 hours ago',
      priority: 'low'
    }
  ]);

  // Get patient name from URL params if provided
  const prefilledPatientName = searchParams.get('patient') || '';
  const prefilledPatientId = searchParams.get('id') || null;

  // 🔹 PRENATAL ASSESSMENT - All fields match backend requirements
  const [formData, setFormData] = useState({
    patient_name: prefilledPatientName,
    age: "",
    residence: "",
    education_level: "",
    marital_status: "",
    partner_education: "",
    partner_income: "",
    household_members: "",
  
    relationship_inlaws: "",
    relationship_husband: "",
    support_during_pregnancy: "",
    need_more_support: "",
    trust_share_feelings: "",
    family_type: "",
  
    total_children_now: "",
    pregnancy_number: "",
    pregnancy_planned: "",
    regular_checkups: "",
    medical_conditions_pregnancy: "",
    occupation_before_surgery: "",
  
    depression_before_pregnancy: "",
    depression_during_pregnancy: "",
    fear_pregnancy_childbirth: "",
    major_life_changes_pregnancy: "",
    abuse_during_pregnancy: "",
  
    epds_1: "",
    epds_2: "",
    epds_3: "",
    epds_4: "",
    epds_5: "",
    epds_6: "",
    epds_7: "",
    epds_8: "",
    epds_9: "",
    epds_10: "",
  });
  

  // 🔹 RESULT FROM BACKEND
  const [result, setResult] = useState(null);
  const [savedAssessmentId, setSavedAssessmentId] = useState(null);
  const [patientEmail, setPatientEmail] = useState(null);
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);

  // 🔹 PATIENT MANAGEMENT
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(true); // Auto-show modal on page load
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    email: '',
    age: '',
    phone: ''
  });

  // 🔹 AUTO-SAVE FUNCTIONALITY (using localStorage)
  const autoSaveDraft = async (data) => {
    if (!data.patient_name.trim()) return; // Don't save if no patient name
    
    try {
      setAutoSaveStatus('saving');
      
      const draftKey = `ppd_draft_${data.patient_name}`;
      const draftData = {
        patient_name: data.patient_name,
        draft_data: data,
        saved_at: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setAutoSaveStatus(''), 3000); // Clear status after 3 seconds
      
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  };

  const loadDraft = async (patientName) => {
    if (!patientName.trim()) return;
    
    try {
      const draftKey = `ppd_draft_${patientName}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setFormData(draft.draft_data);
        setLastSaved(new Date(draft.saved_at));
        // Draft loaded successfully
      }
    } catch (error) {
      // Draft doesn't exist or is corrupted, which is fine
    }
  };

  // Auto-save when form data changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.patient_name.trim()) {
        autoSaveDraft(formData);
      }
    }, 2000); // Save 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Load draft when patient name is set
  useEffect(() => {
    if (formData.patient_name.trim() && !lastSaved) {
      loadDraft(formData.patient_name);
    }
  }, [formData.patient_name]);

  //handle logout

  const handleTopLogout = async () => {
    try {
      if (user?.email) {
        await api.post('/logout-status', {});
      }
    } catch (e) {
      console.error("Failed to update logout status", e);
    }

    logout();
    navigate("/");
  };


  // 🔹 HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 🔹 HANDLE STEP CHANGE - Clear result when going back from step 6
  const getTopRiskFactors = (data) => {
    const factors = [];
    if (data.depression_before_pregnancy === "Positive") factors.push("History of depression before pregnancy");
    if (data.depression_during_pregnancy === "Positive") factors.push("Experience of depression during pregnancy");
    if (data.abuse_during_pregnancy === "Yes") factors.push("History of abuse during pregnancy");
    if (data.epds_10 && parseInt(data.epds_10) > 0) factors.push("Thoughts of self-harm (EPDS Question 10)");
    if (data.relationship_husband === "Bad") factors.push("Poor relationship with partner");
    if (data.support_during_pregnancy === "No") factors.push("Lack of social support");
    if (data.major_life_changes_pregnancy === "Yes") factors.push("Major life changes during pregnancy");
    
    // Default if none identified
    if (factors.length === 0) factors.push("High EPDS total score", "AI-identified risk patterns");
    return factors.slice(0, 3);
  };

  const handleReferral = async (assessmentId = null) => {
    if (!formData.patient_name || !result) {
      toast.error("Please complete the assessment before referring.");
      return;
    }

    const finalAssessmentId = assessmentId || savedAssessmentId;
    if (!finalAssessmentId) {
      toast.error("Please save the assessment to history first before sending a referral. This ensures all clinical notes and risk factors are correctly recorded.");
      return;
    }

    if (!patientEmail && !selectedPatient?.email) {
      toast.error("Patient email is missing. Please update the patient's details with an email address to send a referral.");
      return;
    }

    if (!window.confirm(`Refer ${formData.patient_name} to the Psychiatry Department? This will send a secure clinical message with the current assessment results.`)) {
      return;
    }

    setIsReferralLoading(true);
    try {
      const payload = {
        assessment_id: finalAssessmentId,
        patient_name: formData.patient_name,
        risk_level: result.risk,
        risk_score: result.score,
        clinician_name: user?.fullName || "Clinician",
        clinician_notes: formData.notes || "",
        referral_department: "Psychiatry",
        top_risk_factors: getTopRiskFactors(formData)
      };

      const res = await api.post('/referrals', payload);
      
      if (res.ok) {
        const data = await res.json();
        setIsReferralSent(true);
        toast.success(data.message || "✅ Referral sent! Email delivered to patient.");
      } else {
        // Try to get detailed error from backend
        let errorMsg = "Failed to send referral.";
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch (e) {
          errorMsg = `Server error (${res.status})`;
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Referral failed:", err);
      toast.error(`❌ Referral failed: ${err.message}`);
    } finally {
      setIsReferralLoading(false);
    }
  };

  const handleStepChange = (newStep) => {
    if (step === 6 && newStep < 6) {
      // Clear result when going back from result page
      setResult(null);
      setShowSafetyAlert(false);
    }
    setStep(newStep);
  };

  // 🔹 PATIENT MANAGEMENT FUNCTIONS (localStorage-based)
  const loadPatients = async () => {
    try {
      const res = await api.get("/patients");
      if (!res.ok) {
        console.error("Failed to load patients:", res.status);
        setPatients([]);
        return;
      }
      const data = await res.json(); // [{id, name, age, ...}]
      setPatients(data);
      console.log(`📋 Loaded ${data.length} patients from API`);
    } catch (error) {
      console.error("Failed to load patients from API:", error);
      setPatients([]);
    }
  };

  const savePatients = (patients) => {
    try {
      localStorage.setItem('ppd_patients', JSON.stringify(patients));
      console.log(`💾 Saved ${patients.length} patients to localStorage`);
    } catch (error) {
      console.error('Failed to save patients to localStorage:', error);
    }
  };

  const generatePatientId = () => {
    // Generate a unique ID based on timestamp and random number
    return Date.now() + Math.floor(Math.random() * 1000);
  };

  // Phone validation function
  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') return true; // Phone is optional
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (at least 10 digits)
    if (cleanPhone.length < 10) {
      return false;
    }
    
    // Check if it's not just repeated digits (like 1111111111)
    if (/^(\d)\1{9,}$/.test(cleanPhone)) {
      return false;
    }
    
    return true;
  };

  const createNewPatient = async () => {
    if (!newPatientData.name.trim()) {
      toast.error("Patient name is required");
      return;
    }

    if (!newPatientData.email.trim()) {
      toast.error("Patient email is required for clinical referrals");
      return;
    }

    // Validate phone number if provided
    if (newPatientData.phone && !validatePhone(newPatientData.phone)) {
      toast.error("Please enter a valid phone number (at least 10 digits)");
      return;
    }
  
    try {
      const existingPatient = patients.find(
        (p) => p.name.toLowerCase() === newPatientData.name.trim().toLowerCase()
      );
      if (existingPatient) {
        toast.error(`Patient with name "${newPatientData.name}" already exists`);
        return;
      }
  
      const res = await api.post("/patients", {
        name: newPatientData.name.trim(),
        email: newPatientData.email.trim(),
        age: newPatientData.age ? parseInt(newPatientData.age) : null,
        phone: newPatientData.phone.trim() || null,
      });
  
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Failed to create patient:", res.status, body);
        toast.error(body?.detail || "Failed to create patient");
        return;
      }
  
      const newPatient = await res.json(); // has DB id
      const updatedPatients = [newPatient, ...patients];
      setPatients(updatedPatients);
  
      selectPatient(newPatient);
      setShowCreatePatient(false);
      setNewPatientData({ name: "", email: "", age: "", phone: "" });
      toast.success("Patient created successfully!");
  
      console.log(`✅ Created patient: ${newPatient.name} (ID: ${newPatient.id})`);
    } catch (error) {
      console.error("Failed to create patient:", error);
      toast.error(`Failed to create patient: ${error.message}`);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patient_name: patient.name }));
    setPatientSearch('');
  };

  // Load patients on component mount and handle URL params
  useEffect(() => {
    loadPatients(); // Now synchronous localStorage calll
  }, []);

  // Auto-select patient if ID is provided in URL
  useEffect(() => {
    if (prefilledPatientId && patients.length > 0) {
      const patient = patients.find(p => p.id.toString() === prefilledPatientId.toString());
      if (patient) {
        selectPatient(patient);
        console.log(`🎯 Auto-selected patient from URL: ${patient.name} (ID: ${patient.id})`);
      }
    }
  }, [prefilledPatientId, patients]);

  // Filter patients based on search
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // 🔹 FINAL SUBMIT - All 34 required fields organized by section
  const REQUIRED_FIELDS = [
    // Demographics (7 fields)
    "age", "residence", "education_level", "marital_status",
    "partner_education", "partner_income", "household_members",
    
    // Relationships & Support (6 fields)
    "relationship_inlaws", "relationship_husband", 
    "support_during_pregnancy", "need_more_support",
    "trust_share_feelings", "family_type",
    
    // Obstetric & Pregnancy (6 fields)
    "total_children_now", "pregnancy_number",
    "pregnancy_planned", "regular_checkups",
    "medical_conditions_pregnancy", "occupation_before_surgery",
    
    // Mental Health (5 fields)
    "depression_before_pregnancy", "depression_during_pregnancy",
    "fear_pregnancy_childbirth", "major_life_changes_pregnancy",
    "abuse_during_pregnancy",
    
    // EPDS Assessment (10 fields)
    "epds_1", "epds_2", "epds_3", "epds_4", "epds_5",
    "epds_6", "epds_7", "epds_8", "epds_9", "epds_10"
  ];

  const submitAssessment = async () => {
    // Validate all required fields
    for (const f of REQUIRED_FIELDS) {
      const v = formData[f];
      if (!v) {
        toast.error(`Please answer all questions before generating risk. Missing: ${f.replace(/_/g, ' ')}`);
        return;
      }
    }
    
    try {
      console.log("Submitting assessment for prediction...");
      console.log("Form data:", formData);
      
      const res = await api.post('/assessments/predict', formData);
  
      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error("Prediction error:", res.status, errorText);
        toast.error(`Could not generate risk score. Server error: ${res.status}`);
        return;
      }
  
      const data = await res.json();
      console.log("Prediction response:", data);
      
      setResult({ risk: data.risk_level, score: data.score });
      toast.success("AI risk assessment generated successfully!");
      
      // Show safety alert only for High Risk
      if (data.risk_level === "High Risk") {
        setShowSafetyAlert(true);
      }
      
      setStep(6);
    } catch (err) {
      console.error("Backend error:", err);
      toast.error(`Could not generate risk score. Network error: ${err.message}`);
    }
  };
  


  // Calculate EPDS score from form data
  const calculateEPDSScore = () => {
    let total = 0;
    for (let i = 1; i <= 10; i++) {
      const value = parseInt(formData[`epds_${i}`]) || 0;
      total += value;
    }
    return total;
  };

  // Determine risk level based on EPDS score
  const getRiskLevel = (score) => {
    if (score >= 13) return "High Risk";
    if (score >= 10) return "Moderate Risk";
    return "Low Risk";
  };


  return (
    <div className="new-assessment-page">
      {/* Safety Alert - Modal popup when critical risk detected */}
      {showSafetyAlert && (
        <SafetyAlert 
          epdsData={formData}
          patientName={formData.patient_name}
          onAcknowledge={() => setShowSafetyAlert(false)}
        />
      )}
      
      <header className="dp-navbar">
        <div className="dp-nav-left">
          <div className="dp-logo-mark"></div>
          <div className="dp-logo-text">
            <span>Postpartum Risk Insight</span>
            <span>Clinician dashboard</span>
          </div>
        </div>

        <nav className="dp-nav-center">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/new-assessment"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            New Assessment
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
            }
          >
            History
          </NavLink>
          <NavLink to="/patients" className={({isActive}) => 
            `dp-nav-link ${isActive ? "dp-nav-link-active" : ""}`}>
            Patients
          </NavLink>
        </nav>

        <div className="dp-nav-right">
          <button 
            className="dp-notifications-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifications.length > 0 && <span className="dp-notification-badge">{notifications.length}</span>}
          </button>
          
          <div className="dp-profile-wrapper">
            <div 
              className="dp-profile-chip"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="dp-profile-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="dp-profile-name">{user?.fullName || 'Clinician'}</span>
              <svg className="dp-profile-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>

            {showProfileMenu && (
              <div className="dp-profile-dropdown">
                <div 
                  className="dp-dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileMenu(false);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Profile</span>
                </div>
                <div 
                  className="dp-dropdown-item dp-dropdown-logout"
                  onClick={() => {
                    handleTopLogout();
                    setShowProfileMenu(false);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h2 className="logo">PPD Prediction</h2>
          <div className="step-nav">
            <div
              className={step === 1 ? "step active" : "step clickable"}
              onClick={() => handleStepChange(1)}
            >
              Demographics
            </div>
            <div
              className={step === 2 ? "step active" : "step clickable"}
              onClick={() => handleStepChange(2)}
            >
              Relationships & Support
            </div>
            <div
              className={step === 3 ? "step active" : "step clickable"}
              onClick={() => handleStepChange(3)}
            >
              Obstetric & Pregnancy Related Factors
            </div>
            <div
              className={step === 4 ? "step active" : "step clickable"}
              onClick={() => handleStepChange(4)}
            >
              Mental Health History
            </div>
            <div
              className={step === 5 ? "step active" : "step clickable"}
              onClick={() => handleStepChange(5)}
            >
              EPDS Assessment
            </div>
            <div
              className={step === 6 ? "step active" : "step clickable"}
              onClick={() => handleStepChange(6)}
            >
              Result
            </div>
            <div
              className={step === 7 ? "step active" : "step clickable"}
              onClick={() => handleStepChange(7)}
            >
              Clinician Summary
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          {/* <div className="page-header">
          <h1>New Assessment</h1>
          <p className="subtitle">Postpartum depression risk screening</p>
        </div> */}

          {/* Show card for steps 1-5 and step 7 (not step 6) */}
          {step >= 1 && step <= 7 && step !== 6 && (
            <section className="card">
              
              {/* Selected Patient Info Bar */}
              {selectedPatient && (
                <div className="selected-patient-info-bar">
                  <div className="patient-info-content">
                    <div className="patient-avatar-small">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="patient-details-small">
                      <span className="patient-name-small">{selectedPatient.name}</span>
                      <span className="patient-meta-small">
                        ID: #{selectedPatient.id}
                        {selectedPatient.age && ` • Age: ${selectedPatient.age}`}
                        {selectedPatient.phone && ` • ${selectedPatient.phone}`}
                      </span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowPatientModal(true)}
                    className="change-patient-small-btn"
                  >
                    Change Patient
                  </button>
                </div>
              )}
              
              {/* Auto-save Status Indicator */}
              {autoSaveStatus && (
                <div className={`auto-save-status ${autoSaveStatus}`}>
                  {autoSaveStatus === 'saving' && '💾 Saving draft...'}
                  {autoSaveStatus === 'saved' && '✅ Draft saved'}
                  {autoSaveStatus === 'error' && '❌ Save failed'}
                  {lastSaved && autoSaveStatus === 'saved' && (
                    <span className="last-saved">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}

              {/* STEP 1 – DEMOGRAPHICS */}
              {step === 1 && (
                <>
                  <div className="card-header">
                    <h2>Demographics</h2>
                    <p>Basic patient information (7 questions)</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="highlight">Patient Name</label>
                      <input
                        name="patient_name"
                        value={formData.patient_name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="form-group">
                      <label>What is your Age? (18-50)</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="18-50"
                        min="18"
                        max="50"
                      />
                    </div>

                    <div className="form-group">
                      <label>Where do you live?</label>
                      <select
                        name="residence"
                        value={formData.residence}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="City">City</option>
                        <option value="Village">Village</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Highest education level?</label>
                      <select
                        name="education_level"
                        value={formData.education_level}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="University">University</option>
                        <option value="College">College</option>
                        <option value="High School">High School</option>
                        <option value="Primary School">Primary School</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Marital status?</label>
                      <select
                        name="marital_status"
                        value={formData.marital_status}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced/Unmarried</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Husband's/Partner's education level?</label>
                      <select
                        name="partner_education"
                        value={formData.partner_education}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="University">University</option>
                        <option value="College">College</option>
                        <option value="High School">High School</option>
                        <option value="Primary School">Primary School</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Family's monthly income?</label>
                      <select
                        name="partner_income"
                        value={formData.partner_income}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="5000-10000">5000-10000</option>
                        <option value="10000-20000">10000-20000</option>
                        <option value="20000-30000">20000-30000</option>
                        <option value=">30000">&gt;30000</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>How many people live in your household?</label>
                      <select
                        name="household_members"
                        value={formData.household_members}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="2 to 5">2 to 5</option>
                        <option value="6 to 8">6 to 8</option>
                        <option value="9 or more">9 or more</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2 – RELATIONSHIPS & SUPPORT */}
              {step === 2 && (
                <>
                  <div className="card-header">
                    <h2>Relationships & Support</h2>
                    <p>Information about your relationships and support system (6 questions)</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Relationship with in-laws?</label>
                      <select
                        name="relationship_inlaws"
                        value={formData.relationship_inlaws}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Good">Good</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Friendly">Friendly</option>
                        <option value="Bad">Bad</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Relationship with husband/Partner?</label>
                      <select
                        name="relationship_husband"
                        value={formData.relationship_husband}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Good">Good</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Friendly">Friendly</option>
                        <option value="Bad">Bad</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Support from family/friends during pregnancy?</label>
                      <select
                        name="support_during_pregnancy"
                        value={formData.support_during_pregnancy}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Do you feel you need more support?</label>
                      <select
                        name="need_more_support"
                        value={formData.need_more_support}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Is there Someone you can trust and share your feelings with?</label>
                      <select
                        name="trust_share_feelings"
                        value={formData.trust_share_feelings}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>What is your Family type?</label>
                      <select
                        name="family_type"
                        value={formData.family_type}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Nuclear">Nuclear</option>
                        <option value="Joint">Joint</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3 – PREGNANCY HISTORY OBSTETRIC & PREGNANCY-RELATED FACTORS */}
              {step === 3 && (
                <>
                  <div className="card-header">
                    <h2>Obstetric & Pregnancy Related Factors</h2>
                    <p>Information about your pregnancy history (6 questions)</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>How many total children do you have until now?</label>
                      <select
                        name="total_children_now"
                        value={formData.total_children_now}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Zero">Zero</option>
                        <option value="One">One</option>
                        <option value="Two">Two</option>
                       
                      </select>
                    </div>

                    <div className="form-group">
                      <label>What number pregnancy is this?</label>
                      <select
                        name="pregnancy_number"
                        value={formData.pregnancy_number}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                    </div>

                    {/* <div className="form-group">
                      <label>Pregnancy length?</label>
                      <select
                        name="pregnancy_length"
                        value={formData.pregnancy_length}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Less than 5m">Less than 5m</option>
                        <option value="6m">6m</option>
                        <option value="7m">7m</option>
                        <option value="8m">8m</option>
                        <option value="9m">9m</option>
                        <option value="10m">10m</option>
                      </select>
                    </div> */}

                    <div className="form-group">
                      <label>Was this pregnancy planned?</label>
                      <select
                        name="pregnancy_planned"
                        value={formData.pregnancy_planned}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Have you attended Regular antenatal checkups?</label>
                      <select
                        name="regular_checkups"
                        value={formData.regular_checkups}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Did you have Medical conditions during pregnancy?</label>
                      <select
                        name="medical_conditions_pregnancy"
                        value={formData.medical_conditions_pregnancy}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="None">None</option>
                        <option value="Non-Chronic">Non-Chronic conditions</option>
                        <option value="Chronic">Chronic conditions</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>What is your occupation during pregnancy?</label>
                      <select
                        name="occupation_before_surgery"
                        value={formData.occupation_before_surgery}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        
                        <option value="Housewife">HouseWife</option>
                        <option value="Student">Student</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              {/* STEP 4 – MENTAL HEALTH HISTORY */}
              {step === 4 && (
                <>
                  <div className="card-header">
                    <h2>Mental Health History</h2>
                    <p>Information about your mental health history (5 questions)</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Did you experience depression BEFORE this pregnancy?</label>
                      <select
                        name="depression_before_pregnancy"
                        value={formData.depression_before_pregnancy}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Did you experience depression DURING this pregnancy?</label>
                      <select
                        name="depression_during_pregnancy"
                        value={formData.depression_during_pregnancy}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Positive">Positive</option>
                        <option value="Negative">Negative</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Do you have FEAR about pregnancy or childbirth?</label>
                      <select
                        name="fear_pregnancy_childbirth"
                        value={formData.fear_pregnancy_childbirth}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Have you experienced Major life changes during pregnancy?</label>
                      <select
                        name="major_life_changes_pregnancy"
                        value={formData.major_life_changes_pregnancy}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Have you experienced any ABUSE during pregnancy?</label>
                      <select
                        name="abuse_during_pregnancy"
                        value={formData.abuse_during_pregnancy}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 5 – EPDS ASSESSMENT */}
              {step === 5 && (
                <>
                  <div className="card-header">
                    <h2>EPDS Assessment</h2>
                    <p>Edinburgh Postnatal Depression Scale - Answer based on how you felt during the past 7 days (10 questions)</p>
                  </div>

                  <div className="form-grid">

                    <div className="form-group">
                      <label>1. I have been able to laugh and see the funny side of things</label>
                      <select name="epds_1" value={formData.epds_1} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="3">As much as I always could</option>
                        <option value="2">Not quite so much now</option>
                        <option value="1">Definitely not so much now</option>
                        <option value="0">Not at all</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>2. I have looked forward with enjoyment to things</label>
                      <select name="epds_2" value={formData.epds_2} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="3">As much as I ever did</option>
                        <option value="2">Rather less than I used to</option>
                        <option value="1">Definitely less than I used to</option>
                        <option value="0">Hardly at all</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>3. I have blamed myself unnecessarily when things went wrong</label>
                      <select name="epds_3" value={formData.epds_3} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="3">Yes, most of the time</option>
                        <option value="2">Yes, some of the time</option>
                        <option value="1">Not very often</option>
                        <option value="0">No, never</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>4. I have been anxious or worried for no good reason</label>
                      <select name="epds_4" value={formData.epds_4} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="0">No, not at all</option>
                        <option value="1">Hardly ever</option>
                        <option value="2">Yes, sometimes</option>
                        <option value="3">Yes, very often</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>5. I have felt scared or panicky for no very good reason</label>
                      <select name="epds_5" value={formData.epds_5} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="3">Yes, quite a lot</option>
                        <option value="2">Yes, sometimes</option>
                        <option value="1">No, not much</option>
                        <option value="0">No, not at all</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>6. Things have been getting on top of me</label>
                      <select name="epds_6" value={formData.epds_6} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="3">Yes, most of the time I haven't been able to cope at all</option>
                        <option value="2">Yes, sometimes I haven't been coping as well as usual</option>
                        <option value="1">No, most of the time I have coped quite well</option>
                        <option value="0">No, I have been coping as well as ever</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>7. I have been so unhappy that I have had difficulty sleeping</label>
                      <select name="epds_7" value={formData.epds_7} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="3">Yes, most of the time</option>
                        <option value="2">Yes, sometimes</option>
                        <option value="1">Not very often</option>
                        <option value="0">No, not at all</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>8. I have felt sad or miserable</label>
                      <select name="epds_8" value={formData.epds_8} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="3">Yes, most of the time</option>
                        <option value="2">Yes, quite often</option>
                        <option value="1">Not very often</option>
                        <option value="0">No, not at all</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>9. I have been so unhappy that I have been crying</label>
                      <select name="epds_9" value={formData.epds_9} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="3">Yes, most of the time</option>
                        <option value="2">Yes, quite often</option>
                        <option value="1">Only occasionally</option>
                        <option value="0">No, never</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>10. The thought of harming myself has occurred to me</label>
                      <select name="epds_10" value={formData.epds_10} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="3">Yes, quite often</option>
                        <option value="2">Sometimes</option>
                        <option value="1">Hardly ever</option>
                        <option value="0">Never</option>
                      </select>
                    </div>

                  </div>
                </>
              )}


              {/* STEP 7 – CLINICIAN SUMMARY */}
              {step === 7 && (
                <>
                  <div className="card-header">
                    <h2>Clinician Summary</h2>
                    <p>Complete your clinical assessment and recommendations</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Overall Clinician Risk Level</label>
                      <select name="clinician_risk" value={formData.clinician_risk} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Recommended Plan</label>
                      <select name="plan" value={formData.plan} onChange={handleChange}>
                        <option value="">Select</option>
                        <option value="Routine follow-up">Routine follow-up</option>
                        <option value="Early follow-up">Early follow-up</option>
                        <option value="Refer to mental health specialist">Refer to mental health specialist</option>
                        <option value="Emergency intervention">Emergency intervention</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                      <label>Clinical Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes || ""}
                        onChange={handleChange}
                        placeholder="Enter clinical observations, recommendations, and follow-up notes..."
                        rows={4}
                        style={{
                          borderRadius: "8px",
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "inherit"
                        }}
                      />
                    </div>
                  </div>

                  <div className="clinician-summary-actions">
                    <button
                      className="save-to-history-btn"
                      onClick={async () => {
                        // Check if user is authenticated
                        if (!user?.isAuthenticated || !user?.email) {
                          toast.error("You must be signed in to save assessments. Please sign in and try again.");
                          navigate("/signin");
                          return;
                        }

                        // Validate required fields
                        if (!formData.patient_name) {
                          toast.error("Please enter patient name before saving.");
                          return;
                        }

                        if (!formData.clinician_risk) {
                          toast.error("Please select clinician risk level before saving.");
                          return;
                        }

                        if (!formData.plan) {
                          toast.error("Please select a recommended plan before saving.");
                          return;
                        }

                        if (!result) {
                          toast.error("Please generate the result before saving.");
                          return;
                        }

                        // Use AI risk directly (e.g. "Low Risk" / "Moderate Risk" / "High Risk")
                        const riskLevel = result.risk;

                        const payload = {
                          patient_name: formData.patient_name,
                          patient_id: selectedPatient?.id || prefilledPatientId || null,
                          risk_level: riskLevel,
                          score: result.score,
                          clinician_risk: formData.clinician_risk, // "Low" | "Medium" | "High"
                          plan: formData.plan,
                          notes: formData.notes,
                          clinician_email: user?.email || "",
                          raw_data: formData, // optional: full questionnaire
                        };

                        try {
                          console.log("Saving assessment with automatic refresh...");
                          console.log("Payload:", payload);
                          
                          const res = await api.post('/assessments', payload);

                          if (!res.ok) {
                            const errorText = await res.text();
                            console.error("Save assessment failed:", res.status, errorText);
                            
                            if (res.status === 401) {
                              toast.error("Your session has expired. Please sign in again to save the assessment.");
                              navigate("/signin");
                              return;
                            }
                            
                            throw new Error(`Failed to save assessment: ${res.status} - ${errorText}`);
                          }

                          const saved = await res.json(); // contains id, dates, etc.
                          setSavedAssessmentId(saved.id);
                          setPatientEmail(saved.patient_email);

                          // Mirror into localStorage as cache
                          const existingHistory = JSON.parse(
                            localStorage.getItem("assessmentHistory") || "[]"
                          );
                          existingHistory.push(saved);
                          localStorage.setItem(
                            "assessmentHistory",
                            JSON.stringify(existingHistory)
                          );
                          if (user?.email) {
                            localStorage.setItem(
                              `assessmentHistory_${user.email}`,
                              JSON.stringify(existingHistory)
                            );
                          }

                          toast.success(
                            `Assessment for ${formData.patient_name} saved to history successfully!`
                          );
                          navigate("/history");
                        } catch (err) {
                          console.error("Error saving assessment", err);
                          console.error("Payload sent:", payload);
                          
                          if (err.message && err.message.includes("401")) {
                            toast.error("Your session has expired. Please sign in again to save the assessment.");
                            navigate("/signin");
                          } else if (err.message && err.message.includes("Network")) {
                            toast.error("Network error. Please check your connection and try again.");
                          } else {
                            toast.error(`Could not save assessment: ${err.message}`);
                          }
                        }
                      }}
                    >
                      Save to History
                    </button>

                    <button
                      className="pp-btn-new"
                      onClick={() => {
                        // Reset form and start new assessment
                        window.location.reload();
                      }}
                    >
                      New Assessment
                    </button>
                  </div>
                </>
              )}


              {/* NAV BUTTONS - Show for steps 1-5, hide only on step 6 (result page) */}
              {step !== 6 && step < 7 && (
                <div className="actions">
                  <button disabled={step === 1} onClick={() => handleStepChange(step - 1)}>
                    ← Previous
                  </button>

                  <button onClick={() => handleStepChange(step + 1)}>
                    Next →
                  </button>
                </div>
              )}

              {/* NAV BUTTONS for step 7 - only show Previous */}
              {step === 7 && (
                <div className="actions">
                  <button onClick={() => handleStepChange(step - 1)}>
                    ← Previous
                  </button>
                </div>
              )}

            </section>
          )}

          {/* Step 6 - Generate button (no white box) */}
          {step === 6 && !result && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <button
                className="submit-btn"
                onClick={submitAssessment}
              >
                Generate AI Risk Assessment
              </button>
            </div>
          )}

          {/* Result card appears outside the main card when result is generated */}
          {step === 6 && result && (
            <div className="result-card">
              <div className="result-header">
                <div className="result-tag">ASSESSMENT COMPLETE</div>
              </div>

              <h3>Risk Assessment Results</h3>

              <div className="score">{Number(result.score).toFixed(2)}</div>

              <div className="risk-container">
                <div className={`risk-badge ${result.risk === 'Low Risk' ? 'risk-low' :
                  result.risk === 'Moderate Risk' ? 'risk-moderate' : 'risk-high'
                  }`}>
                  {result.risk}
                </div>
              </div>

              <p>
                Based on the comprehensive assessment, the AI model has calculated a risk score of {Math.round(result.score)} out of 100.
                This indicates a {result.risk.toLowerCase()} for postpartum depression.
              </p>

              <div className="result-actions">
                <button
                  className="save-result-btn"
                  onClick={() => handleStepChange(7)}
                >
                  Continue to Clinical Summary
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="dp-notifications-panel">
          <div className="dp-notifications-header">
            <h3>Notifications</h3>
            <button onClick={() => setShowNotifications(false)}>✕</button>
          </div>
          <div className="dp-notifications-content">
            {notifications.map((notification) => (
              <div key={notification.id} className={`dp-notification-item dp-notification-${notification.priority}`}>
                <div className="dp-notification-icon">
                  {notification.type === 'alert' ? '⚠️' : notification.type === 'success' ? '✅' : 'ℹ️'}
                </div>
                <div className="dp-notification-content">
                  <div className="dp-notification-title">{notification.title}</div>
                  <div className="dp-notification-message">{notification.message}</div>
                  <div className="dp-notification-time">{notification.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Selection Modal */}
      {showPatientModal && (
        <div className="patient-modal-overlay" onClick={(e) => {
          // Prevent closing if no patient is selected
          if (!selectedPatient) {
            e.preventDefault();
            return;
          }
          setShowPatientModal(false);
        }}>
          <div className="patient-modal" onClick={(e) => e.stopPropagation()}>
            <div className="patient-modal-header">
              <h2>Select Patient to Continue</h2>
              <button 
                className="patient-modal-close" 
                onClick={() => {
                  if (selectedPatient) {
                    setShowPatientModal(false);
                  } else {
                    // If no patient selected, navigate back to dashboard
                    navigate('/dashboard');
                  }
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="patient-modal-body">
              {!selectedPatient && (
                <div className="patient-selection-required">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <h3>Patient Selection Required</h3>
                  <p>Please select an existing patient or create a new one to start the assessment.</p>
                </div>
              )}
              
              {/* Search Bar */}
              <div className="patient-search-section">
                <div className="search-input-container">
                 
                  <input
                    type="text"
                    placeholder="Search patients by name..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="patient-search-modal-input"
                    autoFocus
                  />
                </div>
              </div>

              {/* Patient List */}
              <div className="patient-list-section">
                <div className="patient-list-header">
                  <span>Available Patients ({filteredPatients.length})</span>
                </div>
                
                <div className="patient-list-container">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className={`patient-list-item ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
                        onClick={() => {
                          selectPatient(patient);
                          setShowPatientModal(false);
                          setPatientSearch('');
                        }}
                      >
                        <div className="patient-avatar">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                        <div className="patient-list-info">
                          <div className="patient-list-name">{patient.name}</div>
                          <div className="patient-list-meta">
                            <span className="patient-list-id">ID: #{patient.id}</span>
                            {patient.age && <span className="patient-list-age">Age: {patient.age}</span>}
                            {patient.phone && <span className="patient-list-phone">📞 {patient.phone}</span>}
                          </div>
                        </div>
                        {selectedPatient?.id === patient.id && (
                          <div className="selected-checkmark">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-patients-found">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                      <p>No patients found</p>
                      <span>Try adjusting your search or create a new patient</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Create New Patient Section */}
              <div className="create-patient-modal-section">
                {!showCreatePatient ? (
                  <button 
                    type="button"
                    onClick={() => setShowCreatePatient(true)}
                    className="create-new-patient-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="16"/>
                      <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    Create New Patient
                  </button>
                ) : (
                  <div className="create-patient-form-modal">
                    <div className="create-form-header">
                      <h3>Add New Patient</h3>
                      <button 
                        type="button"
                        onClick={() => {
                          setShowCreatePatient(false);
                          setNewPatientData({ name: '', email: '', age: '', phone: '' });
                        }}
                        className="cancel-create-btn"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="create-form-fields">
                      <div className="modal-form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          placeholder="Enter patient full name"
                          value={newPatientData.name}
                          onChange={(e) => setNewPatientData({...newPatientData, name: e.target.value})}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          placeholder="e.g. patient@example.com"
                          value={newPatientData.email}
                          onChange={(e) => setNewPatientData({...newPatientData, email: e.target.value})}
                        />
                      </div>
                      <div className="modal-form-row">
                        <div className="modal-form-group">
                          <label>Age</label>
                          <input
                            type="number"
                            placeholder="e.g. 24"
                            value={newPatientData.age}
                            min="10" max="70"
                            onChange={(e) => setNewPatientData({...newPatientData, age: e.target.value})}
                          />
                        </div>
                        <div className="modal-form-group">
                          <label>Phone</label>
                          <input
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={newPatientData.phone}
                            onChange={(e) => setNewPatientData({...newPatientData, phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="create-form-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreatePatient(false);
                          setNewPatientData({ name: '', email: '', age: '', phone: '' });
                        }}
                        className="modal-cancel-btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          createNewPatient();
                          setShowPatientModal(false);
                          setPatientSearch('');
                        }}
                        disabled={!newPatientData.name.trim()}
                        className="modal-create-btn"
                      >
                        Create Patient
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
