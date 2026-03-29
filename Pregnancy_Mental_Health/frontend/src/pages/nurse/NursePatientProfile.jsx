import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Badge, Loader2 } from "../../components/UI";
import { api } from "../../utils/api";
// import { dummyApi, USE_DUMMY_DATA, getAvatarColor } from "../../utils/dummyData";
import { getAvatarColor } from "../../utils/helpers";
import { useTheme } from "../../ThemeContext";
import { User, Mail, Phone, Calendar, Droplet, Hash, Navigation, ClipboardList, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function NursePatientProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatient = async () => {
            setLoading(true);
            try {
              const { data } = await api.get(`/nurse/patients/${id}`);
              setPatient(data || null);
            } catch (err) {
              console.error("Error loading patient:", err);
              toast.error("Failed to load patient details");
              setPatient(null);
            } finally {
              setLoading(false);
            }
          };
        fetchPatient();
      }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: theme.pageBg }}>
                <NurseSidebar />
                <main className="portal-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg }}>
                    <Loader2 className="animate-spin" size={40} color={theme.primary} />
                </main>
            </div>
        );
    }

    if (!patient) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: theme.pageBg }}>
                <NurseSidebar />
                <main className="portal-main" style={{ textAlign: 'center', background: theme.pageBg }}>
                    <h2>Patient Not Found</h2>
                    <button onClick={() => navigate('/nurse/patients')} style={{ padding: '10px 20px', background: theme.primary, color: 'white', borderRadius: 8, border: 'none', marginTop: 20, cursor: 'pointer' }}>
                        Back to Patients
                    </button>
                </main>
            </div>
        );
    }

    const InfoRow = ({ icon, label, value }) => (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${theme.primary}15`, color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 13, color: theme.textMuted, fontWeight: 700, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{value || "-"}</div>
            </div>
        </div>
    );


    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.pageBg }}>
            <NurseSidebar />
            <main className="portal-main" style={{ background: theme.pageBg }}>

                <button
                    onClick={() => navigate('/nurse/patients')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: theme.textMuted, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}
                >
                    <ChevronLeft size={18} /> Back to Directory
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                        <div style={{ 
                            width: 80, height: 80, borderRadius: 20, 
                            background: getAvatarColor(patient.name) + '15', color: getAvatarColor(patient.name), 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: 32, fontWeight: 800,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: '0 0 8px 0' }}>{patient.name}</h1>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Badge variant={patient.status === 'Draft' ? 'warning' : 'success'}>
                                    Status: {['Draft', 'Pending', 'Active'].includes(patient.status) ? patient.status : 'Active'}
                                </Badge>
                                <Badge variant="info">ID: {patient.id}</Badge>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={() => navigate(`/nurse/assessment/new?patient=${patient.id}`)}
                            style={{ padding: '10px 20px', borderRadius: 10, background: 'white', border: `1px solid ${theme.border}`, color: theme.text, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        >
                            <ClipboardList size={18} /> New Assessment
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                    <Card padding="32px">
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: theme.primary, display: 'flex', alignItems: 'center', gap: 8 }}><User size={20} /> Personal Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <InfoRow icon={<Mail size={18} />} label="Email Address" value={patient.email} />
                            <InfoRow icon={<Phone size={18} />} label="Phone Number" value={patient.phone} />
                            <InfoRow icon={<Calendar size={18} />} label="Date of Birth/Age" value={patient.dob ? `${patient.dob} (${patient.age} yrs)` : (patient.age ? `${patient.age} yrs` : "Unknown")} />
                            <InfoRow icon={<Droplet size={18} />} label="Blood Group" value={patient.blood_group || patient.bloodGroup} />
                            <div style={{ gridColumn: 'span 2' }}>
                            <InfoRow
                              icon={<Navigation size={18} />}
                              label="Home Address"
                              value={patient.address}
                            />
                            <InfoRow
                              icon={<Navigation size={18} />}
                              label="City"
                              value={patient.city}
                            />
                            </div>
                        </div>
                    </Card>

                    <Card padding="32px">
                        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: theme.secondary, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={20} /> Clinical Summary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <InfoRow icon={<Hash size={18} />} label="Pregnancy Week" value={`Week ${patient.pregnancy_week || patient.pregnancyWeek || '-'}`} />
                            <InfoRow
                                icon={<User size={18} />}
                                label="Assigned Doctor"
                                value={patient.assigned_doctor ? `Dr. ${patient.assigned_doctor}` : "Unassigned"}
                                />
                            <InfoRow
                            icon={<Hash size={18} />}
                            label="Previous Pregnancies"
                            value={patient.previous_pregnancies ?? "0"}
/>
                        </div>
                    </Card>
                </div>

            </main>
        </div>
    );
}

