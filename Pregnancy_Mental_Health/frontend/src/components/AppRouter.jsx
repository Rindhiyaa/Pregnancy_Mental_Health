import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Common Pages
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import SignInPage from "../pages/SignInPage";
import SignUpPage from "../pages/SignUpPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProfilePage from "../pages/ProfilePage";

// Doctor Pages
import DashboardPage from "../pages/doctor/DashboardPage";
import PatientsPage from "../pages/doctor/PatientsPage";
import AssessmentsPage from "../pages/doctor/AssessmentsPage";
import DoctorAssessmentReview from "../pages/doctor/DoctorAssessmentReview";
import ClinicalValidation from "../pages/doctor/ClinicalValidation";
import DoctorPatientProfile from "../pages/doctor/DoctorPatientProfile";
import HistoryPage from "../pages/doctor/HistoryPage";
import DoctorProfilePage from "../pages/doctor/DoctorProfilePage";

// Nurse Pages
import NurseDashboard from "../pages/nurse/NurseDashboard";
import NursePatientsPage from "../pages/nurse/NursePatientsPage";
import NursePatientProfile from "../pages/nurse/NursePatientProfile";
import NurseRegisterPatient from "../pages/nurse/NurseRegisterPatient";
import NurseNewAssessment from "../pages/nurse/NurseNewAssessment";
import NurseAssessmentHistory from "../pages/nurse/NurseAssessmentHistory";
import NurseAppointmentsPage from "../pages/nurse/NurseAppointmentsPage";
import NurseDoctorsPage from "../pages/nurse/NurseDoctorsPage";
import NurseProfilePage from "../pages/nurse/NurseProfilePage";
import ClinicianMessages from "../pages/doctor/ClinicianMessages";

// Patient Pages
import PatientDashboard from "../pages/patient/PatientDashboard";
import PatientResults from "../pages/patient/PatientResults";
import PatientMoodTracker from "../pages/patient/PatientMoodTracker";
import PatientCarePlan from "../pages/patient/PatientCarePlan";
import PatientResources from "../pages/patient/PatientResources";
import PatientMessages from "../pages/patient/PatientMessages";
import PatientProfile from "../pages/patient/PatientProfile";
import PatientChangePassword from "../pages/patient/PatientChangePassword";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminDoctorsPage from "../pages/admin/DoctorsPage";
import AdminNursesPage from "../pages/admin/NursesPage";
import AdminPatientsPage from "../pages/admin/PatientsPage";
import AnalyticsPage from "../pages/admin/AnalyticsPage";
import AuditLogsPage from "../pages/admin/AuditLogsPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute requiredRole="admin"><AdminDoctorsPage /></ProtectedRoute>} />
      <Route path="/admin/nurses" element={<ProtectedRoute requiredRole="admin"><AdminNursesPage /></ProtectedRoute>} />
      <Route path="/admin/patients" element={<ProtectedRoute requiredRole="admin"><AdminPatientsPage /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute requiredRole="admin"><AuditLogsPage /></ProtectedRoute>} />

      {/* Nurse Routes */}
      <Route path="/nurse/dashboard" element={<ProtectedRoute requiredRole="nurse"><NurseDashboard /></ProtectedRoute>} />
      <Route path="/nurse/patients" element={<ProtectedRoute requiredRole="nurse"><NursePatientsPage /></ProtectedRoute>} />
      <Route path="/nurse/patients/:id" element={<ProtectedRoute requiredRole="nurse"><NursePatientProfile /></ProtectedRoute>} />
      <Route path="/nurse/patients/new" element={<ProtectedRoute requiredRole={["nurse", "doctor"]}><NurseRegisterPatient /></ProtectedRoute>} />
      <Route path="/nurse/assessment/new" element={<ProtectedRoute requiredRole={["nurse", "doctor"]}><NurseNewAssessment /></ProtectedRoute>} />
      <Route path="/nurse/assessments" element={<ProtectedRoute requiredRole="nurse"><NurseAssessmentHistory /></ProtectedRoute>} />
      <Route path="/nurse/appointments" element={<ProtectedRoute requiredRole={["nurse", "doctor"]}><NurseAppointmentsPage /></ProtectedRoute>} />
      <Route path="/nurse/doctors" element={<ProtectedRoute requiredRole="nurse"><NurseDoctorsPage /></ProtectedRoute>} />
      <Route path="/nurse/messages" element={<ProtectedRoute requiredRole="nurse"><ClinicianMessages /></ProtectedRoute>} />
      <Route path="/nurse/profile" element={<ProtectedRoute requiredRole="nurse"><NurseProfilePage /></ProtectedRoute>} />

      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="doctor"><DashboardPage /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute requiredRole="doctor"><PatientsPage /></ProtectedRoute>} />
      <Route path="/doctor/patients/:id" element={<ProtectedRoute requiredRole="doctor"><DoctorPatientProfile /></ProtectedRoute>} />
      <Route path="/doctor/assessments" element={<ProtectedRoute requiredRole="doctor"><AssessmentsPage /></ProtectedRoute>} />
      <Route path="/doctor/review/:id" element={<ProtectedRoute requiredRole="doctor"><DoctorAssessmentReview /></ProtectedRoute>} />
      <Route path="/doctor/validate/:id" element={<ProtectedRoute requiredRole="doctor"><ClinicalValidation /></ProtectedRoute>} />
      <Route path="/doctor/history" element={<ProtectedRoute requiredRole="doctor"><HistoryPage /></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute requiredRole="doctor"><DoctorProfilePage /></ProtectedRoute>} />

      {/* Patient Routes */}
      <Route path="/patient/dashboard" element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/results" element={<ProtectedRoute requiredRole="patient"><PatientResults /></ProtectedRoute>} />
      <Route path="/patient/mood" element={<ProtectedRoute requiredRole="patient"><PatientMoodTracker /></ProtectedRoute>} />
      <Route path="/patient/careplan" element={<ProtectedRoute requiredRole="patient"><PatientCarePlan /></ProtectedRoute>} />
      <Route path="/patient/resources" element={<ProtectedRoute requiredRole="patient"><PatientResources /></ProtectedRoute>} />
      <Route path="/patient/messages" element={<ProtectedRoute requiredRole="patient"><PatientMessages /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute requiredRole="patient"><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/change-password" element={<ProtectedRoute requiredRole="patient"><PatientChangePassword /></ProtectedRoute>} />

      {/* Catch-all */}
      {/* <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} /> */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
