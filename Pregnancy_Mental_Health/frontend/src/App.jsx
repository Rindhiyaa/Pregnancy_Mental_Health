// src/App.js
import React from "react";
import { useLocation } from "react-router-dom";
import AppRouter from "./components/AppRouter";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function App() {
  const location = useLocation();
  console.log("pathname =", location.pathname);  // debug

  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && <Navbar />}
      <AppRouter />
      {!isDashboard && <Footer />}
    </>
  );
}
