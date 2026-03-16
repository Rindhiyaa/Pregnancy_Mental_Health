// src/App.js
import React from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "./components/AppRouter";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from 'react-hot-toast';

export default function App() {
  const location = useLocation();

  const isDashboard = location.pathname.startsWith("/dashboard") || 
                    location.pathname.startsWith("/patients") ||
                    location.pathname.startsWith("/history") ||
                    location.pathname.startsWith("/new-assessment") ||
                    location.pathname.startsWith("/schedule") ||
                    location.pathname.startsWith("/profile");

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              fontFamily: 'inherit',
            },
            success: {
              style: {
                background: '#059669',
                color: 'white',
              },
            },
            error: {
              style: {
                background: '#dc2626',
                color: 'white',
              },
            },
          }}
        />
        {!isDashboard && <Navbar />}
        <AppRouter />
        {!isDashboard && <Footer />}
      </AuthProvider>
    </ErrorBoundary>
  );
}
