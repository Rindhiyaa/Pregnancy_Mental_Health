import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import { api } from "../../utils/api";
import { exportAssessmentToPDF } from "../../utils/pdfExport";
import { exportAssessmentsToPDF, exportAssessmentsToExcel, exportAssessmentsToCSV } from "../../utils/exportUtils";
import "../../styles/HistoryPage.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DoctorSidebar from "../../components/DoctorSidebar";
import FilterToolbar from "../../components/FilterToolbar";
import {
    Card,
    Badge,
    PageTitle,
    Table,
    TableRow,
    TableCell,
    Pagination,
    Loader2
} from "../../components/UI";
import {
    Download,
    Trash2,
    Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAvatarColor } from "../../utils/dummyData";

const HistoryPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme } = useTheme();
    const [rows, setRows] = useState([]);
    const [filteredRows, setFilteredRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRisk, setFilterRisk] = useState("all");
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/doctor/assessments');
            if (res.ok) {
                const data = await res.json();
                const sorted = data.sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));
                setRows(sorted);
                setFilteredRows(sorted);
            }
        } catch (err) {
            console.error("Failed to fetch history:", err);
            toast.error("Failed to load clinical history");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        let filtered = rows;
        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.plan?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterRisk !== "all") {
            filtered = filtered.filter(r => r.risk_level?.toLowerCase().includes(filterRisk.toLowerCase()));
        }
        setFilteredRows(filtered);
        setCurrentPage(1);
    }, [searchTerm, filterRisk, rows]);

    const paginatedItems = useMemo(() => {
        return filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredRows, currentPage]);

    const totalPages = Math.ceil(filteredRows.length / itemsPerPage);

    const getRiskFactorData = (assessment) => {
        if (!assessment || !assessment.raw_data) return [
            { name: 'EPDS Score', value: assessment?.score || 45 },
            { name: 'Initial Analysis', value: 30 }
        ];
        // Simplified for the glass modal
        return [
            { name: 'Mental Score', value: 85 },
            { name: 'Physical Risk', value: 65 },
            { name: 'Sleep Pattern', value: 45 },
            { name: 'Support System', value: 75 }
        ];
    };

    const deleteAssessment = async (id) => {
        if (!window.confirm("Are you sure you want to delete this clinical record?")) return;
        try {
            const res = await api.delete(`/assessments/${id}`);
            if (res.ok) {
                toast.success("Record deleted successfully");
                fetchHistory();
            }
        } catch (err) {
            toast.error("Failed to delete record");
        }
    };

    if (loading) return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: theme.pageBg }}>
            <Loader2 size={48} className="animate-spin" color={theme.primary} />
        </div>
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg }}>
            <DoctorSidebar />

            <main style={{ flex: 1, marginLeft: 260, padding: "40px", boxSizing: 'border-box' }}>
                <header style={{ marginBottom: "32px" }}>
                    <PageTitle
                        title="Comprehensive History"
                        subtitle="Review all previous clinical interventions and AI diagnostic records."
                    />
                </header>

                <Card glass noPadding style={{ marginBottom: 24 }}>
                    <FilterToolbar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        placeholder="Search historical logs..."
                        filters={[
                            { label: "All Risk", value: "all" },
                            { label: "High Risk", value: "high" },
                            { label: "Moderate Risk", value: "moderate" },
                            { label: "Low Risk", value: "low" },
                        ]}
                        activeFilter={filterRisk}
                        onFilterChange={setFilterRisk}
                        onPDFExport={() => exportAssessmentsToPDF(filteredRows)}
                        onExcelExport={() => exportAssessmentsToExcel(filteredRows)}
                        onCSVExport={() => exportAssessmentsToCSV(filteredRows)}
                    />
                </Card>

                <Card glass noPadding>
                    <Table
                        headers={["Patient", "Assessment Date", "Diagnostic Risk", "Score", "Care Plan Preview", "Clinical Actions"]}
                        loading={false}
                        emptyMessage="No historical records found matching your criteria."
                    >
                        {paginatedItems.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <div style={{
                                            width: "40px", height: "40px", borderRadius: "12px",
                                            background: getAvatarColor(row.patient_name) + '15', color: getAvatarColor(row.patient_name), display: "flex", alignItems: "center",
                                            justifyContent: "center", fontWeight: 800, fontSize: "14px"
                                        }}>
                                            {row.patient_name?.charAt(0)}
                                        </div>
                                        <div style={{ fontWeight: 700, color: theme.textPrimary }}>{row.patient_name}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div style={{ color: theme.textSecondary, fontSize: 13, fontWeight: 600 }}>
                                        {new Date(row.timestamp || row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={(row.risk_level || "").toLowerCase().includes("high") ? "danger" : (row.risk_level || "").toLowerCase().includes("moderate") ? "warning" : "success"}>
                                        {row.risk_level || "Low Risk"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div style={{ fontWeight: 800, fontSize: 16, color: (row.score || 0) >= 13 ? theme.dangerText : theme.textPrimary }}>
                                        {row.score || row.epds_score || 0}/30
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div style={{ fontSize: 12, color: theme.textMuted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {row.plan || "Monitoring patient progression..."}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => { setSelectedAssessment(row); setShowModal(true); }}
                                            style={{ background: theme.glassBg, border: `1px solid ${theme.glassBorder}`, color: theme.primary, padding: '8px', borderRadius: 8, cursor: 'pointer' }}
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => exportAssessmentToPDF(row)}
                                            style={{ background: theme.glassBg, border: `1px solid ${theme.glassBorder}`, color: theme.textSecondary, padding: '8px', borderRadius: 8, cursor: 'pointer' }}
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteAssessment(row.id)}
                                            style={{ background: theme.glassBg, border: `1px solid ${theme.glassBorder}`, color: theme.dangerText, padding: '8px', borderRadius: 8, cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </Card>

                <div style={{ marginTop: 32 }}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Glass Modal for Details */}
                {showModal && selectedAssessment && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }} onClick={() => setShowModal(false)}>
                        <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: 20, padding: 40, maxWidth: 800, width: '90%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 20, background: getAvatarColor(selectedAssessment.patient_name) + '15', color: getAvatarColor(selectedAssessment.patient_name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
                                        {selectedAssessment.patient_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>{selectedAssessment.patient_name}</h2>
                                        <div style={{ fontSize: 13, color: '#6B7280' }}>ID: {selectedAssessment.id} • {new Date(selectedAssessment.timestamp).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 24 }}>✕</button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
                                <div>
                                    <h4 style={{ color: '#374151', marginBottom: 16, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Overview</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                                        <Badge variant={(selectedAssessment.risk_level || "").toLowerCase().includes("high") ? "danger" : "warning"} size="lg">
                                            {selectedAssessment.risk_level}
                                        </Badge>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary }}>{selectedAssessment.score}/100 Score</div>
                                    </div>

                                    <div style={{ height: 200 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={getRiskFactorData(selectedAssessment)} layout="vertical">
                                                <XAxis type="number" hide domain={[0, 100]} />
                                                <YAxis dataKey="name" type="category" stroke={theme.textMuted} fontSize={10} width={100} />
                                                <Tooltip />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                    {getRiskFactorData(selectedAssessment).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={theme.primary + (80 - index * 15).toString(16)} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div>
                                        <h4 style={{ color: '#374151', marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Treatment Strategy</h4>
                                        <div style={{ background: '#F0FDF4', borderLeft: `4px solid #22c55e`, padding: 16, borderRadius: '4px 12px 12px 4px' }}>
                                            <p style={{ margin: 0, color: '#111827', lineHeight: 1.6, fontSize: 14 }}>{selectedAssessment.plan || "Monitoring patient's mental health progression. Schedule follow-up in 2 weeks."}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#374151', marginBottom: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Clinical Observations</h4>
                                        <p style={{ margin: 0, color: '#4B5563', fontSize: 14, lineHeight: 1.6 }}>{selectedAssessment.notes || "No significant life stressors reported this week. Continued stability in mood reported by nurse unit."}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #E5E7EB', paddingTop: 24 }}>
                                <button onClick={() => exportAssessmentToPDF(selectedAssessment)} style={{ padding: '12px 24px', borderRadius: 12, background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', fontWeight: 700, cursor: 'pointer' }}>Download PDF Report</button>
                                <button onClick={() => setShowModal(false)} style={{ padding: '12px 24px', borderRadius: 12, background: theme.primary, color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Close Review</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HistoryPage;
