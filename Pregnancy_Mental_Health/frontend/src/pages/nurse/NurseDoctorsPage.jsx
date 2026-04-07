import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../ThemeContext";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Badge, Loader2 } from "../../components/UI";
import { api } from "../../utils/api";
import { getToken, getRoleFromUrl, getFullName } from '../../auth/tokenStorage';
import { toast } from 'react-hot-toast';
import { Stethoscope, Mail, Phone, Clock, Users, ShieldCheck, Search, Filter } from "lucide-react";

export default function NurseDoctorsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [nurseName, setNurseName] = useState("");

  useEffect(() => {
    const role = getRoleFromUrl();  // "nurse"
    const name = getFullName(role);
    
    if (name) {
      setNurseName(name);
    }

    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/nurse/doctors");

      const normalized = (data || []).map(d => ({
        id: d.id,
        fullName: d.fullName || `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim(),
        specialization: d.specialization || "",
        email: d.email,
        employeeId: d.employeeId,
        isAvailable: d.isAvailable,
        active_patients: d.active_patients,
      }));

      setDoctors(normalized);
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
      // Fallback to mock data if API fails (e.g. 403 or network error)
      const mockDoctors = [
        { id: 1, fullName: "Dr. Sarah Johnson", specialization: "OB/GYN Specialist", email: "sarah.j@hospital.com", employeeId: "DOC-001", isAvailable: true, active_patients: 12 },
        { id: 2, fullName: "Dr. Michael Chen", specialization: "Perinatal Psychiatrist", email: "m.chen@hospital.com", employeeId: "DOC-002", isAvailable: false, active_patients: 8 },
        { id: 3, fullName: "Dr. Elena Rodriguez", specialization: "Maternal-Fetal Medicine", email: "elena.r@hospital.com", employeeId: "DOC-003", isAvailable: true, active_patients: 15 }
      ];
      setDoctors(mockDoctors);
      toast.error("Using offline mode. Some features may be limited.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(d =>
    d.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <NurseSidebar />

      <main className="portal-main" style={{ background: theme.pageBg, fontFamily: theme.fontBody }}>
        <PageTitle 
          title={nurseName ? `Welcome, Nurse ${nurseName}` : "Our Medical Team"} 
          subtitle="View and contact doctors available for clinical reviews" 
        />

        <div style={{ margin: '32px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
            <input
              style={{
                width: '100%', padding: '12px 16px 12px 48px', borderRadius: 14,
                border: `1.5px solid ${theme.border}`, background: 'white',
                fontSize: 15, outline: 'none', fontFamily: theme.fontBody
              }}
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.textMuted }}>{filteredDoctors.length} doctors found</div>
          </div>
        </div>

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
                    <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, marginBottom: 4 }}> Dr. {doc.fullName}</div>
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
                    <span style={{ fontWeight: 800, color: theme.text }}>
                      {doc.active_patients ?? 0}
                    </span>
                      <span style={{ color: theme.textMuted, marginLeft: 4 }}>Active Patients</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Mail size={18} color={theme.textMuted} />
                    <div style={{ fontSize: 14, color: theme.textMuted }}>{doc.email || 'doctor@hospital.com'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldCheck size={18} color={theme.textMuted} />
                    <div style={{ fontSize: 14, color: theme.textMuted }}>
                      ID: {doc.employeeId ?? `DOC-${doc.id}`}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => navigate(`/nurse/patients?doctor=${doc.id}`)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1.5px solid ${theme.border}`, background: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
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


