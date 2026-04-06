// src/pages/admin/RecoveryRequestsPage.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import AdminLayout from "../../components/AdminLayout";
import FilterToolbar from "../../components/FilterToolbar";
import { Divider, Card, Pagination } from "../../components/UI";
import { api, addAuditLog, getErrorMessage } from "../../utils/api";
import {
  Search,
  CheckCircle,
  X,
  Clock,
  KeyRound,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

export default function RecoveryRequestsPage() {
  const { theme } = useTheme();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadRequests();

    // Setup WebSocket for real-time updates
    const wsUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/^http/, "ws").replace(/\/$/, "") + "/ws"
      : `ws://${window.location.hostname}:8000/ws`;
      
    const socket = new WebSocket(wsUrl);
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_RECOVERY_REQUEST") {
          console.log("🔔 New recovery request received via WS:", data);
          loadRequests(); // Refresh the list
          toast.success(`New recovery request from ${data.email}`, {
            icon: '🔔',
            duration: 5000
          });
        } else if (data.type === "RECOVERY_COMPLETED") {
          console.log("✅ Recovery request completed via WS:", data);
          loadRequests(); // Refresh the list to update status
          toast.success(`User ${data.email} has successfully reset their password`, {
            icon: '✅',
            duration: 5000
          });
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // The backend route is GET /api/recovery/admin/pending
      const { data } = await api.get("/recovery/admin/pending");
      const requestsData = Array.isArray(data) ? data : [];
      
      const mapped = requestsData.map((r) => ({
        id: r.id,
        userEmail: r.user_email,
        userRole: r.user_role,
        status: r.status,
        createdAt: r.created_at,
        ip: r.requested_from_ip || "Unknown",
      }));
  
      setRequests(mapped);
    } catch (err) {
      console.error("loadRequests error", err);
      toast.error("Failed to load recovery requests");
      
      // Fallback empty if backend isn't returning correctly yet
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const email = r.userEmail || "";
    const q = search.toLowerCase();
  
    if (!email) return false;
  
    const matchesSearch = email.toLowerCase().includes(q);
  
    if (activeFilter === "All") return matchesSearch;
    if (activeFilter === "Pending") return matchesSearch && r.status === "pending";
    if (activeFilter === "Completed") return matchesSearch && r.status === "completed";
  
    return matchesSearch;
  });

  const filterOptions = [
    { value: "Pending", label: "Pending", icon: Clock },
    { value: "All", label: "All Requests", icon: AlertCircle },
  ];

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApprove = async (id, targetEmail) => {
    if (!window.confirm(`Are you sure you want to approve recovery for ${targetEmail}?`)) {
      return;
    }

    try {
      await api.post(`/recovery/admin/approve/${id}`);
      toast.success("Recovery approved and push code sent to user");
      loadRequests();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to approve request"));
    }
  };

  return (
    <AdminLayout pageTitle="Recovery Requests">
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: theme.textPrimary,
              margin: 0,
            }}
          >
            Password Recovery
          </h1>
          <p
            style={{
              fontSize: 14,
              color: theme.textMuted,
              margin: "4px 0 0",
            }}
          >
            Review and approve pending staff and patient password resets
          </p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.cardBg,
            color: theme.textPrimary,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.innerBg;
            e.currentTarget.style.borderColor = theme.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.cardBg;
            e.currentTarget.style.borderColor = theme.border;
          }}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <Divider style={{ marginBottom: 24 }} />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* Filter / Export toolbar */}
        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          filters={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          placeholder="Search by email..."
        />

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle(theme)}>
                <th style={thStyle(theme)}>Requester Details</th>
                <th style={thStyle(theme)}>Request Origins</th>
                <th style={thStyle(theme)}>Status</th>
                <th
                  style={{
                    ...thStyle(theme),
                    textAlign: "right",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={loadingTdStyle(theme)}>
                    Loading recovery request queue...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="4" style={loadingTdStyle(theme)}>
                    Great! No pending recovery requests.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req) => (
                  <tr
                    key={req.id}
                    style={{
                      ...tableRowStyle(theme, req.status),
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        theme.tableHover ||
                        (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.cardBg;
                    }}
                  >
                    <td style={tdStyle}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: theme.textPrimary,
                          fontSize: 14,
                        }}
                      >
                        {req.userEmail}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                          marginTop: 4,
                          textTransform: 'capitalize'
                        }}
                      >
                        Role: {req.userRole}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div
                        style={{
                          fontSize: 13,
                          color: theme.textSecondary,
                        }}
                      >
                        IP: {req.ip}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                          marginTop: 4,
                        }}
                      >
                        {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={req.status} theme={theme} />
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "right",
                      }}
                    >
                      {req.status === "pending" ? (
                        <ActionButtons
                          onApprove={() => handleApprove(req.id, req.userEmail)}
                          theme={theme}
                        />
                      ) : (
                        <span style={{ fontSize: 12, color: theme.textMuted }}>No actions required</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>
    </AdminLayout>
  );
}

