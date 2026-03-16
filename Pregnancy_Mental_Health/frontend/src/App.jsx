// src/App.js
import React from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./components/AppRouter";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const location = useLocation();

  const isDashboard = location.pathname.startsWith("/dashboard") || 
                    location.pathname.startsWith("/patients") ||
                    location.pathname.startsWith("/history") ||
                    location.pathname.startsWith("/new-assessment") ||
                    location.pathname.startsWith("/profile");

  return (
    <ErrorBoundary>
      <AuthProvider>
        {!isDashboard && <Navbar />}
        <AppRouter />
        {!isDashboard && <Footer />}
      </AuthProvider>
    </ErrorBoundary>
  );
}
