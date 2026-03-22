import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import { api } from "../../utils/api";
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
import { getAvatarColor } from "../../utils/dummyData";
import { exportPatientsToPDF, exportPatientsToExcel, exportPatientsToCSV } from "../../utils/exportUtils";
import { 
    Search, 
    Users, 
    AlertCircle, 
    TrendingUp, 
    ExternalLink, 
    ArrowUpRight, 
    ArrowDownRight,
    Filter,
    UserCheck,
    AlertTriangle,
    TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientsPage() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [stats, setStats] = useState({ total: 0, high: 0, increasing: 0 });
    const itemsPerPage = 8;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [pRes, aRes] = await Promise.all([
                api.get("/doctor/patients"),
                api.get("/doctor/assessments")
            ]);

            if (pRes.ok && aRes.ok) {
                const patientsList = await pRes.json();
                const assessments = await aRes.json();

                const processed = patientsList.map(p => {
                    const pAssessments = assessments.filter(a => a.patient_id === p.id || a.patient_name === p.name);
                    const latest = pAssessments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                    return {
                        ...p,
                        latest_score: latest?.epds_score || latest?.score || 0,
                        risk_level: latest?.risk_level || "Low Risk",
                        last_assessment: latest?.timestamp || p.created_at,
                        trend: pAssessments.length > 1 ? (pAssessments[0].score > pAssessments[1].score ? 'up' : 'down') : 'stable'
                    };
                });

                setPatients(processed);
                setStats({
                    total: processed.length,
                    high: processed.filter(p => p.risk_level.toLowerCase().includes('high')).length,
                    increasing: processed.filter(p => p.trend === 'up').length
                });
            }
        } catch (err) {
            console.error("Failed to fetch patients:", err);
            toast.error("Failed to load patient directory");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let filtered = patients;
        if (searchTerm) {
            filtered = filtered.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (activeFilter === "High Risk") {
            filtered = filtered.filter(p => p.risk_level.toLowerCase().includes('high'));
        } else if (activeFilter === "Moderate Risk") {
            filtered = filtered.filter(p => p.risk_level.toLowerCase().includes('moderate'));
        } else if (activeFilter === "Low Risk") {
            filtered = filtered.filter(p => p.risk_level.toLowerCase().includes('low'));
        } else if (activeFilter === "Increasing") {
            filtered = filtered.filter(p => p.trend === 'up');
        }
        setFilteredPatients(filtered);
        setCurrentPage(1);
    }, [searchTerm, activeFilter, patients]);

    const filterOptions = [
        { value: "All", label: "All Patients", icon: Users },
        { value: "High Risk", label: "High Risk", icon: AlertCircle },
        { value: "Moderate Risk", label: "Moderate Risk", icon: AlertTriangle },
        { value: "Low Risk", label: "Low Risk", icon: UserCheck },
        { value: "Increasing", label: "Increasing Risk", icon: TrendingUp }
    ];

    const handlePDFExport = () => {
        exportPatientsToPDF(filteredPatients);
        toast.success("PDF exported successfully!");
    };

    const handleExcelExport = () => {
        exportPatientsToExcel(filteredPatients);
        toast.success("Excel file exported successfully!");
    };

    const handleCSVExport = () => {
        exportPatientsToCSV(filteredPatients);
        toast.success("CSV exported successfully!");
    };

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
    const paginatedItems = filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: theme.pageBg }}>
            <Loader2 size={48} className="animate-spin" color={theme.primary} />
        </div>
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg }}>
            <DoctorSidebar />

            <main style={{ flex: 1, marginLeft: 260, padding: "40px", boxSizing: 'border-box' }}>
                <header style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <PageTitle
                        title="Patient Directory"
                        subtitle="Full history and clinical mapping for all registered patients."
                    />
                </header>

                {/* Stats Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "40px" }}>
                    <Card glass style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: theme.primary + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>
                            <Users size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase' }}>Total Registered</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: theme.textPrimary }}>{stats.total}</div>
                        </div>
                    </Card>
                    <Card glass style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: theme.dangerText + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.dangerText }}>
                            <AlertCircle size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase' }}>High Risk Patients</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: theme.dangerText }}>{stats.high}</div>
                        </div>
                    </Card>
                    <Card glass style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: theme.warningText + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.warningText }}>
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase' }}>Increasing EPDS</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: theme.warningText }}>{stats.increasing}</div>
                        </div>
                    </Card>
                </div>

                <Card glass noPadding>
                    <FilterToolbar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        filters={filterOptions}
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                        onPDFExport={handlePDFExport}
                        onExcelExport={handleExcelExport}
                        onCSVExport={handleCSVExport}
                        placeholder="Filter by name..."
                    />
                    <Table
                        headers={["Patient Identity", "Medical Risk", "Latest EPDS", "Historical Trend", "Last Assessment", "Clinical View"]}
                        loading={false}
                        emptyMessage="No clinical records found."
                    >
                        {paginatedItems.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: getAvatarColor(p.name) + '15', color: getAvatarColor(p.name), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                                            {p.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: theme.textPrimary }}>{p.name}</div>
                                            <div style={{ fontSize: "12px", color: theme.textMuted }}>ID: {p.id?.toString().slice(-6)}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={p.risk_level.toLowerCase().includes('high') ? 'danger' : (p.risk_level.toLowerCase().includes('mod') ? 'warning' : 'success')}>
                                        {p.risk_level}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span style={{ fontWeight: 800, fontSize: 15, color: p.latest_score >= 13 ? theme.dangerText : theme.textPrimary }}>
                                        {p.latest_score}/30
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {p.trend === 'up' ? <ArrowUpRight size={18} color={theme.dangerText} /> : <ArrowDownRight size={18} color={theme.successText} />}
                                        <span style={{ fontSize: "12px", fontWeight: 700, color: p.trend === 'up' ? theme.dangerText : theme.successText, textTransform: 'uppercase' }}>
                                            {p.trend === 'up' ? 'Worsening' : 'Improving'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span style={{ fontSize: "13px", color: theme.textSecondary, fontWeight: 600 }}>{new Date(p.last_assessment).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => navigate(`/doctor/patients/${p.id}`)}
                                        style={{ 
                                            padding: "8px 14px", borderRadius: "10px", border: `1px solid ${theme.glassBorder}`, 
                                            background: 'rgba(255,255,255,0.02)', color: theme.textPrimary, 
                                            fontWeight: 700, fontSize: "12px", cursor: "pointer", 
                                            display: "flex", alignItems: "center", gap: "6px",
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = theme.primary + '10'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    >
                                        View Clinical Record <ExternalLink size={14} />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </Table>
                </Card>

                <div style={{ marginTop: 24 }}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </main>
        </div>
    );
}
