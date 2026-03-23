import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import DoctorSidebar from "../../components/DoctorSidebar";
import SafetyAlert from "../../components/SafetyAlert";
import { api } from "../../utils/api";
// import { USE_DUMMY_DATA, dummyApi } from "../../utils/dummyData";
import toast from 'react-hot-toast';
import { ASSESSMENT_SECTIONS, STEP_TITLES, INITIAL_FORM_DATA } from "../../constants/assessmentData";
import "../../styles/NewAssessment.css";
import { Loader2, Save, Send, ChevronLeft, ChevronRight, User, Heart, Activity, Brain, ClipboardList, CheckCircle2, AlertTriangle } from "lucide-react";

export default function NurseNewAssessment() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showPatientModal, setShowPatientModal] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [patientSearch, setPatientSearch] = useState('');
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({ name: '', email: '', age: '', phone: '' });
  const [isReturningPatient, setIsReturningPatient] = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Load Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, patRes] = await Promise.all([
          api.get("/nurse/doctors"),   // you already have this
          api.get("/nurse/patients")   // list patients created by this nurse
        ]);
        if (docRes.ok) setDoctors(await docRes.json());
        if (patRes.ok) setPatients(await patRes.json());
      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Failed to load doctors or patients");
      }
    };
    fetchData();
  }, []);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Auto-save logic
  useEffect(() => {
    if (!formData.patient_name || step === 1) return;
    const timeoutId = setTimeout(() => {
      const draftKey = `ppd_draft_${formData.patient_name.replace(/\s+/g, '_').toLowerCase()}`;
      localStorage.setItem(draftKey, JSON.stringify({
        draft_data: formData,
        step: step,
        selectedDoctorId: selectedDoctorId,
        saved_at: new Date().toISOString()
      }));
      setAutoSaveStatus("Autosaved");
      setLastSaved(new Date());
      setTimeout(() => setAutoSaveStatus(""), 3000);
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [formData, step, selectedDoctorId]);

  // Load draft when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const draftKey = `ppd_draft_${selectedPatient.name.replace(/\s+/g, '_').toLowerCase()}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const { draft_data, step: savedStep, selectedDoctorId: savedDocId, saved_at } = JSON.parse(savedDraft);
          const timeAgo = Math.round((new Date() - new Date(saved_at)) / 60000);
          
          if (timeAgo < 1440) { // Only suggest if less than 24 hours old
            if (window.confirm(`Found a saved draft for ${selectedPatient.name} from ${timeAgo} minutes ago. Would you like to resume?`)) {
              setFormData(draft_data);
              if (savedStep) setStep(savedStep);
              if (savedDocId) setSelectedDoctorId(savedDocId);
              toast.success("Draft restored!");
            }
          }
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [selectedPatient]);

  const handleStepChange = (newStep) => {
    setStep(newStep);
  };

  // Nurse Submit — intake only, assigns to doctor
  const handleNurseSubmit = async () => {
    if (!selectedDoctorId) {
      toast.error("Please assign a doctor for review.");
      return;
    }
    if (!formData.patient_name) {
      toast.error("Please select a patient first.");
      setShowPatientModal(true);
      return;
    }
  
    setLoading(true);
    try {
      const epdsScore = Object.keys(formData)
      .filter(k => k.startsWith("epds_"))
      .reduce((acc, k) => acc + (parseInt(formData[k]) || 0), 0);

      const payload = {
        patient_name: formData.patient_name,                 // string, required
        patient_id: selectedPatient?.id ?? null,             // int | null
        patient_email: selectedPatient?.email ?? null,       // string | null

        risk_level: "Pending",                               // string, required
        risk_score: null,                                    // number | null
        epds_score: epdsScore,                               // number | null

        plan: null,
        notes: null,
        raw_data: formData,                                  // object

        assigned_doctor_id: Number(selectedDoctorId),        // int, required

        status: "submitted",                                 // string
        is_draft: false,                                     // bool
      };
  
      const res = await api.post("/nurse/assessments", payload);
      if (res.ok) {
        const doctor = doctors.find(d => String(d.id) === String(selectedDoctorId));
        toast.success(
          `Assessment submitted to ${doctor?.fullName || doctor?.first_name || "Doctor"} successfully!`
        );
        navigate("/nurse/dashboard");
      } else {
        const errBody = await res.json().catch(() => ({}));
        console.error("Assessment submit error body:", errBody);
        const message =
          (Array.isArray(errBody.detail) && errBody.detail[0]?.msg) ||
          errBody.detail ||
          "Submission failed. Please check required fields.";
        throw new Error(message);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      toast.error(err.message || "Submission failed");
    }finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!formData.patient_name) return;
    
    // Key-based draft persistence
    localStorage.setItem(`ppd_draft_${formData.patient_name}`, JSON.stringify({
      draft_data: formData,
      saved_at: new Date().toISOString()
    }));

    // Update patient status if using dummy data
    if (USE_DUMMY_DATA && selectedPatient?.id) {
       await dummyApi.updatePatientStatus(selectedPatient.id, 'Draft');
    }

    toast.success("Draft saved!");
  };


  return (
    <div className="new-assessment-page" style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>
      {user?.role === 'doctor' ? <DoctorSidebar /> : <NurseSidebar />}

      <main className="portal-main" style={{ background: theme.pageBg, fontFamily: theme.fontBody }}>
        {/* TOP HEADER */}
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
            Nurse <span style={{ fontWeight: 400 }}>Workspace</span>
          </h1>
          {selectedPatient && (
            <div className="active-patient-badge" onClick={() => setShowPatientModal(true)}>
              <div className="avatar-xs-teal">{selectedPatient.name[0]}</div>
              <div className="badge-patient-info">
                <span className="patient-name">{selectedPatient.name}</span>
                <span className="patient-id">ID: #{selectedPatient.id}</span>
              </div>
              <button className="btn-change-patient">Change</button>
              {autoSaveStatus && (
                <div style={{ marginLeft: '12px', fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> {autoSaveStatus}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CUSTOM CIRCULAR STEPPER */}
        <div className="stepper-card-modern">
          <div className="stepper-track">
            {[1, 2, 3, 4, 5, 7].map((s, idx) => {
              const isActive = step === s;
              const isPast = step > s || (step === 7 && s < 7);
              const title = STEP_TITLES[s];

              return (
                <div key={s} className={`stepper-node-group ${isActive ? 'active' : ''} ${isPast ? 'completed' : ''}`}>
                  <div className="stepper-node" onClick={() => (s <= step || s === step + 1 || (step === 5 && s === 7)) && handleStepChange(s)}>
                    {isPast ? "✓" : s === 7 ? "7" : s}
                  </div>
                  <span className="stepper-node-label">{title}</span>
                  {idx < 5 && <div className={`stepper-node-line ${isPast ? 'completed' : ''}`}></div>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          {/* MAIN FORM AREA (Left) */}
          <div style={{ flex: 1 }}>
            {!selectedPatient ? (
              <div className="selection-empty-state">
                <div className="empty-icon-box">📋</div>
                <h2>Prepare Clinical Assessment</h2>
                <p>Please select a patient from the directory to begin entering clinical assessment data.</p>
                <button className="btn-primary-teal" onClick={() => setShowPatientModal(true)}>
                  Select Patient from Directory
                </button>
              </div>
            ) : (
              <div className="form-card-modern">
                <header className="form-head-section">
                  <h2>{STEP_TITLES[step]}</h2>
                  <p>{step === 7 ? "Assign this patient to a doctor for clinical review." : `Information about ${STEP_TITLES[step].toLowerCase()} (${ASSESSMENT_SECTIONS.find(sec => sec.id === step)?.questions.length || 0} questions)`}</p>
                </header>

                <div className="form-body-scroll">
                  {/* Step 7 — Doctor Assignment Only */}
                  {step === 7 ? (
                    <div className="nurse-submit-card">
                      {/* Patient Summary */}
                      <div className="submit-patient-row">
                        <div className="submit-patient-avatar">{(formData.patient_name || "P")[0]}</div>
                        <div>
                          <div className="submit-patient-name">{formData.patient_name || selectedPatient?.name}</div>
                          <div className="submit-patient-meta">
                            ID: #{selectedPatient?.id || "—"} &nbsp;·&nbsp;
                            {isReturningPatient ? (
                              <span className="badge-returning">↩ Returning Patient</span>
                            ) : (
                              <span className="badge-new">✦ New Patient</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Doctor Assignment */}
                      {isReturningPatient && selectedDoctorId ? (
                        <div className="auto-assign-notice">
                          <span>🔁</span>
                          <div>
                            <strong>Auto-assigned to previous doctor</strong>
                            <p>This patient was seen by <strong>{doctors.find(d => String(d.id) === String(selectedDoctorId))?.fullName}</strong> before. They will be automatically reassigned.</p>
                            <button className="btn-link-teal" onClick={() => { setSelectedDoctorId(""); setIsReturningPatient(false); }}>
                              Change doctor →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="doctor-assign-block">
                          <label className="field-label-modern">Assign to Doctor <span className="required-star">*</span></label>
                          <p className="field-hint">Select the doctor who will conduct the clinical review and care plan.</p>
                          <div className="custom-select-wrapper">
                            <select
                              value={selectedDoctorId}
                              onChange={(e) => setSelectedDoctorId(e.target.value)}
                              className="modern-select doctor-select"
                            >
                              <option value="">Choose a Doctor</option>
                              {doctors.map(doc => (
                              <option key={doc.id} value={doc.id}>
                                {doc.fullName || `${doc.first_name ?? ""} ${doc.last_name ?? ""}`.trim()}
                                {doc.specialization ? ` — ${doc.specialization}` : ""}
                              </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Nurse scope note */}
                      <div className="nurse-scope-notice">
                        <span>ℹ️</span>
                        <span>Clinical recommendations and risk classification will be completed by the assigned doctor after review.</span>
                      </div>
                    </div>
                  ) : (
                    /* All other steps — generic form grid */
                    ASSESSMENT_SECTIONS.filter(sec => sec.id === step).map(section => (
                      <div key={section.id} className={`form-grid-modern ${step === 5 ? 'single-col' : ''}`}>
                        {section.questions.map(q => (
                          <div key={q.name} className={`form-field-group ${q.type === 'textarea' ? 'full-width' : ''} ${step === 5 ? 'full-width' : ''}`}>
                            <label className="field-label-modern">
                              {q.label} {q.required && <span className="required-star">*</span>}
                            </label>
                            {q.type === "select" ? (
                              <div className="custom-select-wrapper">
                                <select
                                  name={q.name}
                                  value={formData[q.name]}
                                  onChange={handleChange}
                                  className="modern-select"
                                >
                                  <option value="">Select Option</option>
                                  {q.options.map(opt => (
                                    <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                                      {typeof opt === 'string' ? opt : opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : q.type === "textarea" ? (
                              <textarea
                                name={q.name}
                                value={formData[q.name]}
                                onChange={handleChange}
                                placeholder={q.placeholder}
                                rows={4}
                                className="modern-textarea"
                              />
                            ) : (
                              <input
                                type={q.type}
                                name={q.name}
                                value={formData[q.name] || ""}
                                onChange={q.readOnly ? undefined : handleChange}
                                readOnly={q.readOnly}
                                placeholder={q.placeholder}
                                min={q.min}
                                max={q.max}
                                className={`modern-input ${q.readOnly ? 'input-readonly' : ''}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                <footer className="form-footer-modern">
                  <button
                    className="btn-back-modern"
                    onClick={() => handleStepChange(step === 7 ? 5 : step - 1)}
                    disabled={step === 1}
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {step < 7 && (
                      <button className="btn-save-modern" onClick={saveDraft} disabled={loading}>
                        <Save size={18} /> Save Draft
                      </button>
                    )}
                    {step < 7 ? (
                      <button className="btn-next-modern" onClick={() => handleStepChange(step === 5 ? 7 : step + 1)}>
                        Next Step <ChevronRight size={18} />
                      </button>
                    ) : (
                      <button
                        className="btn-submit-modern"
                        onClick={handleNurseSubmit}
                        disabled={loading || !selectedDoctorId}
                      >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Submit to Doctor</>}
                      </button>
                    )}
                  </div>
                </footer>
              </div>
            )}
          </div>

          {/* INFO SIDEBAR (Right) */}
          <aside className="info-sidebar-modern">
            {/* PROGRESS CARD */}
            <div className="side-card-modern">
              <h3 className="side-card-title">Nurse Workflow</h3>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-rail">
                  <div className="progress-bar-thumb" style={{ width: `${(step / 7) * 100}%` }}></div>
                </div>
                <span className="progress-value-text">{Math.round((step / 7) * 100)}%</span>
              </div>
              <p className="workflow-status-text">Step {step} of 7. {STEP_TITLES[step]}</p>

              <ul className="workflow-checklist">
                <li>Fill out patient demographics and history.</li>
                <li>Submit assessment for clinical review.</li>
                <li>Assign to specialist for final review.</li>
              </ul>
            </div>

            {/* PATIENT OVERVIEW CARD */}
            {selectedPatient && (
              <div className="side-card-modern">
                <h3 className="side-card-title">Patient Overview</h3>
                <div className="patient-mini-card">
                  <div className="patient-avatar-teal">
                    {selectedPatient.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="patient-name-text">{selectedPatient.name}</div>
                    <div className="patient-id-text">ID: #{selectedPatient.id}</div>
                  </div>
                </div>

                <div className="patient-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Current Week</span>
                    <span className="detail-value">26 weeks</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Assessment</span>
                    <span className="detail-value">Completed</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Patient Selection Modal */}
      {showPatientModal && (
        <div className="modal-overlay-modern">
          <div className="modal-content-modern">
            <div className="modal-header-modern">
              <h2>Select Patient</h2>
              <p>Choose a patient to start the clinical assessment.</p>
            </div>

            <div className="modal-body-modern">
              <div className="search-input-wrapper-modern">
                <input
                  type="text"
                  placeholder="Search patients by name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="modern-search-input"
                />
              </div>

              <div className="patient-list-scroll-modern">
                {patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase())).map(p => (
                  <div
                    key={p.id}
                    className={`patient-list-item-modern ${selectedPatient?.id === p.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPatient(p);
                      setFormData(prev => ({ ...prev, patient_name: p.name }));
                      // Auto-assign returning patient to previous doctor
                      if (p.previous_doctor_id) {
                        setSelectedDoctorId(String(p.previous_doctor_id));
                        setIsReturningPatient(true);
                      } else {
                        setSelectedDoctorId("");
                        setIsReturningPatient(false);
                      }
                      setShowPatientModal(false);
                    }}
                  >
                    <div className="avatar-sm-teal">{p.name.charAt(0)}</div>
                    <div className="patient-item-info">
                      <div className="name">{p.name}</div>
                      <div className="id">Patient ID: #{p.id}</div>
                    </div>
                    {selectedPatient?.id === p.id && <CheckCircle2 size={16} color="#2d6a75" />}
                  </div>
                ))}
              </div>

              <div className="modal-footer-modern">
                <button
                  onClick={() => navigate("/nurse/patients/new")}
                  className="btn-register-new"
                >
                  + Register New Patient
                </button>
                {selectedPatient && (
                  <button onClick={() => setShowPatientModal(false)} className="btn-cancel-modal">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
