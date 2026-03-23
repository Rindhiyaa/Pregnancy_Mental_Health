import PortalLayout from "./PortalLayout";
import NurseSidebar from "./NurseSidebar";

export default function NurseLayout({ children, pageTitle }) {
  return (
    <PortalLayout sidebar={NurseSidebar} pageTitle={pageTitle}>
      {children}
    </PortalLayout>
  );
}