/* Subcomponents matching portal themes */

const StatusBadge = ({ status, theme }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background:
          status === "pending" ? theme.warningText : 
          status === "completed" ? theme.successText : theme.textMuted,
      }}
    />
    <span
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: status === "pending"
          ? theme.warningText
          : status === "completed"
          ? theme.successText
          : theme.textMuted,
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  </div>
);

const ActionButtons = ({ onApprove, theme }) => (
  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
    <button
      onClick={onApprove}
      title="Approve Request"
      style={{
        ...actionBtnStyle(theme),
        color: theme.successText,
        borderColor: `${theme.successText}40`,
        background: theme.isDark ? "rgba(34, 197, 94, 0.1)" : "#dcfce7"
      }}
    >
      <CheckCircle size={16} /> 
      <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 700 }}>Approve</span>
    </button>
  </div>
);

const Modal = ({ children, title, onClose, theme }) => (
  <div style={modalOverlayStyle(theme)}>
    <div style={modalContentStyle(theme)}>
      <div style={modalHeaderStyle(theme)}>
        <h2 style={{ margin: 0, fontSize: 18, color: theme.textPrimary }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted }}
        >
          <X size={20} />
        </button>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  </div>
);

/* Theme-based styles reused from PatientsPage.jsx */

const primaryBtnStyle = (theme) => ({
  background: theme.primary,
  color: "white",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontWeight: 600,
  cursor: "pointer",
  width: "100%",
  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
});

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const tableHeaderRowStyle = (theme) => ({
  background: theme.tableHeaderBg || (theme.isDark ? theme.innerBg : "#f8fafc"),
  borderBottom: `2px solid ${theme.border}`,
});

const thStyle = (theme) => ({
  padding: "16px 24px",
  fontSize: 12,
  fontWeight: 800,
  color: theme.textSecondary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  textAlign: "left",
});

const tdStyle = {
  padding: "16px 24px",
  verticalAlign: "middle",
};

const tableRowStyle = (theme) => ({
  borderBottom: `1px solid ${theme.border}`,
  background: theme.cardBg,
});

const loadingTdStyle = (theme) => ({
  padding: 40,
  textAlign: "center",
  color: theme.textMuted,
});

const actionBtnStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.border}`,
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const modalOverlayStyle = (theme) => ({
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
});

const modalContentStyle = (theme) => ({
  background: theme.cardBg, borderRadius: 16, width: "100%", maxWidth: 450,
  boxShadow: theme.shadowPremium, overflow: "hidden",
});

const modalHeaderStyle = (theme) => ({
  padding: "20px 24px", borderBottom: `1px solid ${theme.border}`,
  display: "flex", justifyContent: "space-between", alignItems: "center",
  background: theme.innerBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
});

const modalFooterStyle = {
  marginTop: 32, display: "flex", gap: 12, justifyContent: "flex-end", width: "100%"
};
