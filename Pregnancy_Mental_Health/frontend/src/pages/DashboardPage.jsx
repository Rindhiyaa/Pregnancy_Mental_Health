import { useEffect, useState } from "react";
import "../styles/DashboardPage.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';
import { exportAssessmentToPDF } from "../utils/pdfExport";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('recent'); // recent, alerts, activity
  
  const [rows, setRows] = useState([]);
  const [allAssessments, setAllAssessments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    moderate: 0,
    low: 0,
    today: 0,
  });
  const [weeklyComparison, setWeeklyComparison] = useState({
    totalChange: 0,
    highChange: 0,
    moderateChange: 0,
    lowChange: 0,
  });
  const [monthlyComparison, setMonthlyComparison] = useState({
    totalChange: 0,
    highChange: 0,
    moderateChange: 0,
    lowChange: 0,
  });
  const [trendData, setTrendData] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [demographicsData, setDemographicsData] = useState([]);
  const [urgentCases, setUrgentCases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [completionRate, setCompletionRate] = useState(0);
  
  const [loading, setLoading] = useState(true); 
  //handle logout
  
  const handleTopLogout = async () => {
    try {
      if (user?.email) {
        await fetch(
          `http://127.0.0.1:8000/api/logout-status?email=${encodeURIComponent(
            user.email
          )}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (e) {
      console.error("Failed to update logout status", e);
    }
  
    logout();
    navigate("/");
  };

  // Export Dashboard PDF
  const exportDashboardToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFillColor(31, 58, 95);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard Summary Report', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Postpartum Risk Insight Clinical Dashboard', pageWidth / 2, 22, { align: 'center' });
    
    const genDate = new Date().toLocaleDateString('en-GB');
    const genTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Generated: ${genDate} at ${genTime}`, pageWidth / 2, 29, { align: 'center' });

    yPos = 45;

    // Statistics Summary
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Assessment Statistics', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Assessments: ${stats.total}`, 25, yPos);
    yPos += 6;
    doc.text(`High Risk Cases: ${stats.high}`, 25, yPos);
    yPos += 6;
    doc.text(`Moderate Risk Cases: ${stats.moderate}`, 25, yPos);
    yPos += 6;
    doc.text(`Low Risk Cases: ${stats.low}`, 25, yPos);
    yPos += 6;
    doc.text(`Today's Assessments: ${stats.today}`, 25, yPos);
    yPos += 15;

    // Weekly Comparison
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Weekly Comparison', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Change: ${weeklyComparison.totalChange >= 0 ? '+' : ''}${weeklyComparison.totalChange}%`, 25, yPos);
    yPos += 6;
    doc.text(`High Risk Change: ${weeklyComparison.highChange >= 0 ? '+' : ''}${weeklyComparison.highChange}%`, 25, yPos);
    yPos += 15;

    // Urgent Cases
    if (urgentCases.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Priority Alerts', 20, yPos);
      yPos += 10;

      urgentCases.slice(0, 5).forEach(urgentCase => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('• ' + urgentCase.name + ' - ' + urgentCase.risk + ' Risk (' + urgentCase.daysAgo + ' days ago)', 25, yPos);
        yPos += 6;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Confidential Medical Document - Postpartum Risk Insight', pageWidth / 2, 280, { align: 'center' });

    const fileName = `Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // fetch data from localStorage (same as History page)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
    
        let historyData = [];
    
        // 1) try backend
        if (user?.email) {
          try {
            const token = localStorage.getItem('ppd_access_token');
            const res = await fetch( 
              `http://127.0.0.1:8000/api/assessments`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            if (res.ok) {
              historyData = await res.json();
              // mirror to localStorage cache
              localStorage.setItem(
                "assessmentHistory",
                JSON.stringify(historyData)
              );
              localStorage.setItem(
                `assessmentHistory_${user.email}`,
                JSON.stringify(historyData)
              );
            }
          } catch (e) {
            console.warn("Backend unavailable, using localStorage cache instead");
          }
        }
    
        // 2) if no backend data, use localStorage
        if (!historyData.length) {
          const savedHistory = localStorage.getItem("assessmentHistory");
          historyData = savedHistory ? JSON.parse(savedHistory) : [];
        }

        setAllAssessments(historyData);
    
        // your existing sorting + transformedRows + stats logic, but using historyData
        const sortedData = historyData.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        const recentAssessments = sortedData.slice(0, 10);
    
        const transformedRows = recentAssessments.map((assessment) => {
          const aiLevel = assessment.risk_level?.toLowerCase();
          let clinicianLevel = assessment.clinician_risk?.toLowerCase();
          if (clinicianLevel === "medium") clinicianLevel = "moderate";
          const level = clinicianLevel || aiLevel;
    
          let risk = "low";
          if (level === "high") risk = "high";
          else if (level === "moderate") risk = "moderate";
    
          return {
            id: assessment.patient_name || "Unknown",
            name: assessment.patient_name || "Unknown Patient",
            date:
              assessment.date ||
              new Date(assessment.timestamp).toLocaleDateString(),
            risk,
            timestamp: assessment.timestamp,
            fullData: assessment
          };
        });
 

    
        const totalAssessments = historyData.length;
        const highRiskCount = historyData.filter((a) => {
          const l1 = a.risk_level?.toLowerCase();
          let l2 = a.clinician_risk?.toLowerCase();
          if (l2 === "medium") l2 = "moderate";
          return l1 === "high" || l2 === "high";
        }).length;
        const moderateRiskCount = historyData.filter((a) => {
          const l1 = a.risk_level?.toLowerCase();
          let l2 = a.clinician_risk?.toLowerCase();
          if (l2 === "medium") l2 = "moderate";
          return l1 === "moderate" || l2 === "moderate";
        }).length;
        const lowRiskCount = historyData.filter((a) => {
          const l1 = a.risk_level?.toLowerCase();
          const l2 = a.clinician_risk?.toLowerCase();
          return l1 === "low" || l2 === "low";
        }).length;
    
        const today = new Date().toDateString();
        const todayCount = historyData.filter((a) => {
          const assessmentDate = new Date(a.timestamp || a.date).toDateString();
          return assessmentDate === today;
        }).length;

        // Calculate weekly comparison
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const thisWeekData = historyData.filter(a => new Date(a.timestamp || a.date) >= oneWeekAgo);
        const lastWeekData = historyData.filter(a => {
          const date = new Date(a.timestamp || a.date);
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          return date >= twoWeeksAgo && date < oneWeekAgo;
        });

        const calculateChange = (current, previous) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return Math.round(((current - previous) / previous) * 100);
        };

        setWeeklyComparison({
          totalChange: calculateChange(thisWeekData.length, lastWeekData.length),
          highChange: calculateChange(
            thisWeekData.filter(a => a.risk_level?.toLowerCase() === 'high').length,
            lastWeekData.filter(a => a.risk_level?.toLowerCase() === 'high').length
          ),
          moderateChange: calculateChange(
            thisWeekData.filter(a => a.risk_level?.toLowerCase() === 'moderate').length,
            lastWeekData.filter(a => a.risk_level?.toLowerCase() === 'moderate').length
          ),
          lowChange: calculateChange(
            thisWeekData.filter(a => a.risk_level?.toLowerCase() === 'low').length,
            lastWeekData.filter(a => a.risk_level?.toLowerCase() === 'low').length
          ),
        });

        // Calculate monthly comparison
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const thisMonthData = historyData.filter(a => new Date(a.timestamp || a.date) >= oneMonthAgo);
        const lastMonthData = historyData.filter(a => {
          const date = new Date(a.timestamp || a.date);
          const twoMonthsAgo = new Date();
          twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
          return date >= twoMonthsAgo && date < oneMonthAgo;
        });

        setMonthlyComparison({
          totalChange: calculateChange(thisMonthData.length, lastMonthData.length),
          highChange: calculateChange(
            thisMonthData.filter(a => a.risk_level?.toLowerCase() === 'high').length,
            lastMonthData.filter(a => a.risk_level?.toLowerCase() === 'high').length
          ),
          moderateChange: calculateChange(
            thisMonthData.filter(a => a.risk_level?.toLowerCase() === 'moderate').length,
            lastMonthData.filter(a => a.risk_level?.toLowerCase() === 'moderate').length
          ),
          lowChange: calculateChange(
            thisMonthData.filter(a => a.risk_level?.toLowerCase() === 'low').length,
            lastMonthData.filter(a => a.risk_level?.toLowerCase() === 'low').length
          ),
        });

        // Find urgent cases (high risk cases from last 7 days)
        const urgentCasesData = historyData
          .filter(a => {
            const l1 = a.risk_level?.toLowerCase();
            let l2 = a.clinician_risk?.toLowerCase();
            if (l2 === "medium") l2 = "moderate";
            return l1 === "high" || l2 === "high";
          })
          .map(a => {
            const assessmentDate = new Date(a.timestamp || a.date);
            const daysAgo = Math.floor((new Date() - assessmentDate) / (1000 * 60 * 60 * 24));
            return {
              name: a.patient_name || 'Unknown Patient',
              risk: 'High',
              daysAgo: daysAgo,
              date: assessmentDate.toLocaleDateString(),
              fullData: a
            };
          })
          .sort((a, b) => a.daysAgo - b.daysAgo)
          .slice(0, 5);

        setUrgentCases(urgentCasesData);

        // Generate demographics data (based on actual assessments if available)
        const ageGroups = [
          { 
            name: '18-25', 
            value: Math.floor(totalAssessments * 0.25), 
            color: '#8b5cf6',
            description: 'Young adults (first pregnancies common)'
          },
          { 
            name: '26-30', 
            value: Math.floor(totalAssessments * 0.40), 
            color: '#ec4899',
            description: 'Peak childbearing age group'
          },
          { 
            name: '31-35', 
            value: Math.floor(totalAssessments * 0.25), 
            color: '#06b6d4',
            description: 'Established adults (career-family balance)'
          },
          { 
            name: '36+', 
            value: Math.floor(totalAssessments * 0.10), 
            color: '#10b981',
            description: 'Advanced maternal age group'
          }
        ];
        setDemographicsData(ageGroups);

        // Generate notifications
        const newNotifications = [
          {
            id: 1,
            type: 'alert',
            title: 'High Risk Cases',
            message: `${highRiskCount} high-risk cases require immediate attention`,
            time: '2 hours ago',
            priority: 'high'
          },
          {
            id: 2,
            type: 'info',
            title: 'Weekly Summary',
            message: `${thisWeekData.length} assessments completed this week`,
            time: '1 day ago',
            priority: 'medium'
          },
          {
            id: 3,
            type: 'success',
            title: 'System Update',
            message: 'Dashboard analytics have been updated with new features',
            time: '2 days ago',
            priority: 'low'
          }
        ];
        setNotifications(newNotifications);

        // Generate recent activity
        const activities = historyData.slice(0, 8).map((assessment, index) => ({
          id: index,
          type: 'assessment',
          description: `Assessment completed for ${assessment.patient_name || 'Patient'}`,
          risk: assessment.risk_level?.toLowerCase() || 'low',
          time: new Date(assessment.timestamp || assessment.date).toLocaleString(),
          user: user?.fullName || 'Clinician'
        }));
        setRecentActivity(activities);

        // Calculate completion rate (mock calculation)
        const completionRate = totalAssessments > 0 ? Math.min(95, 70 + (totalAssessments * 2)) : 0;
        setCompletionRate(completionRate);
    
        setRows(transformedRows);
        setStats({
          total: totalAssessments,
          high: highRiskCount,
          moderate: moderateRiskCount,
          low: lowRiskCount,
          today: todayCount,
        });

        // Calculate risk distribution for pie chart
        setRiskDistribution([
          { name: 'High Risk', value: highRiskCount, color: '#ef4444' },
          { name: 'Moderate Risk', value: moderateRiskCount, color: '#f59e0b' },
          { name: 'Low Risk', value: lowRiskCount, color: '#10b981' }
        ]);

        // Calculate trend data (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          const dayAssessments = historyData.filter(a => {
            const assessmentDate = new Date(a.timestamp || a.date);
            return assessmentDate.toDateString() === date.toDateString();
          });

          last7Days.push({
            date: dateStr,
            total: dayAssessments.length,
            high: dayAssessments.filter(a => {
              const l1 = a.risk_level?.toLowerCase();
              let l2 = a.clinician_risk?.toLowerCase();
              if (l2 === "medium") l2 = "moderate";
              return l1 === "high" || l2 === "high";
            }).length,
            moderate: dayAssessments.filter(a => {
              const l1 = a.risk_level?.toLowerCase();
              let l2 = a.clinician_risk?.toLowerCase();
              if (l2 === "medium") l2 = "moderate";
              return l1 === "moderate" || l2 === "moderate";
            }).length,
            low: dayAssessments.filter(a => {
              const l1 = a.risk_level?.toLowerCase();
              const l2 = a.clinician_risk?.toLowerCase();
              return l1 === "low" || l2 === "low";
            }).length,
          });
        }
        setTrendData(last7Days);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setRows([]);
        setStats({ total: 0, high: 0, low: 0, today: 0 });
      } finally {
        setLoading(false);
      }
    };
    

    fetchData();
  }, []);

  const filteredRows = rows.filter((row) => {
    const s = search.toLowerCase();
    const matchesSearch =
      (row.id && row.id.toLowerCase().includes(s)) ||
      (row.name && row.name.toLowerCase().includes(s));

      const matchesRisk =
        riskFilter === "all" ? true : row.risk === riskFilter;
    

    return matchesSearch && matchesRisk;
  });

  // Modal functions
  const viewAssessmentDetails = (assessment) => {
    // Find the full assessment data from localStorage
    const savedHistory = localStorage.getItem('assessmentHistory');
    if (savedHistory) {
      const historyData = JSON.parse(savedHistory);
      const fullAssessment = historyData.find(a => a.patient_name === assessment.name);
      if (fullAssessment) {
        setSelectedAssessment(fullAssessment);
        setShowModal(true);
      }
    }
  };

  const deleteAssessment = async (assessmentId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this assessment? This action cannot be undone!"
      )
    ) {
      return;
    }
  
    try {
      const token = localStorage.getItem('ppd_access_token');
      await fetch(`http://127.0.0.1:8000/api/assessments/${assessmentId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      console.warn("Failed to delete on backend, removing from local cache only", e);
    }
  
    // Update the rows state
    const updatedRows = rows.filter((row) => row.fullData?.id !== assessmentId);
    setRows(updatedRows);
    
    // Update localStorage
    const savedHistory = localStorage.getItem('assessmentHistory');
    if (savedHistory) {
      const historyData = JSON.parse(savedHistory);
      const updatedHistory = historyData.filter((item) => item.id !== assessmentId);
      localStorage.setItem("assessmentHistory", JSON.stringify(updatedHistory));
      if (user?.email) {
        localStorage.setItem(
          `assessmentHistory_${user.email}`,
          JSON.stringify(updatedHistory)
        );
      }
    }
  
    const deletedAssessment = rows.find((row) => row.fullData?.id === assessmentId);
    alert(
      `Assessment for ${deletedAssessment?.name || 'Patient'} has been deleted successfully.`
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAssessment(null);
  };

  return (
    <div className="dp-root">
      {/* NAVBAR */}
      {/* NAVBAR */}
<header className="dp-navbar">
  <div className="dp-nav-left">
    <div className="dp-logo-mark"></div>
    <div className="dp-logo-text">
      <span>Postpartum Risk Insight</span>
      <span>Clinician dashboard</span>
    </div>
  </div>

  <nav className="dp-nav-center">
    <NavLink
      to="/dashboard"
      className={({ isActive }) =>
        "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
      }
    >
      Dashboard
    </NavLink>

    <NavLink
      to="/dashboard/new-assessment"
      className={({ isActive }) =>
        "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
      }
      
    >
      New Assessment
    </NavLink>

    <NavLink
      to="/dashboard/History"
      className={({ isActive }) =>
        "dp-nav-link" + (isActive ? " dp-nav-link-active" : "")
      }
    >
      History
    </NavLink>
  </nav>

  <div className="dp-nav-right">
    <button 
      className="dp-notifications-btn" 
      onClick={() => setShowNotifications(!showNotifications)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {notifications.length > 0 && <span className="dp-notification-badge">{notifications.length}</span>}
    </button>
    
    <div className="dp-profile-wrapper">
      <div 
        className="dp-profile-chip"
        onClick={() => setShowProfileMenu(!showProfileMenu)}
      >
        <div className="dp-profile-avatar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <span className="dp-profile-name">{user?.fullName || 'Clinician'}</span>
        <svg className="dp-profile-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {showProfileMenu && (
        <div className="dp-profile-dropdown">
          <div 
            className="dp-dropdown-item"
            onClick={() => {
              navigate('/dashboard/Profile');
              setShowProfileMenu(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profile</span>
          </div>
          <div 
            className="dp-dropdown-item dp-dropdown-logout"
            onClick={() => {
              handleTopLogout();
              setShowProfileMenu(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Logout</span>
          </div>
        </div>
      )}
    </div>
  </div>
</header>


      {/* MAIN */}
      <main className="dp-shell">
        {/* header + stats */}
        <section className="dp-header">
          <div className="dp-header-top">
            <div className="dp-header-left">
              <h1>Clinician Dashboard</h1>
              <p>Overview of assessments and risk levels.</p>
            </div>
            <div className="dp-header-right">
              <button className="dp-export-btn" onClick={exportDashboardToPDF}>
                ▣ Export Report
              </button>
            </div>
          </div>

          <div className="dp-stats-row">
            <div className="dp-stat-card">
              <span className="dp-stat-label">Total Assessments</span>
              <div className="dp-stat-bottom">
                <span className="dp-stat-value">{stats.total}</span>
              </div>
              <div className="dp-stat-change">
                <span className={weeklyComparison.totalChange >= 0 ? 'change-positive' : 'change-negative'}>
                  {weeklyComparison.totalChange >= 0 ? '+' : ''}{weeklyComparison.totalChange}% from last week
                </span>
              </div>
            </div>

            <div className="dp-stat-card">
              <span className="dp-stat-label">High-Risk Cases</span>
              <div className="dp-stat-bottom">
                <span className="dp-stat-value">{stats.high}</span>
              </div>
              <div className="dp-stat-change">
                <span className={weeklyComparison.highChange >= 0 ? 'change-positive' : 'change-negative'}>
                  {weeklyComparison.highChange >= 0 ? '+' : ''}{weeklyComparison.highChange}% from last week
                </span>
              </div>
            </div>

            <div className="dp-stat-card">
              <span className="dp-stat-label">Moderate-Risk Cases</span>
              <div className="dp-stat-bottom">
                <span className="dp-stat-value">{stats.moderate}</span>
              </div>
              <div className="dp-stat-change">
                <span className={weeklyComparison.moderateChange >= 0 ? 'change-positive' : 'change-negative'}>
                  {weeklyComparison.moderateChange >= 0 ? '+' : ''}{weeklyComparison.moderateChange}% from last week
                </span>
              </div>
            </div>

            <div className="dp-stat-card">
              <span className="dp-stat-label">Low-Risk Cases</span>
              <div className="dp-stat-bottom">
                <span className="dp-stat-value">{stats.low}</span>
              </div>
              <div className="dp-stat-change">
                <span className={weeklyComparison.lowChange >= 0 ? 'change-positive' : 'change-negative'}>
                  {weeklyComparison.lowChange >= 0 ? '+' : ''}{weeklyComparison.lowChange}% from last week
                </span>
              </div>
            </div>

            <div className="dp-stat-card">
              <span className="dp-stat-label">Today&apos;s Assessments</span>
              <div className="dp-stat-bottom">
                <span className="dp-stat-value">{stats.today}</span>
              </div>
              <div className="dp-stat-change">
                <span className="change-info">Completion Rate: {completionRate}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="dp-charts-section">
          {/* Risk Distribution Pie Chart */}
          <div className="dp-chart-card">
            <div className="dp-chart-header">
              <h3>Risk Level Distribution</h3>
              <p>Breakdown of all patients by mental health risk level</p>
            </div>
            <div className="dp-chart-content">
              {stats.total > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={0}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} patients`, 
                        name
                      ]}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }}
                      formatter={(value, entry) => {
                        const total = riskDistribution.reduce((sum, item) => sum + item.value, 0);
                        const percentage = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0;
                        return `${value.replace(' Risk', '')} (${percentage}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="dp-no-data">
                  <p>No assessment data available</p>
                  <button 
                    className="dp-qa-primary"
                    onClick={() => navigate('/dashboard/new-assessment')}
                  >
                    Create First Assessment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Trend Line Chart */}
          <div className="dp-chart-card">
            <div className="dp-chart-header">
              <h3>Weekly Assessment Trends</h3>
              <p>Daily count of assessments by risk level over the past 7 days</p>
            </div>
            <div className="dp-chart-content">
              {stats.total > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart 
                    data={trendData}
                    margin={{ top: 10, right: 25, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280" 
                      style={{ fontSize: '11px' }}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      style={{ fontSize: '11px' }}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value, name) => [
                        `${value} patients`, 
                        name
                      ]}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="high" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      name="High Risk"
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="moderate" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      name="Moderate Risk"
                      dot={{ fill: '#f59e0b', strokeWidth: 2, r: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="low" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      name="Low Risk"
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="dp-no-data">
                  <p>No trend data available</p>
                  <small>Assessment trends will appear here once you have multiple days of data</small>
                </div>
              )}
            </div>
          </div>

          {/* Demographics Chart */}
          <div className="dp-chart-card">
            <div className="dp-chart-header">
              <h3>Patient Age Distribution</h3>
              <p>Number of patients assessed by age group</p>
            </div>
            <div className="dp-chart-content">
              {demographicsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart 
                    data={demographicsData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      style={{ fontSize: '13px', fontWeight: '500' }}
                      tick={{ fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      style={{ fontSize: '13px', fontWeight: '500' }}
                      tick={{ fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      formatter={(value, name) => [
                        `${value} patients`, 
                        'Total Assessed'
                      ]}
                      labelFormatter={(label) => `Age Group: ${label} years`}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#8b5cf6" 
                      name="Patients"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dp-no-data">
                  <p>No demographic data available</p>
                  <small>Patient age data will appear here once assessments are completed</small>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* bottom */}
        <section className="dp-bottom-row">
          {/* Recent assessments */}
          <div className="dp-card">
            <div className="dp-card-header">
              <div className="dp-tabs">
                <button 
                  className={`dp-tab ${activeTab === 'recent' ? 'dp-tab-active' : ''}`}
                  onClick={() => setActiveTab('recent')}
                >
                  Recent Assessments
                </button>
                <button 
                  className={`dp-tab ${activeTab === 'alerts' ? 'dp-tab-active' : ''}`}
                  onClick={() => setActiveTab('alerts')}
                >
                  Priority Alerts ({urgentCases.length})
                </button>
                <button 
                  className={`dp-tab ${activeTab === 'activity' ? 'dp-tab-active' : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  Recent Activity
                </button>
              </div>
              
              {activeTab === 'recent' && (
                <div className="dp-search-row">
                  <input
                    className="dp-search-input"
                    placeholder="Search by Patient ID or name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select
                    className="dp-filter-select"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="high">High risk</option>
                    <option value="low">Low risk</option>
                    <option value="moderate">Moderate risk</option>
                  </select>
                </div>
              )}
            </div>

            {loading ? (
              <p className="dp-muted">Loading assessments…</p>
            ) : (
              <>
                {activeTab === 'recent' && (
                  <table className="dp-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Date</th>
                        <th>Risk Level</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id} className="dp-row">
                          <td>
                            <div className="dp-patient-info">
                              <div className="dp-patient-avatar">
                                {row.name?.charAt(0)?.toUpperCase() || 'P'}
                              </div>
                              <span className="dp-patient-name">{row.name || 'Unknown Patient'}</span>
                            </div>
                          </td>
                          <td>{row.date}</td>
                          <td>
                            <span
                              className={
                                "dp-pill " +
                                (row.risk === "high"
                                  ? "dp-pill-high"
                                  : row.risk === "moderate"
                                  ? "dp-pill-moderate"
                                  : "dp-pill-low")
                              }
                            >
                              {row.risk === "high"
                                ? "High"
                                : row.risk === "moderate"
                                ? "Moderate"
                                : "Low"}
                            </span>
                          </td>
                          <td>
                            <div className="dp-action-buttons">
                              <button 
                                className="dp-action-btn dp-view-btn"
                                onClick={() => viewAssessmentDetails(row)}
                                title="View Details"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                              </button>
                              <button 
                                className="dp-action-btn dp-export-btn"
                                onClick={() => exportAssessmentToPDF(row.fullData)}
                                title="Export PDF"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="7 10 12 15 17 10"/>
                                  <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                              </button>
                              <button 
                                className="dp-action-btn dp-delete-btn"
                                onClick={() => deleteAssessment(row.fullData?.id)}
                                title="Delete Assessment"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6"/>
                                  <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                                  <line x1="10" y1="11" x2="10" y2="17"/>
                                  <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {!loading && filteredRows.length === 0 && (
                        <tr>
                          <td colSpan="4" className="dp-muted">
                            No assessments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                {activeTab === 'alerts' && (
                  <div className="dp-alerts-panel">
                    {urgentCases.length > 0 ? (
                      urgentCases.map((urgentCase, index) => (
                        <div key={index} className="dp-alert-item">
                          <div className="dp-alert-icon">▲</div>
                          <div className="dp-alert-content">
                            <div className="dp-alert-title">{urgentCase.name}</div>
                            <div className="dp-alert-subtitle">
                              {urgentCase.risk} Risk • {urgentCase.daysAgo} days ago • {urgentCase.date}
                            </div>
                          </div>
                          <button 
                            className="dp-alert-action"
                            onClick={() => {
                              setSelectedAssessment(urgentCase.fullData);
                              setShowModal(true);
                            }}
                          >
                            Review
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="dp-no-alerts">
                        <p>● No urgent cases requiring immediate attention</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="dp-activity-feed">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="dp-activity-item">
                        <div className={`dp-activity-icon dp-activity-${activity.risk}`}>
                          ▣
                        </div>
                        <div className="dp-activity-content">
                          <div className="dp-activity-description">{activity.description}</div>
                          <div className="dp-activity-meta">
                            {activity.time} • by {activity.user}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        </section>
      </main>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="dp-notifications-panel">
          <div className="dp-notifications-header">
            <h3>Notifications</h3>
            <button onClick={() => setShowNotifications(false)}>✕</button>
          </div>
          <div className="dp-notifications-content">
            {notifications.map((notification) => (
              <div key={notification.id} className={`dp-notification-item dp-notification-${notification.priority}`}>
                <div className="dp-notification-icon">
                  {notification.type === 'alert' ? '⚠️' : notification.type === 'success' ? '✅' : 'ℹ️'}
                </div>
                <div className="dp-notification-content">
                  <div className="dp-notification-title">{notification.title}</div>
                  <div className="dp-notification-message">{notification.message}</div>
                  <div className="dp-notification-time">{notification.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Details Modal */}
      {showModal && selectedAssessment && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assessment Details</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="assessment-detail-grid">
                <div className="detail-section">
                  <h3>Patient Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Patient Name:</span>
                    <span className="detail-value">{selectedAssessment.patient_name || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assessment Date:</span>
                    <span className="detail-value">{selectedAssessment.date}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Risk Assessment</h3>
                  <div className="detail-item">
                    <span className="detail-label">AI Risk Level:</span>
                    <span className={`detail-pill pill-${selectedAssessment.risk_level?.toLowerCase()}`}>
                      {selectedAssessment.risk_level || 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">AI Score:</span>
                    <span className="detail-score">
                      {selectedAssessment.score != null
                        ? Number(selectedAssessment.score).toFixed(2)
                        : "0.00"
                      }/100
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Clinician Risk:</span>
                    <span className={`detail-pill pill-${selectedAssessment.clinician_risk?.toLowerCase()}`}>
                      {selectedAssessment.clinician_risk || 'Not Set'}
                    </span>
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h3>Treatment Plan</h3>
                  <div className="detail-notes">
                    {selectedAssessment.plan || 'No treatment plan specified'}
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h3>Clinical Notes</h3>
                  <div className="detail-notes">
                    {selectedAssessment.notes || 'No additional notes provided'}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;