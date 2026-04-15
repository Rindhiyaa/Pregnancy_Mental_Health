import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NurseSidebar from "../../components/NurseSidebar";
import { PageTitle, Card, Badge, Loader2 } from "../../components/UI";
import { api } from "../../utils/api";
import { getAvatarColor } from "../../utils/helpers";
import { useTheme } from "../../ThemeContext";
import useContentWidth from "../../hooks/useContentWidth";
import { User, Mail, Phone, Calendar, Droplet, Hash, Navigation, ClipboardList, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function NursePatientProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { ref: mainRef, width: contentWidth, isMobile, isTablet } = useContentWidth();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper function to format date of birth
    const formatDOB = (dob) => {
        if (!dob) return null;
        const date = new Date(dob);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

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
        <div style={{ 
            display: 'flex', 
            gap: isMobile ? 10 : 12, 
            marginBottom: isMobile ? 16 : 20, 
            alignItems: 'flex-start',
            flexDirection: isMobile ? 'column' : 'row'
        }}>
            <div style={{ 
                width: isMobile ? 32 : 36, 
                height: isMobile ? 32 : 36, 
                borderRadius: isMobile ? 8 : 10, 
                background: `${theme.primary}15`, 
                color: theme.primary, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0 
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ 
                    fontSize: isMobile ? 12 : 13, 
                    color: theme.textMuted, 
                    fontWeight: 700, 
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>{label}</div>
                <div style={{ 
                    fontSize: isMobile ? 14 : 15, 
                    fontWeight: 600, 
                    color: theme.textPrimary,
                    lineHeight: 1.4
                }}>{value || "—"}</div>
            </div>
        </div>
    );


    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: theme.pageBg, fontFamily: theme.fontBody }}>
            <NurseSidebar />
            <main 
                ref={mainRef}
                className="portal-main" 
                style={{ 
                    background: theme.pageBg, 
                    fontFamily: theme.fontBody,
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0
                }}>

                <button
                    onClick={() => navigate('/nurse/patients')}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8, 
                        background: 'none', 
                        border: 'none', 
                        color: theme.textMuted, 
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        marginBottom: isMobile ? 16 : 24,
                        fontSize: isMobile ? 13 : 14,
                        padding: isMobile ? '8px 0' : 0
                    }}
                >
                    <ChevronLeft size={isMobile ? 16 : 18} /> Back to Directory
                </button>

                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'flex-start', 
                    marginBottom: isMobile ? 24 : 32,
                    gap: isMobile ? 20 : 0,
                    width: '100%'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        gap: isMobile ? 16 : 24, 
                        alignItems: 'center',
                        flex: 1,
                        minWidth: 0
                    }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ 
                                width: isMobile ? 64 : 80, 
                                height: isMobile ? 64 : 80, 
                                borderRadius: isMobile ? 16 : 20, 
                                background: getAvatarColor(patient.name) + '15', 
                                color: getAvatarColor(patient.name), 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: isMobile ? 24 : 32, 
                                fontWeight: 800,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {patient.name.charAt(0)}
                            </div>
                            <div 
                                style={{
                                    position: "absolute",
                                    bottom: -4,
                                    right: -4,
                                    width: isMobile ? 16 : 20,
                                    height: isMobile ? 16 : 20,
                                    borderRadius: "50%",
                                    border: isMobile ? "3px solid white" : "4px solid white",
                                    background: patient.is_online ? "#10b981" : "#94a3b8",
                                    boxShadow: patient.is_online ? "0 0 10px #10b981" : "none",
                                    zIndex: 1,
                                }}
                                title={patient.is_online ? "Active Now" : "Offline"}
                            />
                        </div>
                        <div style={{ 
                            flex: 1,
                            minWidth: 0
                        }}>
                            <h1 style={{ 
                                fontSize: isMobile ? 20 : 28, 
                                fontWeight: 800, 
                                color: theme.textPrimary, 
                                margin: '0 0 12px 0',
                                lineHeight: 1.2,
                                wordBreak: 'break-word'
                            }}>{patient.name}</h1>
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: isMobile ? 'column' : 'row',
                                flexWrap: 'wrap',
                                gap: isMobile ? 8 : 12, 
                                alignItems: isMobile ? 'flex-start' : 'center'
                            }}>
                                <Badge variant={patient.status === 'Draft' ? 'warning' : 'success'}>
                                    Status: {['Draft', 'Pending', 'Active'].includes(patient.status) ? patient.status : 'Active'}
                                </Badge>
                                <Badge variant="info">ID: {patient.id}</Badge>
                            </div>
                        </div>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        gap: 12, 
                        flexShrink: 0,
                        alignSelf: isMobile ? 'stretch' : 'flex-start'
                    }}>
                        <button
                            onClick={() => navigate(`/nurse/assessment/new?patient=${patient.id}`)}
                            style={{ 
                                padding: isMobile ? '12px 20px' : '10px 20px', 
                                borderRadius: 10, 
                                background: theme.primary, 
                                border: 'none', 
                                color: 'white', 
                                fontWeight: 600, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 8, 
                                cursor: 'pointer',
                                fontSize: isMobile ? 13 : 14,
                                flex: isMobile ? 1 : 'none',
                                justifyContent: 'center',
                                whiteSpace: 'nowrap',
                                boxShadow: `0 4px 12px ${theme.primary}30`,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = `0 6px 16px ${theme.primary}40`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = `0 4px 12px ${theme.primary}30`;
                            }}
                        >
                            <ClipboardList size={isMobile ? 16 : 18} /> 
                            New Assessment
                        </button>
                    </div>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr' : '1fr 1fr'), 
                    gap: isMobile ? 20 : 32 
                }}>
                    <Card padding={isMobile ? "20px" : "32px"}>
                        <h3 style={{ 
                            fontSize: isMobile ? 16 : 18, 
                            fontWeight: 800, 
                            marginBottom: isMobile ? 20 : 24, 
                            color: theme.primary, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8 
                        }}>
                            <User size={isMobile ? 18 : 20} /> Personal Information
                        </h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr' : '1fr 1fr'), 
                            gap: isMobile ? 12 : 16 
                        }}>
                            <InfoRow icon={<Mail size={isMobile ? 16 : 18} />} label="Email Address" value={patient.email} />
                            <InfoRow icon={<Phone size={isMobile ? 16 : 18} />} label="Phone Number" value={patient.phone} />
                            <InfoRow icon={<Calendar size={isMobile ? 16 : 18} />} label="Date of Birth/Age" value={patient.dob ? `${formatDOB(patient.dob)} (${patient.age} yrs)` : (patient.age ? `${patient.age} yrs` : "Unknown")} />
                            <InfoRow icon={<Droplet size={isMobile ? 16 : 18} />} label="Blood Group" value={patient.blood_group || patient.bloodGroup} />
                            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                                <InfoRow
                                    icon={<Navigation size={isMobile ? 16 : 18} />}
                                    label="Home Address"
                                    value={patient.address}
                                />
                            </div>
                            <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                                <InfoRow
                                    icon={<Navigation size={isMobile ? 16 : 18} />}
                                    label="City"
                                    value={patient.city}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card padding={isMobile ? "20px" : "32px"}>
                        <h3 style={{ 
                            fontSize: isMobile ? 16 : 18, 
                            fontWeight: 800, 
                            marginBottom: isMobile ? 20 : 24, 
                            color: theme.secondary, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8 
                        }}>
                            <ClipboardList size={isMobile ? 18 : 20} /> Clinical Summary
                        </h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr' : '1fr 1fr'), 
                            gap: isMobile ? 12 : 16 
                        }}>
                            <InfoRow icon={<Hash size={isMobile ? 16 : 18} />} label="Pregnancy Week" value={`Week ${patient.pregnancy_week || patient.pregnancyWeek || '-'}`} />
                            <InfoRow
                                icon={<User size={isMobile ? 16 : 18} />}
                                label="Assigned Doctor"
                                value={patient.assigned_doctor ? `Dr. ${patient.assigned_doctor}` : "Unassigned"}
                            />
                            <InfoRow
                                icon={<Hash size={isMobile ? 16 : 18} />}
                                label="Previous Pregnancies"
                                value={patient.previous_pregnancies !== null && patient.previous_pregnancies !== undefined 
                                    ? String(patient.previous_pregnancies) 
                                    : "0"}
                            />
                        </div>
                    </Card>
                </div>

            </main>
        </div>
    );
}

