import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Loader2, HeartPulse, Activity, Smile,
  ChevronDown, ChevronUp, Calendar, Clock,
  CheckCircle, User, Info, MessageCircle, ArrowRight, FileText, Download
} from "lucide-react";
import PatientSidebar from "../../components/PatientSidebar";
import FilterToolbar from "../../components/FilterToolbar";
import { api } from "../../utils/api";
import { useTheme } from "../../ThemeContext";
import { PageTitle, Divider, Card, Badge, PrimaryBtn, Pagination } from "../../components/UI";
import toast from "react-hot-toast";


export default function PatientResults() {
  const { theme } = useTheme();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const itemsPerPage = 5;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <Card style={{ padding: "10px 14px", border: `1px solid ${theme.divider}`, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary }}>
          Assessment Completed
        </div>
      </Card>
    );
  };

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/patient/assessments");
        const assessmentsData = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
  
        const normalized = assessmentsData.map((a) => {
          const rawData = typeof a.raw_data === "object" && a.raw_data !== null ? a.raw_data : {};
          const createdAt = a.created_at ? new Date(a.created_at) : new Date();
  
          return {
            ...a,
            date:
              a.date ||
              createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            short_date:
              a.short_date ||
              createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              }),
            doctor_name: a.doctor_name || a.clinician_name || "Care Team",
            epds_questions:
              a.epds_questions ||
              (Object.keys(rawData)
                .filter((k) => k.startsWith("epds_"))
                .map((k, i) => ({
                  q: `Question ${i + 1}`,
                  answer: "Reported",
                  score: rawData[k],
                }))),
            clinical_factors:
              a.clinical_factors || {
                sleep_quality: rawData.epds_7 > 1 ? "Poor" : "Good",
                appetite: "Normal",
                social_support:
                  rawData.support_during_pregnancy === "No"
                    ? "Weak"
                    : "Strong",
                partner_support: "Good",
                anxiety_level: "Normal",
                financial_stress: false,
                previous_depression:
                  rawData.depression_before_pregnancy === "Yes",
              },
            plan: a.plan || null,      // no default text
            followups:
              a.followups && a.followups.length > 0 ? a.followups : [], // no dummy follow-up
            doctor_message: a.doctor_message || null, // if you add this later in backend
          };
        });
  
        setAssessments(normalized);
      } catch (err) {
        console.error("Error loading assessments", err);
        toast.error("Failed to load assessments");
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAssessments();
  }, []);

  const latest = assessments[0];

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = searchQuery === "" || 
      a.date?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const filterOptions = [
    { value: "All", label: "All Results", icon: FileText }
  ];

  const handlePDFExport = () => {
    window.print();
    toast.success("PDF export initiated!");
  };

  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const paginatedAssessments = filteredAssessments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <PatientSidebar />
      <main className="portal-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.pageBg }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color={theme.primary} style={{ marginBottom: 16 }} />
          <div style={{ color: theme.textMuted, fontWeight: 500 }}>Loading your results...</div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <PatientSidebar />

      <main className="portal-main" style={{ background: theme.pageBg }}>

        <PageTitle
          title="My Results"
          subtitle="Your complete wellness assessment history"
        />
        <Divider />

        {/* ── SUMMARY ROW ── */}
        <div className="stats-grid-3" style={{ gap: 20, marginBottom: 32 }}>
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: theme.primary, marginBottom: 4 }}>{assessments.length}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Assessments</div>
          </Card>
          <Card style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, marginBottom: 4 }}>
              {latest?.short_date ?? "—"}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Latest Submission</div>
          </Card>
          <Card style={{ padding: "16px 20px" }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: theme.textPrimary,
                marginBottom: 4,
              }}
            >
              {assessments.filter(
                (a) => a.status === "reviewed" || a.status === "completed"
              ).length}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: theme.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Clinician Reviewed
            </div>
          </Card>
        </div>

        {/* ── ASSESSMENT LIST ── */}
        <div style={{ marginBottom: 20 }}>
          <FilterToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filterOptions}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onPDFExport={handlePDFExport}
            placeholder="Search by date or doctor..."
            showExport={true}
          />
        </div>
        
        <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, marginBottom: 20 }}>
          Assessment History
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {paginatedAssessments.map((a) => {
            const displayDoctor =
              a.doctor_name && a.doctor_name !== "Care Team"
                ? `Dr. ${a.doctor_name}`
                : (a.doctor_name || "Care Team");
            

            const messageText =
              a.doctor_message ||
              a.plan ||
              "Your clinician will share a message here when available.";

            return (
              <Card key={a.id} style={{ padding: 0, overflow: "hidden" }}>
                <div
                  onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ textAlign: "center", minWidth: 60 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: theme.textMuted,
                          textTransform: "uppercase",
                        }}
                      >
                        {a.short_date.split(" ")[1]}
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: theme.textPrimary,
                        }}
                      >
                        {a.short_date.split(" ")[0]}
                      </div>
                    </div>
                    <div
                      style={{
                        height: 32,
                        width: 1,
                        background: theme.divider,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: theme.textPrimary,
                          }}
                        >
                          Assessment completed
                        </span>
                        {a.status === "finalized" && (
                          <Badge type="warning" size="sm">
                            Clinician Reviewed
                          </Badge>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: theme.textMuted }}>
                        Completed on {a.date} • Reviewed by{" "}
                        <strong>{displayDoctor}</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ color: theme.primary }}>
                    {expanded === a.id ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {expanded === a.id && (
                  <div
                    style={{
                      padding: "0 24px 24px 24px",
                      borderTop: `1px solid ${theme.divider}`,
                    }}
                  >
                    <div style={{ paddingTop: 24, maxWidth: "800px" }}>
                      <h4
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: theme.textPrimary,
                          marginBottom: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <MessageCircle size={18} color={theme.primary} /> Doctor's Message
                      </h4>
                      <Card
                        style={{
                          background: theme.primaryBg,
                          border: "none",
                          marginBottom: 32,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 15,
                            color: theme.primaryText,
                            lineHeight: 1.6,
                            margin: 0,
                          }}
                        >
                          {messageText}
                        </p>
                      </Card>

                      <h4
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: theme.textPrimary,
                          marginBottom: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <CheckCircle size={18} color={theme.success} /> Care Plan & Next Steps
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                          padding: "20px",
                          background: theme.pageBg,
                          borderRadius: 12,
                        }}
                      >
                        {a.followups && a.followups.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              fontSize: 15,
                              color: theme.textPrimary,
                              fontWeight: 700,
                            }}
                          >
                            <div
                              style={{
                                background: theme.primary + "20",
                                padding: "4px",
                                borderRadius: "50%",
                                display: "flex",
                              }}
                            >
                              <Calendar size={18} color={theme.primary} />
                            </div>
                            Meeting Scheduled: {a.followups[0].date} at{" "}
                            {a.followups[0].time}
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            fontSize: 15,
                            color: theme.textSecondary,
                            fontWeight: 500,
                          }}
                        >
                          <div
                            style={{
                              background: theme.success + "20",
                              padding: "4px",
                              borderRadius: "50%",
                              display: "flex",
                            }}
                          >
                            <CheckCircle size={18} color={theme.success} />
                          </div>
                          Attend scheduled follow-up
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            fontSize: 15,
                            color: theme.textSecondary,
                            fontWeight: 500,
                          }}
                        >
                          <div
                            style={{
                              background: theme.success + "20",
                              padding: "4px",
                              borderRadius: "50%",
                              display: "flex",
                            }}
                          >
                            <CheckCircle size={18} color={theme.success} />
                          </div>
                          Practice relaxation techniques
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            fontSize: 15,
                            color: theme.textSecondary,
                            fontWeight: 500,
                          }}
                        >
                          <div
                            style={{
                              background: theme.success + "20",
                              padding: "4px",
                              borderRadius: "50%",
                              display: "flex",
                            }}
                          >
                            <CheckCircle size={18} color={theme.success} />
                          </div>
                          Reach out if you feel overwhelmed
                        </div>
                      </div>

                      <PrimaryBtn
                        style={{ marginTop: 24, width: "fit-content" }}
                        onClick={handlePDFExport}
                      >
                        <FileText size={16} style={{ marginRight: 8 }} />
                        Export as PDF
                      </PrimaryBtn>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
  
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

        {/* ── HELP FOOTER ── */}
        <div style={{
          marginTop: 40,
          padding: "28px 32px",
          background: theme.primaryBg,
          borderRadius: 16,
          border: `1.5px solid ${theme.primary}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: theme.primary + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MessageCircle size={22} color={theme.primary} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>Questions? Message your care team</div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>Your clinician is here to support you every step of the way.</div>
            </div>
          </div>
          <PrimaryBtn onClick={() => window.location.href = "/patient/messages"}>
            <MessageCircle size={16} style={{ verticalAlign: "middle", marginRight: 8 }} /> Message Now
          </PrimaryBtn>
        </div>
      </main>
    </div>
  );
}



