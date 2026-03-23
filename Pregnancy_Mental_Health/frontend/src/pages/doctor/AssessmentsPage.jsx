import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../ThemeContext";
import { api } from "../../utils/api";
import DoctorSidebar from "../../components/DoctorSidebar";
import FilterToolbar from "../../components/FilterToolbar";
import { 
    Card, 
    Badge, 
    Table, 
    TableRow, 
    TableCell, 
    PageTitle, 
    Pagination,
    Loader2
} from "../../components/UI";
import { exportAssessmentsToPDF, exportAssessmentsToExcel, exportAssessmentsToCSV } from "../../utils/exportUtils";
import toast from 'react-hot-toast';
import { 
    Search, 
    Filter, 
    Clock, 
    User, 
    AlertTriangle, 
    ChevronRight,
    Zap,
    History as HistoryIcon,
    ClipboardList
} from 'lucide-react';
import { getAvatarColor } from "../../utils/dummyData";

const AssessmentsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme } = useTheme();

    const [assessments, setAssessments] = useState([]);
    const [filteredAssessments, setFilteredAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/doctor/assessments?status=submitted');
            if (res.ok) {
                const data = await res.json();
                const sortedData = data.sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));
                setAssessments(sortedData);
            }
        } catch (err) {
            console.error("Failed to fetch assessments queue:", err);
            toast.error("Failed to load assessments queue");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let filtered = assessments;

        if (activeFilter === "high") {
            filtered = filtered.filter(a => (a.risk_level || "").toLowerCase().includes("high"));
        } else if (activeFilter === "moderate") {
            filtered = filtered.filter(a => (a.risk_level || "").toLowerCase().includes("moderate"));
        } else if (activeFilter === "mine") {
            filtered = filtered.filter(a => a.doctor_id === user?.id);
        }

        if (searchTerm) {
            filtered = filtered.filter(a =>
                (a.patient_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.nurse_name || "").toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredAssessments(filtered);
        setCurrentPage(1);
    }, [searchTerm, activeFilter, assessments, user?.id]);

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return "N/A";
        const diff = new Date() - new Date(timestamp);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return "Just now";
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const filterOptions = [
        { value: "all", label: "All Pending", icon: HistoryIcon },
        { value: "high", label: "High Priority", icon: AlertTriangle },
        { value: "moderate", label: "Moderate Risk", icon: Zap },
        { value: "mine", label: "Assigned to Me", icon: User }
    ];

    const handlePDFExport = () => {
        exportAssessmentsToPDF(filteredAssessments);
        toast.success("PDF exported successfully!");
    };

    const handleExcelExport = () => {
        exportAssessmentsToExcel(filteredAssessments);
        toast.success("Excel file exported successfully!");
    };

    const handleCSVExport = () => {
        exportAssessmentsToCSV(filteredAssessments);
        toast.success("CSV exported successfully!");
    };

    const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
    const paginatedItems = filteredAssessments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: theme.pageBg }}>
            <Loader2 size={48} className="animate-spin" color={theme.primary} />
        </div>
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg }}>
            <DoctorSidebar />
            <main className="portal-main" style={{ background: theme.pageBg }}>
                <header className="page-header">
                    <PageTitle title="Clinical Review Queue" subtitle="Detailed screenings awaiting your professional assessment and approval." />
                </header>

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
                        placeholder="Search by patient ID..."
                    />
                    <Table
                        headers={["Patient Profile", "Lead Nurse", "Risk Indicator", "Submited On", "Clinician Action"]}
                        loading={false}
                        emptyMessage="No screenings found in this category."
                    >
                        {paginatedItems.map((a) => (
                            <TableRow key={a.id}>
                                <TableCell>
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <div style={{
                                            width: "40px", height: "40px", borderRadius: "12px",
                                            background: getAvatarColor(a.patient_name) + '15', color: getAvatarColor(a.patient_name), display: "flex", alignItems: "center",
                                            justifyContent: "center", fontWeight: 800, fontSize: "14px"
                                        }}>
                                            {a.patient_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: theme.textPrimary }}>{a.patient_name}</div>
                                            <div style={{ fontSize: "11px", color: theme.textMuted }}>Ref: {a.id?.slice(-8).toUpperCase()}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: theme.textSecondary, fontWeight: 600 }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.primary + '10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={14} color={theme.primary} />
                                        </div>
                                        <span style={{ fontSize: 13 }}>{a.nurse_name || "Primary Nurse"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        (a.risk_level || "").toLowerCase().includes("high") ? "danger" :
                                            (a.risk_level || "").toLowerCase().includes("moderate") ? "warning" : "success"
                                    }>
                                        {a.risk_level || "Normal"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: theme.textMuted, fontSize: "13px", fontWeight: 600 }}>
                                        <Clock size={16} />
                                        {getTimeAgo(a.timestamp || a.created_at)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => navigate(`/doctor/review/${a.id}`)}
                                        style={{ 
                                            background: theme.primary, 
                                            color: 'white', 
                                            border: 'none', 
                                            padding: '10px 18px', 
                                            borderRadius: '12px', 
                                            fontWeight: 700, 
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            boxShadow: `0 8px 16px ${theme.primary}30`
                                        }}
                                    >
                                        Initiate Review <ChevronRight size={16} />
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
};

export default AssessmentsPage;
