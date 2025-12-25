import React from "react";
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/image-1.png";  // ← Changed this


export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main>
     
      <section className="hero">
        <div>
          <div className="badge">
            <span className="badge-dot" />
            <span>Support for pregnancy and after birth</span>
          </div>


          <h1 className="hero-title">
            Care For Mothers During <span className="highlight">Pregnancy</span> And After Delivery.
          </h1>


          <p className="hero-sub-small">
            A simple clinical decision support tool for pregnancy and postpartum depression risk.
          </p>


          <p className="hero-sub">
            Screen mood, sleep, support at home, and history in minutes, then get an explainable risk
            score to guide follow‑up and referrals.
          </p>
           

          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate("/signin")}>
              Start Risk Check
            </button>
            <button className="btn-outline" onClick={() => navigate("/features")}>
              How it works
            </button>
          </div>


          <div className="hero-tags">
            <span className="tag-pill">For clinicians</span>
            <span className="tag-pill">Evidence‑informed</span>
            <span className="tag-pill">Explainable AI</span>
          </div>
        </div>


        <div className="hero-right">
          
            <img src={heroImg} alt="Mother and baby illustration" className="hero-image" />
           
          </div>
        
      </section>
    </main>
  );
}