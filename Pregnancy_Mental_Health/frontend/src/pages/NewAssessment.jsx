import { useState, useEffect } from "react";
import "../styles/NewAssessment.css";
import "../styles/DashboardPage.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


export default function NewAssessment() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { user, logout } = useAuth();


  // 🔹 ONE SINGLE FORM DATA OBJECT
  const [formData, setFormData] = useState({
    patient_name: "",
    age: "",
    education_level: "",
    employment_status: "",
    delivery_type: "",
    delivery_complications: "",
    past_obstetric: "",
    medical_conditions: "",
    sleep_quality: "",
    anxiety_level: "",
    stress_level: "",
    fatigue_level: "",
    pain_level: "",
    appetite: "",
    energy_level: "",
    history_depression: "",
    history_anxiety: "",
    previous_treatment: "",
    family_support: "",
    partner_support: "",
    living_situation: "",
    social_network: "",
    additional_support: "",
    major_life_events: "",
    financial_stress: "",
    employment_status_current: "",
    relationship_stress: "",
    caregiving_responsibilities: "",
    self_harm: "",
    harm_baby: "",
    safety_concern: "",
    clinician_risk: "",
    plan: "",
    notes: "",
    // EPDS questions
    epds_1: "",
    epds_2: "",
    epds_3: "",
    epds_4: "",
    epds_5: "",
    epds_6: "",
    epds_7: "",
    epds_8: "",
    epds_9: "",
    epds_10: ""
  });

  // 🔹 RESULT FROM BACKEND
  const [result, setResult] = useState(null);

  // 🔹 HANDLE INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 🔹 FINAL SUBMIT (API READY)
  const submitAssessment = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Unable to generate risk score");
      }
  
      const data = await res.json();
      setResult({ risk: data.risk_level, score: data.score });
    } catch (err) {
      console.error("Backend error:", err);
      
      // Mock result data for UI testing
      const mockResults = [
        { risk: "Low Risk", score: 25 },
        { risk: "Moderate Risk", score: 62 },
        { risk: "High Risk", score: 85 },
        { risk: "Low Risk", score: 18 },
        { risk: "Moderate Risk", score: 55 },
        { risk: "High Risk", score: 92 }
      ];
      
      // Select a random mock result
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      
      // Add slight delay to simulate API call
      setTimeout(() => {
        setResult(randomResult);
      }, 1000);
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
    <>
    <header className="dp-navbar">
  <div className="dp-nav-left">
    <div className="dp-logo-mark">PR</div>
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
      to="/dashboard/new-assessment"
      className={({ isActive }) =>
        "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
      }
    >
      New Assessment
    </NavLink>

    <NavLink
      to="/dashboard/history"
      className={({ isActive }) =>
        "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
      }
    >
      History
    </NavLink>

    <NavLink
      to="/dashboard/profile"
      className={({ isActive }) =>
        "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
      }
    >
      Profile
    </NavLink>
  </nav>

  <div className="dp-nav-right">
    <div className="dp-profile-chip">
      <div className="dp-profile-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <span className="dp-profile-name">{user?.fullName || 'Clinician'}</span>
    </div>

    <button className="dp-logout-btn" onClick={() => {
      logout();
      navigate("/");
    }}>
      Logout
    </button>
  </div>
</header>
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2 className="logo">PPD Prediction</h2>
        <div className="step-nav">
          <div className={step === 1 ? "step active" : "step"}>Demographics</div>
          <div className={step === 2 ? "step active" : "step"}>Obstetric & Medical</div>
          <div className={step === 3 ? "step active" : "step"}>Mental Well-being</div>
          <div className={step === 4 ? "step active" : "step"}>Social Support</div>
          <div className={step === 5 ? "step active" : "step"}>Life Stressors</div>
          <div className={step === 6 ? "step active" : "step"}>EPDS Assessment</div>
          <div className={step === 7 ? "step active" : "step"}>Result</div>
          <div className={step === 8 ? "step active" : "step"}>Clinician Summary</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* <div className="page-header">
          <h1>New Assessment</h1>
          <p className="subtitle">Postpartum depression risk screening</p>
        </div> */}

        <section className="card">

          {/* STEP 1 – DEMOGRAPHICS */}
          {step === 1 && (
            <>
              <div className="card-header">
                <h2>Demographics</h2>
                <p>Basic patient information</p>
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
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Education Level</label>
                  <select
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="School">School</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Employment Status</label>
                  <select
                    name="employment_status"
                    value={formData.employment_status}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Employed">Employed</option>
                    <option value="Unemployed">Unemployed</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 – MEDICAL */}
          {step === 2 && (
            <>
              <div className="card-header">
                <h2>Medical History</h2>
                <p>Delivery and obstetric information</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Type of Delivery</label>
                  <select
                    name="delivery_type"
                    value={formData.delivery_type}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="C-Section">C-Section</option>
                    <option value="Assisted">Assisted (forceps/vacuum)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Delivery Complications</label>
                  <select
                    name="delivery_complications"
                    value={formData.delivery_complications}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Gestational diabetes">Gestational diabetes</option>
                    <option value="Pre-eclampsia">Pre-eclampsia</option>
                    <option value="Postpartum hemorrhage">Postpartum hemorrhage</option>
                    <option value="Preterm birth">Preterm birth</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Past Obstetric History</label>
                  <select
                    name="past_obstetric"
                    value={formData.past_obstetric}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Miscarriage">Miscarriage</option>
                    <option value="Stillbirth">Stillbirth</option>
                    <option value="NICU admission">NICU admission</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Medical Conditions</label>
                  <select
                    name="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="Thyroid disorder">Thyroid disorder</option>
                    <option value="Hypertension">Hypertension</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Anemia">Anemia</option>
                    <option value="Other">Other</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* STEP 3 – MENTAL WELL-BEING */}
          {step === 3 && (
            <>
              <div className="card-header">
                <h2>Mental Well-being</h2>
                <p>Your emotional and physical health</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Sleep Quality (last week)</label>
                  <select name="sleep_quality" value={formData.sleep_quality} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Very good">Very good</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Anxiety Level</label>
                  <select name="anxiety_level" value={formData.anxiety_level} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Stress Level</label>
                  <select name="stress_level" value={formData.stress_level} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Fatigue Level</label>
                  <select name="fatigue_level" value={formData.fatigue_level} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="None">None</option>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Pain / Discomfort</label>
                  <select name="pain_level" value={formData.pain_level} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="None">None</option>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Appetite</label>
                  <select name="appetite" value={formData.appetite} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Reduced">Reduced</option>
                    <option value="Increased">Increased</option>
                    <option value="Very Poor">Very Poor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Energy for Daily Activities</label>
                  <select name="energy_level" value={formData.energy_level} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Normal">Normal</option>
                    <option value="Slightly reduced">Slightly reduced</option>
                    <option value="Much reduced">Much reduced</option>
                    <option value="Unable to manage">Unable to manage</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>History of Depression before this pregnancy</label>
                  <select name="history_depression" value={formData.history_depression} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Unsure">Unsure</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>History of Anxiety / Panic</label>
                  <select name="history_anxiety" value={formData.history_anxiety} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Unsure">Unsure</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Previous Psychiatric Treatment</label>
                  <select name="previous_treatment" value={formData.previous_treatment} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Counseling / Therapy">Counseling / Therapy</option>
                    <option value="Antidepressant Medication">Antidepressant Medication</option>
                    <option value="Psychiatric Admission">Psychiatric Admission</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
            </>
          )}
          {/* STEP 4 – SOCIAL SUPPORT */}
{step === 4 && (
  <>
    <div className="card-header">
      <h2>Social Support</h2>
      <p>Information about your support system</p>
    </div>

    <div className="form-grid">
      {/* Family Support */}
      <div className="form-group">
        <label>Family Support</label>
        <select
          name="family_support"
          value={formData.family_support}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="Strong">Strong</option>
        </select>
      </div>

      {/* Partner Support */}
      <div className="form-group">
        <label>Partner Support</label>
        <select
          name="partner_support"
          value={formData.partner_support}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Low">Low</option>
          <option value="Moderate">Moderate</option>
          <option value="Strong">Strong</option>
        </select>
      </div>

      {/* Living Situation */}
      <div className="form-group">
        <label>Living Situation</label>
        <select
          name="living_situation"
          value={formData.living_situation}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Alone">Alone</option>
          <option value="With partner">With partner</option>
          <option value="With family">With family</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Social Network */}
      <div className="form-group">
        <label>Social Network / Friends</label>
        <select
          name="social_network"
          value={formData.social_network}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Weak">Weak</option>
          <option value="Moderate">Moderate</option>
          <option value="Strong">Strong</option>
        </select>
      </div>

      {/* Additional Support Systems */}
      <div className="form-group">
        <label>Additional Support Systems</label>
        <select
          name="additional_support"
          value={formData.additional_support}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Healthcare professionals">Healthcare professionals</option>
          <option value="Community groups">Community groups</option>
          <option value="None">None</option>
        </select>
      </div>
    </div>
  </>
)}

         {/* STEP 5 – LIFE STRESSORS */}
{step === 5 && (
  <>
    <div className="card-header">
      <h2>Life Stressors</h2>
      <p>Patient’s psychosocial stress factors</p>
    </div>

    <div className="form-grid">
      {/* Recent Major Life Events */}
      <div className="form-group">
        <label>Recent Major Life Events</label>
        <select
          name="major_life_events"
          value={formData.major_life_events}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Job loss">Job loss</option>
          <option value="Bereavement">Bereavement</option>
          <option value="Relationship breakup">Relationship breakup</option>
          <option value="Moving house">Moving house</option>
          <option value="Serious illness in family">Serious illness in family</option>
          <option value="None">None</option>
        </select>
      </div>

      {/* Financial Stress */}
      <div className="form-group">
        <label>Financial Stress</label>
        <select
          name="financial_stress"
          value={formData.financial_stress}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Stable/comfortable">Stable/comfortable</option>
          <option value="Some stress">Some stress</option>
          <option value="High stress">High stress</option>
          <option value="Very high/critical">Very high/critical</option>
        </select>
      </div>

      {/* Employment Status */}
      <div className="form-group">
        <label>Current Employment Status</label>
        <select
          name="employment_status_current"
          value={formData.employment_status_current}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="Working (full/part-time)">Working (full/part-time)</option>
          <option value="On maternity leave">On maternity leave</option>
          <option value="Not working">Not working</option>
          <option value="Student">Student</option>
        </select>
      </div>

      {/* Relationship Stress */}
      <div className="form-group">
        <label>Relationship Stress</label>
        <select
          name="relationship_stress"
          value={formData.relationship_stress}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="None">None</option>
          <option value="Mild">Mild</option>
          <option value="Moderate">Moderate</option>
          <option value="Severe">Severe</option>
        </select>
      </div>

      {/* Caregiving Responsibilities */}
      <div className="form-group">
        <label>Caregiving Responsibilities</label>
        <select
          name="caregiving_responsibilities"
          value={formData.caregiving_responsibilities}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="None">None</option>
          <option value="Some">Some</option>
          <option value="Many">Many</option>
        </select>
      </div>
    </div>
  </>
)}
{step === 6 && (
  <>
    <div className="card-header">
      <h2>EPDS Assessment</h2>
      <p>Please answer based on how you felt during the past 7 days</p>
    </div>

    <div className="epds-list">

      <div className="epds-item">
        <label>1. I have been able to laugh and see the funny side of things</label>
        <select name="epds_1" value={formData.epds_1} onChange={handleChange}>
          <option value="">Select</option>
          <option value="3">As much as I always could</option>
          <option value="2">Not quite so much now</option>
          <option value="1">Definitely not so much now</option>
          <option value="0">Not at all</option>
        </select>
      </div>

      <div className="epds-item">
        <label>2. I have looked forward with enjoyment to things</label>
        <select name="epds_2" value={formData.epds_2} onChange={handleChange}>
          <option value="">Select</option>
          <option value="3">As much as I ever did</option>
          <option value="2">Rather less than I used to</option>
          <option value="1">Definitely less than I used to</option>
          <option value="0">Hardly at all</option>
        </select>
      </div>

      <div className="epds-item">
        <label>3. I have blamed myself unnecessarily when things went wrong</label>
        <select name="epds_3" value={formData.epds_3} onChange={handleChange}>
          <option value="">Select</option>
          <option value="3">Yes, most of the time</option>
          <option value="2">Yes, some of the time</option>
          <option value="1">Not very often</option>
          <option value="0">No, never</option>
        </select>
      </div>

      <div className="epds-item">
        <label>4. I have been anxious or worried for no good reason</label>
        <select name="epds_4" value={formData.epds_4} onChange={handleChange}>
          <option value="">Select</option>
          <option value="0">No, not at all</option>
          <option value="1">Hardly ever</option>
          <option value="2">Yes, sometimes</option>
          <option value="3">Yes, very often</option>
        </select>
      </div>

      <div className="epds-item">
        <label>5. I have felt scared or panicky for no very good reason</label>
        <select name="epds_5" value={formData.epds_5} onChange={handleChange}>
          <option value="">Select</option>
          <option value="3">Yes, quite a lot</option>
          <option value="2">Yes, sometimes</option>
          <option value="1">No, not much</option>
          <option value="0">No, not at all</option>
        </select>
      </div>

      <div className="epds-item">
        <label>6. Things have been getting on top of me</label>
        <select name="epds_6" value={formData.epds_6} onChange={handleChange}>
          <option value="">Select</option>
          <option value="3">Yes, most of the time I haven't been able to cope at all</option>
          <option value="2">Yes, sometimes I haven't been coping as well as usual</option>
          <option value="1">No, most of the time I have coped quite well</option>
          <option value="0">No, I have been coping as well as ever</option>
        </select>
      </div>

      <div className="epds-item">
        <label>7. I have been so unhappy that I have had difficulty sleeping</label>
        <select name="epds_7" value={formData.epds_7} onChange={handleChange}>
          <option value="">Select</option>
          <option value="3">Yes, most of the time</option>
          <option value="2">Yes, sometimes</option>
          <option value="1">Not very often</option>
          <option value="0">No, not at all</option>
        </select>
      </div>

      <div className="epds-item">
        <label>8. I have felt sad or miserable</label>
        <select name="epds_8" value={formData.epds_8} onChange={handleChange}>
          <option value="">Select</option>
          <option value="3">Yes, most of the time</option>
          <option value="2">Yes, quite often</option>
          <option value="1">Not very often</option>
          <option value="0">No, not at all</option>
        </select>
      </div>

      <div className="epds-item">
        <label>9. I have been so unhappy that I have been crying</label>
        <select name="epds_9" value={formData.epds_9} onChange={handleChange}>
          <option value="">Select</option>
          <option value="3">Yes, most of the time</option>
          <option value="2">Yes, quite often</option>
          <option value="1">Only occasionally</option>
          <option value="0">No, never</option>
        </select>
      </div>

      <div className="epds-item">
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


          {/* STEP 8 – CLINICIAN SUMMARY */}
          {step === 8 && (
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
                  onClick={() => {
                    // Validate required fields
                    if (!formData.patient_name) {
                      alert('Please enter patient name before saving.');
                      return;
                    }
                    
                    if (!formData.clinician_risk) {
                      alert('Please select clinician risk level before saving.');
                      return;
                    }
                    
                    if (!formData.plan) {
                      alert('Please select a recommended plan before saving.');
                      return;
                    }

                    // Save to history functionality
                    const assessmentData = {
                      id: Date.now(),
                      patient_name: formData.patient_name,
                      date: new Date().toLocaleDateString(),
                      risk_level: result?.risk || "Unknown",
                      score: result?.score || 0,
                      clinician_risk: formData.clinician_risk,
                      plan: formData.plan,
                      notes: formData.notes,
                      timestamp: new Date().toISOString()
                    };

                    // Get existing history from localStorage
                    const existingHistory = JSON.parse(localStorage.getItem('assessmentHistory') || '[]');
                    
                    // Add new assessment
                    existingHistory.push(assessmentData);
                    
                    // Save back to localStorage (current session)
                    localStorage.setItem('assessmentHistory', JSON.stringify(existingHistory));
                    
                    // Also save to user-specific history for persistence across logins
                    if (user?.email) {
                      localStorage.setItem(`assessmentHistory_${user.email}`, JSON.stringify(existingHistory));
                    }
                    
                    alert(`Assessment for ${formData.patient_name} saved to history successfully!`);
                    
                    // Navigate to history page
                    navigate('/dashboard/History');
                  }}
                >
                  Save to History
                </button>
                
                <button
                  className="new-assessment-btn"
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

{step === 7 && (
  <>
    <div className="card-header">
      <h2>Assessment Result</h2>
      <p>Generate and review the risk assessment</p>
    </div>

    <button
      className="submit-btn"
      onClick={submitAssessment}  // 🔹 call backend
    >
      Generate Result
    </button>

    {result && (
      <div
        className="result-card"
        style={{
          background: "#e6f8f1",
          padding: "25px",
          marginTop: "20px",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <h3>Assessment Complete</h3>

        <p style={{ fontSize: "20px", fontWeight: "600" }}>
          Risk Level: {result.risk}
        </p>

        <h2>{result.score} / 100</h2>

        <div style={{ marginTop: "20px" }}>
          <button
            className="save-result-btn"
            onClick={() => setStep(8)}   // 🔹 go to clinician summary
            style={{
              background: "#2dd4bf",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Save Result
          </button>
        </div>
      </div>
    )}
  </>
)}

   
          {/* NAV BUTTONS - Only show for steps 1-7 */}
          {step < 8 && (
            <div className="actions">
              <button disabled={step === 1} onClick={() => setStep(step - 1)}>
                ← Previous
              </button>

              <button onClick={() => setStep(step + 1)}>
                Next →
              </button>
            </div>
          )}

        </section>
      </main>
    </div>
    </>
  );
}
