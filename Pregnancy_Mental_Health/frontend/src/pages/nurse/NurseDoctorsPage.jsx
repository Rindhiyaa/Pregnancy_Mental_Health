import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Badge, Loader2 } from "../../components/UI";
import { api } from "../../utils/api";
import { dummyApi, USE_DUMMY_DATA } from "../../utils/dummyData";
import { Stethoscope, Mail, Phone, Clock, Users, ShieldCheck } from "lucide-react";
import FilterToolbar from "../../components/FilterToolbar";
import { exportDoctorsToPDF, exportDoctorsToExcel, exportDoctorsToCSV } from "../../utils/exportUtils";

export default function NurseDoctorsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        if (USE_DUMMY_DATA) {
          const data = await dummyApi.getDoctors();
          setDoctors(data);
        } else {
          const res = await api.get("/nurse/doctors");
          if (res.ok) {
            const data = await res.json();
            setDoctors(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = d.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = availabilityFilter === "all" ||
      (availabilityFilter === "available" && d.isAvailable !== false) ||
      (availabilityFilter === "busy" && d.isAvailable === false);
    return matchesSearch && matchesAvailability;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <NurseSidebar />

      <main className="portal-main" style={{ background: theme.pageBg, fontFamily: theme.fontBody }}>
        <PageTitle title="Our Medical Team" subtitle="View and contact doctors available for clinical reviews" />

        <Card glass noPadding style={{ margin: '32px 0 24px' }}>
          <FilterToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search by name or specialization..."
            filters={[
              { label: "All", value: "all" },
              { label: "Available", value: "available" },
              { label: "Busy", value: "busy" },
            ]}
            activeFilter={availabilityFilter}
            onFilterChange={setAvailabilityFilter}
            onPDFExport={() => exportDoctorsToPDF(filteredDoctors)}
            onExcelExport={() => exportDoctorsToExcel(filteredDoctors)}
            onCSVExport={() => exportDoctorsToCSV(filteredDoctors)}
          />
        </Card>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Loader2 className="animate-spin" size={40} color={theme.primary} style={{ margin: '0 auto 16px' }} />
            <div style={{ color: theme.textMuted, fontWeight: 600 }}>Loading medical team...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
            {filteredDoctors.map((doc) => (
              <Card key={doc.id || doc.fullName} padding="32px" hover>
                <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                  <div style={{
                    width: 70, height: 70, borderRadius: 20,
                    background: theme.heroGradient,
                    color: 'white', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 800,
                    boxShadow: `0 8px 16px -4px ${theme.primary}40`
                  }}>
                    {doc.fullName?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 4 }}>{doc.fullName}</div>
                    <div style={{ fontSize: 14, color: theme.primary, fontWeight: 700 }}>{doc.specialization || 'OB/GYN Specialist'}</div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: doc.isAvailable !== false ? '#10b981' : '#f59e0b' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted }}>{doc.isAvailable !== false ? 'Available' : 'Busy'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: `1px solid ${theme.border}`, paddingTop: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Users size={18} color={theme.textMuted} />
                    <div style={{ fontSize: 14 }}>
                      <span style={{ fontWeight: 800, color: theme.text }}>{doc.active_patients || Math.floor(Math.random() * 20)}</span>
                      <span style={{ color: theme.textMuted, marginLeft: 4 }}>Active Patients</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Mail size={18} color={theme.textMuted} />
                    <div style={{ fontSize: 14, color: theme.textMuted }}>{doc.email || 'doctor@hospital.com'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldCheck size={18} color={theme.textMuted} />
                    <div style={{ fontSize: 14, color: theme.textMuted }}>ID: {doc.employeeId || 'MD-12942'}</div>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => navigate(`/nurse/patients?doctor=${doc.id}`)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${theme.border}`, background: theme.cardBg, color: theme.text, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    View Patients
                  </button>
                  <button 
                    onClick={() => navigate(`/nurse/messages?to=${doc.id}&role=doctor`)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: theme.primary, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Message
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


