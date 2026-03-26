// src/App.js
import React from "react";
import { useLocation } from "react-router-dom";
import AppRouter from "./components/AppRouter";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from "./ThemeContext";

export default function App() {
  const location = useLocation();

  const publicRoutes = ["/", "/about", "/signin", "/signup", "/forgot-password"];
  const showNavbar = publicRoutes.includes(location.pathname);

  return (
    <ErrorBoundary>
      <ThemeProvider>
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
        {showNavbar && <Navbar />}
        <AppRouter />
        {/* {!isDashboard && <Footer />} */}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
