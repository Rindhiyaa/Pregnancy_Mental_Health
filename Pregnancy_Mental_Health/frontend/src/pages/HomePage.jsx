import React from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/image-1.png";


export default function HomePage() {
  // Navigation
  const navigate = useNavigate();

  return (
    <main className="home-page">
      
      <section className="hero">
        <div>
          <div className="badge">
            <span className="badge-dot" />
            <span>Early PPD Risk Detection for Pregnant Mothers</span>
          </div>


          <h1 className="hero-title">
          
            During Pregnancy Detect<br/>
            <span className="highlight">Postpartum</span> Depression <br/>
             Risk Early
          </h1>


          <p className="hero-sub">
            Help Clinicians Identify <b>PPD</b> during pregnancy, not after delivery.
          </p>


          <p className="hero-sub">
            Answer clinical questions + AI analysis = instant risk score
            to guide early intervention and specialist referrals  — enabling early support 
that protects both mother and baby.
          </p>
           

          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate("/signin")}>
              Sign in
            </button>
            <button className="btn-outline" onClick={() => navigate("/about")}>
              How it works
            </button>
          </div>


          <div className="hero-tags">
            <span className="tag-pill">For Doctors & Clinicians</span>
            <span className="tag-pill">During Pregnancy</span>
            <span className="tag-pill">AI-Powered Screening</span>
          </div>
        </div>


        <div className="hero-right">
          
            <img src={heroImg} alt="Mother and baby illustration" className="hero-image" />
           
          </div>
        
      </section>
    </main>
  );
}