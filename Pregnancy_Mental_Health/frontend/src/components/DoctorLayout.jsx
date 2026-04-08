import React from 'react';
import PortalLayout from "./PortalLayout";
import DoctorSidebar from "./DoctorSidebar";

export default function DoctorLayout({ children, pageTitle }) {
  return (
    <PortalLayout sidebar={DoctorSidebar} pageTitle={pageTitle}>
      {children}
    </PortalLayout>
  );
}
