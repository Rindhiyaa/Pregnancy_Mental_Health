import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import DashboardPage from "../pages/DashboardPage";
import CliniciansPage from "../pages/CliniciansPage";
import PatientsPage from "../pages/PatientsPage";
import SignInPage from "../pages/SignInPage";
import SignUpPage from "../pages/SignUpPage";
import RiskCheckPage from "../pages/RiskCheckPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/clinicians" element={<CliniciansPage />} />
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/risk-check" element={<RiskCheckPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}