import React from "react";
import "../styles/AboutPage.css";

export default function AboutPage() {
  return (
    <main className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="about-hero-text">
            <h1 className="about-hero-title">
              About <span className="gradient-text">Postpartum Risk Insight</span>
            </h1>
            <p className="about-hero-subtitle">
              Empowering healthcare professionals with AI-driven tools to support maternal mental health 
              through early detection and evidence-based screening.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <div className="about-container">
          <div className="mission-content">
            <h2 className="section-title">Our Mission</h2>
            <p className="mission-text">
              To revolutionize maternal mental health care by providing healthcare professionals with 
              intelligent, evidence-based tools that enable early detection and intervention for 
              pregnancy and postpartum depression.
            </p>
            <div className="mission-stats">
              <div className="stat-item">
                <div className="stat-number">1 in 7</div>
                <div className="stat-label">Women experience postpartum depression</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">85%</div>
                <div className="stat-label">Cases can be identified early with proper screening</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">2 min</div>
                <div className="stat-label">Average assessment completion time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="about-features">
        <div className="about-container">
          <h2 className="section-title">Platform Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>AI-Powered Assessment</h3>
              <p>Advanced machine learning algorithms analyze multiple risk factors to provide accurate risk predictions.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>EPDS Integration</h3>
              <p>Seamlessly incorporates the Edinburgh Postnatal Depression Scale for comprehensive screening.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Quick Screening</h3>
              <p>Complete assessments in under 2 minutes during routine antenatal and postnatal visits.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Progress Tracking</h3>
              <p>Monitor patient progress over time with comprehensive history and follow-up tracking.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>HIPAA-compliant data handling ensures patient information remains secure and confidential.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Team Collaboration</h3>
              <p>Enable seamless collaboration between healthcare team members for comprehensive care.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="about-process">
        <div className="about-container">
          <h2 className="section-title">How It Works</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Patient Assessment</h3>
                <p>Collect comprehensive patient information including demographics, medical history, and psychosocial factors.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>EPDS Screening</h3>
                <p>Complete the validated Edinburgh Postnatal Depression Scale questionnaire for standardized assessment.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>AI Analysis</h3>
                <p>Our machine learning model analyzes all factors to generate a comprehensive risk assessment.</p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Clinical Decision</h3>
                <p>Review AI recommendations and add clinical judgment to create personalized treatment plans.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <div className="about-container">
          <h2 className="section-title">Built by Experts</h2>
          <p className="team-description">
            Developed through collaboration between experienced clinicians, data scientists, and engineers 
            who are passionate about improving maternal mental health outcomes.
          </p>
          <div className="team-values">
            <div className="value-item">
              <div className="value-icon">🎯</div>
              <h3>Evidence-Based</h3>
              <p>All recommendations are grounded in clinical research and best practices.</p>
            </div>
            <div className="value-item">
              <div className="value-icon">🤝</div>
              <h3>Clinician-Centered</h3>
              <p>Designed by and for healthcare professionals who understand real-world needs.</p>
            </div>
            <div className="value-item">
              <div className="value-icon">💡</div>
              <h3>Innovation-Driven</h3>
              <p>Continuously evolving with the latest advances in AI and maternal health research.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="about-notice">
        <div className="about-container">
          <div className="notice-card">
            <div className="notice-icon">⚠️</div>
            <div className="notice-content">
              <h3>Important Clinical Notice</h3>
              <p>
                This tool is designed to support, not replace, clinical judgment. It should be used as 
                part of a comprehensive clinical assessment. For immediate risk situations, always follow 
                your institution's emergency protocols and safety procedures.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
