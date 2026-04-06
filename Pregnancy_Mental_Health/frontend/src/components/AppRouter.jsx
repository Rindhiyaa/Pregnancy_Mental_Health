import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "../contexts/AuthContext";

// Common Pages
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import SignInPage from "../pages/SignInPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProfilePage from "../pages/ProfilePage";
import ChangePasswordPage from "../pages/ChangePasswordPage";

// Doctor Pages
import DashboardPage from "../pages/doctor/DashboardPage";
import PatientsPage from "../pages/doctor/PatientsPage";
import AssessmentsPage from "../pages/doctor/AssessmentsPage";
import DoctorAssessmentReview from "../pages/doctor/DoctorAssessmentReview";
import ClinicalValidation from "../pages/doctor/ClinicalValidation";
import DoctorPatientProfile from "../pages/doctor/DoctorPatientProfile";
import HistoryPage from "../pages/doctor/HistoryPage";
import DoctorProfilePage from "../pages/doctor/DoctorProfilePage";
import SchedulePage from "../pages/doctor/SchedulePage";

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
import RecoveryRequestsPage from "../pages/admin/RecoveryRequestsPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/signin" element={<SignInPage />} />
      {/* <Route path="/signup" element={<SignUpPage />} /> */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <AuthProvider portalRole="admin">
          <Routes>
            <Route path="dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="doctors" element={<ProtectedRoute requiredRole="admin"><AdminDoctorsPage /></ProtectedRoute>} />
            <Route path="nurses" element={<ProtectedRoute requiredRole="admin"><AdminNursesPage /></ProtectedRoute>} />
            <Route path="patients" element={<ProtectedRoute requiredRole="admin"><AdminPatientsPage /></ProtectedRoute>} />
            <Route path="recovery" element={<ProtectedRoute requiredRole="admin"><RecoveryRequestsPage /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute requiredRole="admin"><AnalyticsPage /></ProtectedRoute>} />
            <Route path="audit" element={<ProtectedRoute requiredRole="admin"><AuditLogsPage /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      } />

      {/* Nurse Routes */}
      <Route path="/nurse/*" element={
        <AuthProvider portalRole="nurse">
          <Routes>
            <Route path="dashboard" element={<ProtectedRoute requiredRole="nurse"><NurseDashboard /></ProtectedRoute>} />
            <Route path="patients" element={<ProtectedRoute requiredRole="nurse"><NursePatientsPage /></ProtectedRoute>} />
            <Route path="patients/:id" element={<ProtectedRoute requiredRole="nurse"><NursePatientProfile /></ProtectedRoute>} />
            <Route path="patients/new" element={<ProtectedRoute requiredRole={["nurse", "doctor"]}><NurseRegisterPatient /></ProtectedRoute>} />
            <Route path="assessment/new" element={<ProtectedRoute requiredRole={["nurse", "doctor"]}><NurseNewAssessment /></ProtectedRoute>} />
            <Route path="assessments" element={<ProtectedRoute requiredRole="nurse"><NurseAssessmentHistory /></ProtectedRoute>} />
            <Route path="appointments" element={<ProtectedRoute requiredRole={["nurse", "doctor"]}><NurseAppointmentsPage /></ProtectedRoute>} />
            <Route path="doctors" element={<ProtectedRoute requiredRole="nurse"><NurseDoctorsPage /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute requiredRole="nurse"><ClinicianMessages /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute requiredRole="nurse"><NurseProfilePage /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      } />

      {/* Doctor Routes */}
      <Route path="/doctor/*" element={
        <AuthProvider portalRole="doctor">
          <Routes>
            <Route path="dashboard" element={<ProtectedRoute requiredRole="doctor"><DashboardPage /></ProtectedRoute>} />
            <Route path="appointments" element={<ProtectedRoute requiredRole="doctor"><SchedulePage /></ProtectedRoute>} />
            <Route path="patients" element={<ProtectedRoute requiredRole="doctor"><PatientsPage /></ProtectedRoute>} />
            <Route path="patients/:id" element={<ProtectedRoute requiredRole="doctor"><DoctorPatientProfile /></ProtectedRoute>} />
            <Route path="assessments" element={<ProtectedRoute requiredRole="doctor"><AssessmentsPage /></ProtectedRoute>} />
            <Route path="review/:id" element={<ProtectedRoute requiredRole="doctor"><DoctorAssessmentReview /></ProtectedRoute>} />
            <Route path="validate/:id" element={<ProtectedRoute requiredRole="doctor"><ClinicalValidation /></ProtectedRoute>} />
            <Route path="history" element={<ProtectedRoute requiredRole="doctor"><HistoryPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute requiredRole="doctor"><DoctorProfilePage /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      } />

      {/* Patient Routes */}
      <Route path="/patient/*" element={
        <AuthProvider portalRole="patient">
          <Routes>
            <Route path="dashboard" element={<ProtectedRoute requiredRole="patient"><PatientDashboard /></ProtectedRoute>} />
            <Route path="results" element={<ProtectedRoute requiredRole="patient"><PatientResults /></ProtectedRoute>} />
            <Route path="mood" element={<ProtectedRoute requiredRole="patient"><PatientMoodTracker /></ProtectedRoute>} />
            <Route path="careplan" element={<ProtectedRoute requiredRole="patient"><PatientCarePlan /></ProtectedRoute>} />
            <Route path="resources" element={<ProtectedRoute requiredRole="patient"><PatientResources /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute requiredRole="patient"><PatientMessages /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute requiredRole="patient"><PatientProfile /></ProtectedRoute>} />
            <Route path="change-password" element={<Navigate to="/change-password" replace />} />
          </Routes>
        </AuthProvider>
      } />

      {/* Catch-all */}
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
