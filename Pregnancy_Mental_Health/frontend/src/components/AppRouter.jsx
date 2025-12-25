import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import DashboardPage from "../pages/DashboardPage";
import CliniciansPage from "../pages/CliniciansPage";
import PatientsPage from "../pages/PatientsPage";
import SignInPage from "../pages/SignInPage";
import SignUpPage from "../pages/SignUpPage";

import NotFoundPage from "../pages/NotFoundPage";
import HistoryPage from "../pages/HistoryPage";
import ProfilePage from "../pages/ProfilePage";
import NewAssessment from "../pages/NewAssessment";
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
 
      <Route path="/Dashboard/History" element={<HistoryPage />} />
<Route path="/Dashboard/Profile" element={<ProfilePage />} />

<Route path="/Dashboard/new-assessment" element={<NewAssessment />} />


      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}