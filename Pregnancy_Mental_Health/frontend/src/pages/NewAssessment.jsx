import { useState, useEffect } from "react";
import "../styles/NewAssessment.css";
import "../styles/DashboardPage.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


export default function NewAssessment() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { user, logout } = useAuth();


  // 🔹 35-QUESTION PRENATAL ASSESSMENT (Section 5 removed - postpartum questions)
  const [formData, setFormData] = useState({
    patient_name: "",

    // Section 1: Demographics (7 questions)
    age: "",
    residence: "",
    education_level: "",
    marital_status: "",
    partner_education: "",
    partner_income: "",
    household_members: "",

    // Section 2: Relationships & Support (6 questions)
    relationship_inlaws: "",
    relationship_husband: "",
    support_during_pregnancy: "",
    need_more_support: "",
    major_changes_losses: "",
    trust_share_feelings: "",

    // Section 3: Pregnancy History (6 questions)
    total_children_now: "",
    pregnancy_number: "",
    pregnancy_length: "",
    pregnancy_planned: "",
    regular_checkups: "",
    medical_conditions_pregnancy: "",

    // Section 4: Mental Health History (6 questions)
    depression_before_pregnancy: "",
    depression_during_pregnancy: "",
    fear_pregnancy_childbirth: "",
    major_life_changes_pregnancy: "",
    abuse_during_pregnancy: "",
    family_type: "",

    // Section 6: EPDS Assessment (10 questions)
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

    // Clinician fields
    clinician_risk: "",
    plan: "",
    notes: ""
  });

  // 🔹 RESULT FROM BACKEND
  const [result, setResult] = useState(null);

  //handle logout

  const handleTopLogout = async () => {
    try {
      if (user?.email) {
        await fetch(
          `http://127.0.0.1:8000/api/logout-status?email=${encodeURIComponent(
            user.email
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );
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

  // 🔹 FINAL SUBMIT (API READY)
  const submitAssessment = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/assessments/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        console.error("predict error:", JSON.stringify(errorBody, null, 2));
        alert("Could not generate risk score.");
        return;
      }
  
      const data = await res.json();
      setResult({ risk: data.risk_level, score: data.score });
      setStep(6);  // make sure you navigate to result step
    } catch (err) {
      console.error("Backend error:", err);
      alert("Could not generate risk score. Please try again.");
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="dp-profile-name">{user?.fullName || 'Clinician'}</span>
          </div>

          <button
            className="dp-logout-btn"
            onClick={handleTopLogout}
          >
            Logout
          </button>

        </div>
      </header>
      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h2 className="logo">PPD Prediction</h2>
          <div className="step-nav">
            <div
              className={step === 1 ? "step active" : "step clickable"}
              onClick={() => setStep(1)}
            >
              Demographics
            </div>
            <div
              className={step === 2 ? "step active" : "step clickable"}
              onClick={() => setStep(2)}
            >
              Relationships & Support
            </div>
            <div
              className={step === 3 ? "step active" : "step clickable"}
              onClick={() => setStep(3)}
            >
              Pregnancy History
            </div>
            <div
              className={step === 4 ? "step active" : "step clickable"}
              onClick={() => setStep(4)}
            >
              Mental Health History
            </div>
            <div
              className={step === 5 ? "step active" : "step clickable"}
              onClick={() => setStep(5)}
            >
              EPDS Assessment
            </div>
            <div
              className={step === 6 ? "step active" : "step clickable"}
              onClick={() => setStep(6)}
            >
              Result
            </div>
            <div
              className={step === 7 ? "step active" : "step clickable"}
              onClick={() => setStep(7)}
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

          {/* Show card for steps 1-6 (before result) or step 8 */}
          {step >= 1 && step <= 7 && (
            <section className="card">

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
                      <label>Age (18-50)</label>
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
                        <option value="Divorced">Divorced</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Husband's education level?</label>
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
                      <label>Husband's monthly income?</label>
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
                      <label>How many people live in household?</label>
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
                      <label>Relationship with husband?</label>
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
                      <label>Do you need more support?</label>
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
                      <label>Major changes/losses during pregnancy?</label>
                      <select
                        name="major_changes_losses"
                        value={formData.major_changes_losses}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Someone you can trust and share feelings with?</label>
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
                  </div>
                </>
              )}

              {/* STEP 3 – PREGNANCY HISTORY */}
              {step === 3 && (
                <>
                  <div className="card-header">
                    <h2>Pregnancy History</h2>
                    <p>Information about your pregnancy history (6 questions)</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>How many total children now?</label>
                      <select
                        name="total_children_now"
                        value={formData.total_children_now}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="One">One</option>
                        <option value="Two">Two</option>
                        <option value="More than two">More than two</option>
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
                        <option value="4">4</option>
                      </select>
                    </div>

                    <div className="form-group">
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
                    </div>

                    <div className="form-group">
                      <label>Was pregnancy planned?</label>
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
                      <label>Regular antenatal checkups?</label>
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
                      <label>Medical conditions during pregnancy?</label>
                      <select
                        name="medical_conditions_pregnancy"
                        value={formData.medical_conditions_pregnancy}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="Chronic">Chronic</option>
                        <option value="Non-Chronic">Non-Chronic</option>
                        <option value="None">None</option>
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
                    <p>Information about your mental health history (6 questions)</p>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Depression BEFORE pregnancy?</label>
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
                      <label>Depression DURING pregnancy?</label>
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
                      <label>Fear about pregnancy/childbirth?</label>
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
                      <label>Major life changes during pregnancy?</label>
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
                      <label>Any abuse during pregnancy?</label>
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

                    <div className="form-group">
                      <label>Family type?</label>
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
              {step === 5 && (
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
                        // Validate required fields
                        if (!formData.patient_name) {
                          alert("Please enter patient name before saving.");
                          return;
                        }

                        if (!formData.clinician_risk) {
                          alert("Please select clinician risk level before saving.");
                          return;
                        }

                        if (!formData.plan) {
                          alert("Please select a recommended plan before saving.");
                          return;
                        }

                        if (!result) {
                          alert("Please generate the result before saving.");
                          return;
                        }

                        // Use AI risk directly (e.g. "Low Risk" / "Moderate Risk" / "High Risk")
                        const riskLevel = result.risk;

                        const payload = {
                          patient_name: formData.patient_name,
                          risk_level: riskLevel,
                          score: result.score,
                          clinician_risk: formData.clinician_risk, // "Low" | "Medium" | "High"
                          plan: formData.plan,
                          notes: formData.notes,
                          clinician_email: user?.email || "",
                          raw_data: formData, // optional: full questionnaire
                        };

                        try {
                          const token = localStorage.getItem('ppd_access_token');
                          const res = await fetch("http://127.0.0.1:8000/api/assessments", {
                            method: "POST",
                            headers: { 
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`
                            },
                            body: JSON.stringify(payload),
                          });

                          if (!res.ok) throw new Error("Failed to save assessment");

                          const saved = await res.json(); // contains id, dates, etc.

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

                          alert(
                            `Assessment for ${formData.patient_name} saved to history successfully!`
                          );
                          navigate("/dashboard/History");
                        } catch (err) {
                          console.error("Error saving assessment", err);
                          alert("Could not save assessment, please try again.");
                        }
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

              {step === 6 && (
                <>
                  {!result && (
                    <div className="card-header">
                      <h2>Assessment Result</h2>
                      <p>Generate and review the risk assessment</p>
                    </div>
                  )}

                  <button
                    className={`submit-btn ${result ? 'faded' : ''}`}
                    onClick={submitAssessment}
                  >
                    Generate AI Risk Assessment
                  </button>
                </>
              )}


              {/* NAV BUTTONS - Show for steps 1-5, hide only on step 6 (result page) */}
              {step !== 6 && step < 7 && (
                <div className="actions">
                  <button disabled={step === 1} onClick={() => setStep(step - 1)}>
                    ← Previous
                  </button>

                  <button onClick={() => setStep(step + 1)}>
                    Next →
                  </button>
                </div>
              )}

              {/* NAV BUTTONS for step 7 - only show Previous */}
              {step === 7 && (
                <div className="actions">
                  <button onClick={() => setStep(step - 1)}>
                    ← Previous
                  </button>
                </div>
              )}

            </section>
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
                  onClick={() => setStep(7)}
                >
                  Continue to Clinical Summary
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
