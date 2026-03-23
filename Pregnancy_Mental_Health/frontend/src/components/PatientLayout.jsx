import PortalLayout from "./PortalLayout";
import PatientSidebar from "./PatientSidebar";

export default function PatientLayout({ children, pageTitle }) {
  return (
    <PortalLayout sidebar={PatientSidebar} pageTitle={pageTitle}>
      {children}
    </PortalLayout>
  );
}
