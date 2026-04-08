import React from "react";
import "../styles/AboutPage.css";

/* ── Monochrome SVG Icons ── */
const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.04-4.77A2.5 2.5 0 0 1 4 9.5a2.5 2.5 0 0 1 3-3V4.5A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.04-4.77A2.5 2.5 0 0 0 20 9.5a2.5 2.5 0 0 0-3-3V4.5A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);
const IconClipboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="m9 14 2 2 4-4"/>
  </svg>
);
const IconZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
const IconTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);
const IconLightbulb = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/><path d="M10 22h4"/>
  </svg>
);
const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
);

export default function AboutPage() {
  return (
    <main className="about-page">

      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="about-hero-text">
           
            <h1 className="about-hero-title">
              About <span className="gradient-text">Postpartum Risk Insight</span>
            </h1>
            <p className="about-hero-subtitle">
              A clinical-grade platform built to help healthcare teams detect
              postpartum depression risk <em>during</em> pregnancy — before symptoms
              escalate — through structured assessment and AI-powered analysis.
            </p>
          </div>
        </div>
      </section>

      {/* ── Mission Stats ── */}
      <section className="about-mission">
        <div className="about-container">
          <h2 className="section-title">Why Early Detection Matters</h2>
          <p className="mission-text">
            Postpartum depression affects 1 in 7 mothers globally, yet most cases go undetected
            until after delivery. Our platform integrates the Edinburgh Postnatal Depression Scale
            with machine learning to flag at-risk patients during routine antenatal visits — giving
            clinicians an actionable early warning system.
          </p>
          <div className="mission-stats">
            <div className="stat-item">
              <div className="stat-number">1 in 7</div>
              <div className="stat-label">Mothers experience postpartum depression</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">85%</div>
              <div className="stat-label">Cases identifiable early with proper screening</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">&lt; 3 min</div>
              <div className="stat-label">Average assessment completion time</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">EPDS</div>
              <div className="stat-label">Validated clinical screening tool at the core</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Features ── */}
      <section className="about-features">
        <div className="about-container">
          <h2 className="section-title">Platform Capabilities</h2>
          <div className="features-grid">

            <div className="feature-card">
              <div className="feature-icon"><IconBrain /></div>
              <h3>AI Risk Prediction</h3>
              <p>A trained machine learning model analyses EPDS scores, clinical history, gestational data, and psychosocial risk factors to produce a quantified PPD risk score.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><IconClipboard /></div>
              <h3>EPDS-Integrated Assessment</h3>
              <p>The Edinburgh Postnatal Depression Scale is embedded into a guided digital form, capturing both nurse-collected clinical data and patient-reported symptoms in one workflow.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><IconZap /></div>
              <h3>Rapid Antenatal Screening</h3>
              <p>Screening fits into a routine antenatal visit without disrupting clinical flow. Nurses can initiate, doctors can review and finalise — all within the same session.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><IconTrend /></div>
              <h3>Patient History & Tracking</h3>
              <p>Clinicians can view a patient's complete assessment history, risk trajectory, and previous clinical notes to inform ongoing care decisions over multiple visits.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><IconShield /></div>
              <h3>Role-Based Access Control</h3>
              <p>Admin, Doctor, Nurse, and Patient portals with distinct permissions ensure only authorised personnel access sensitive maternal mental health records.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><IconUsers /></div>
              <h3>Multi-Role Clinical Workflow</h3>
              <p>Structured handoff between Nurse (data collection) and Doctor (clinical review & final decision) mirrors real-world hospital workflows, reducing miscommunication.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="about-process">
        <div className="about-container">
          <h2 className="section-title">How It Works</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Patient Registration</h3>
                <p>The admin or nurse registers the patient and collects demographic, obstetric, and medical history data into the system.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Nurse Assessment</h3>
                <p>The nurse completes the clinical assessment form — including EPDS questions, psychosocial risk indicators, and gestational information.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>AI Analysis</h3>
                <p>The ML model processes submitted data and generates a risk score with confidence level, surfaced directly to the reviewing clinician.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Doctor Review & Decision</h3>
                <p>The doctor reviews the risk score alongside raw assessment data, adds clinical notes, and finalises the outcome — referral, monitoring, or no action.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="about-team">
        <div className="about-container">
          <h2 className="section-title">Our Design Principles</h2>
          <p className="team-description">
            Every decision in this platform — from data model to UI — was shaped by three core principles that bridge technology and clinical care.
          </p>
          <div className="team-values">
            <div className="value-item">
              <div className="value-icon"><IconTarget /></div>
              <h3>Evidence-Based</h3>
              <p>Screening logic and risk thresholds are grounded in published EPDS clinical research and maternal mental health guidelines.</p>
            </div>
            <div className="value-item">
              <div className="value-icon"><IconHeart /></div>
              <h3>Patient-Centered</h3>
              <p>The platform is designed to reduce burden on both clinicians and patients, making mental health screening feel as routine as a blood pressure check.</p>
            </div>
            <div className="value-item">
              <div className="value-icon"><IconLightbulb /></div>
              <h3>Transparent AI</h3>
              <p>The AI output is a decision-support tool, not a replacement for clinical judgment. Scores are always accompanied by the underlying contributing factors.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Clinical Notice ── */}
      <section className="about-notice">
        <div className="about-container">
          <div className="notice-card">
            <div className="notice-icon"><IconAlert /></div>
            <div className="notice-content">
              <h3>Important Clinical Notice</h3>
              <p>
                This platform is a <strong>clinical decision-support tool</strong> and does not replace professional clinical judgment.
                All risk scores must be reviewed and acted upon by a qualified clinician. For any patient at
                immediate risk, follow your institution's emergency protocols immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
