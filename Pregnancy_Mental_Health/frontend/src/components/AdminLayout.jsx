import React from 'react';
import PortalLayout from "./PortalLayout";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children, pageTitle }) {
  return (
    <PortalLayout sidebar={AdminSidebar} pageTitle={pageTitle}>
      {children}
    </PortalLayout>
  );
}
