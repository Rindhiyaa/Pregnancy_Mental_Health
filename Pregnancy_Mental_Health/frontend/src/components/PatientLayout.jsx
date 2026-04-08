/**
 * PatientLayout — shared wrapper for all patient portal pages.
 * Replaces the repeated:
 *   <div style={{ display: "flex", minHeight: "100vh", ... }}>
 *     <PatientSidebar />
 *     <main className="portal-main" style={{ background: theme.pageBg }}>
 *       ...
 *     </main>
 *   </div>
 *
 * Usage:
 *   <PatientLayout>
 *     <PageTitle ... />
 *     ...content...
 *   </PatientLayout>
 */

import React from "react";
import PatientSidebar from "./PatientSidebar";
import { useTheme } from "../ThemeContext";

export default function PatientLayout({ children, style = {} }) {
  const { theme } = useTheme();
  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: theme.pageBg,
      fontFamily: theme.fontBody,
    }}>
      <PatientSidebar />
      <main
        className="portal-main"
        style={{ background: theme.pageBg, ...style }}>
        {children}
      </main>
    </div>
  );
}
