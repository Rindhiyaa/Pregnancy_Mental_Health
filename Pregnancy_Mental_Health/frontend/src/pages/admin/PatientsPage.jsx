// src/pages/admin/PatientsPage.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import AdminLayout from "../../components/AdminLayout";
import FilterToolbar from "../../components/FilterToolbar";
import { PageTitle, Divider, Card, Pagination } from "../../components/UI";
import {
  exportPatientsToPDF,
  exportPatientsToExcel,
  exportPatientsToCSV,
} from "../../utils/exportUtils";
import { api, addAuditLog, getErrorMessage } from "../../utils/api";
import {
  Search,
  Plus,
  ShieldOff,
  KeyRound,
  CheckCircle,
  Trash2,
  X,
  Users as UsersIcon,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";

export default function PatientsPage() {
  const { theme } = useTheme();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "patient",
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
  
      const patientsOnly = data.filter((u) => u.role === "patient");
  
      const mapped = patientsOnly.map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name || ""}`.trim().replace(/[{}]/g, ""),
        email: u.email,
        phone: u.phone_number || "",
        status: u.is_active ? "active" : "suspended",
        joinDate: u.member_since || u.created_at || null,
      }));
  
      setPatients(mapped);
    } catch (err) {
      console.error("loadPatients error", err);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((u) => {
    const name = u.name || "";
    const email = u.email || "";
    const q = search.toLowerCase();
  
    if (!(name || email)) return false;
  
    const matchesSearch =
      name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  
    if (activeFilter === "All") return matchesSearch;
    if (activeFilter === "Active")
      return matchesSearch && u.status === "active";
    if (activeFilter === "Suspended")
      return matchesSearch && u.status === "suspended";
  
    return matchesSearch;
  });

  const filterOptions = [
    { value: "All", label: "All Patients", icon: UsersIcon },
    { value: "Active", label: "Active", icon: UserCheck },
    { value: "Suspended", label: "Suspended", icon: UserX },
  ];

  const totalPages =
    Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // EXPORTS – uses filteredPatients, guards empty list
  const handlePDFExport = () => {
    if (!filteredPatients.length) {
      toast.error("No patients to export");
      return;
    }
    exportPatientsToPDF(filteredPatients);
    toast.success("PDF exported successfully!");
  };

  const handleExcelExport = () => {
    if (!filteredPatients.length) {
      toast.error("No patients to export");
      return;
    }
    exportPatientsToExcel(filteredPatients);
    toast.success("Excel file exported successfully!");
  };

  const handleCSVExport = () => {
    if (!filteredPatients.length) {
      toast.error("No patients to export");
      return;
    }
    exportPatientsToCSV(filteredPatients);
    toast.success("CSV exported successfully!");
  };

  // CREATE
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const rawName = (formData.name || "").trim();
  
      const { data: created } = await api.post("/admin/users", {
        first_name: rawName,
        last_name: "",
        email: formData.email,
        phone_number: formData.phone,
        password: "TempPass123!",
        role: "patient",
      });
  
      try {
        await addAuditLog(
          "User Created",
          `Created patient ${created.first_name} ${
            created.last_name || ""
          } (ID ${created.id})`
        );
      } catch (logErr) {
        console.warn("Audit log failed", logErr);
      }
  
      toast.success(`Patient ${rawName} added successfully!`);
      setFormData({ name: "", email: "", phone: "", role: "patient" });
      setShowModal(false);
      loadPatients();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to add patient"));
    } finally {
      setSubmitting(false);
    }
  };
  
  // SUSPEND / ACTIVATE
  const handleSuspend = async (id, currentStatus) => {
    const newIsActive = currentStatus !== "active";
    try {
      await api.patch(`/admin/users/${id}/status?is_active=${newIsActive}`);
      toast.success(`Account ${newIsActive ? "activated" : "suspended"}`);
      loadPatients();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to update status"));
    }
  };
  
  // DELETE
  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${name}?`
      )
    )
      return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User record deleted");
      loadPatients();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to delete user"));
    }
  };
  
  // RESET PASSWORD
  const handleResetPassword = async (patient) => {
    if (!window.confirm(`Reset password for ${patient.name}?`)) return;
  
    try {
      const { data } = await api.post(
        `/admin/users/${patient.id}/reset-password`
      );
      console.log("Reset response:", data);
  
      try {
        await addAuditLog(
          "Password Reset",
          `Reset password for ${patient.name} (ID ${patient.id})`
        );
      } catch (logErr) {
        console.warn("Audit log failed", logErr);
      }
  
      toast.success("Password reset successfully");
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to reset password"));
    }
  };

  return (
    <AdminLayout pageTitle="Patients">
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
            Patients
          </h1>
          <p
            style={{
              fontSize: 14,
              color: theme.textMuted,
              margin: "4px 0 0",
            }}
          >
            Manage registered patient accounts
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={primaryBtnStyle(theme)}
        >
          <Plus size={18} />
          New Patient
        </button>
      </div>

      <Divider style={{ marginBottom: 24 }} />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* Filter / Export toolbar (theme version) */}
        <FilterToolbar
          searchValue={search}
          onSearchChange={setSearch}
          filters={filterOptions}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onPDFExport={handlePDFExport}
          onExcelExport={handleExcelExport}
          onCSVExport={handleCSVExport}
          placeholder="Search by name or email..."
        />

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr style={tableHeaderRowStyle(theme)}>
                <th style={thStyle(theme)}>Patient Details</th>
                <th style={thStyle(theme)}>Contact</th>
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
                  <td
                    colSpan="4"
                    style={loadingTdStyle(theme)}
                  >
                    Loading patient database...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={loadingTdStyle(theme)}
                  >
                    No patients found.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    style={{
                      ...tableRowStyle(theme, patient.status),
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        theme.tableHover ||
                        (theme.isDark
                          ? "rgba(255,255,255,0.03)"
                          : "#f8fafc");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        patient.status === "suspended"
                          ? theme.isDark
                            ? "#451a1a"
                            : "#fef2f2"
                          : theme.cardBg;
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
                        {patient.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                          marginTop: 4,
                        }}
                      >
                        ID: {patient.id}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div
                        style={{
                          fontSize: 13,
                          color: theme.textSecondary,
                        }}
                      >
                        {patient.email}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                          marginTop: 4,
                        }}
                      >
                        {patient.phone}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={patient.status} theme={theme} />
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "right",
                      }}
                    >
                      <ActionButtons
                        onReset={() => handleResetPassword(patient)}
                        onSuspend={() =>
                          handleSuspend(patient.id, patient.status)
                        }
                        onDelete={() =>
                          handleDelete(patient.id, patient.name)
                        }
                        status={patient.status}
                        theme={theme}
                      />
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

      {/* Modal */}
      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          title="Register New Patient"
          theme={theme}
        >
          <form onSubmit={handleCreatePatient}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle(theme)}>Full Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  style={inputStyle(theme, false)}
                  placeholder="Jane Smith"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label style={labelStyle(theme)}>
                    Phone Number *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value,
                      })
                    }
                    style={inputStyle(theme, false)}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label style={labelStyle(theme)}>
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    style={inputStyle(theme, false)}
                    placeholder="jane@hospital.com"
                  />
                </div>
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={secondaryBtnStyle(theme)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={primaryBtnStyle(theme)}
              >
                {submitting ? "Registering..." : "Register Patient"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}

/* Subcomponents with updated theme */

const StatusBadge = ({ status, theme }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background:
          status === "active" ? theme.successText : theme.dangerText,
      }}
    />
    <span
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: status === "active"
          ? theme.successText
          : theme.dangerText,
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  </div>
);

const ActionButtons = ({ onReset, onSuspend, onDelete, status, theme }) => (
  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
    <button
      onClick={onReset}
      title="Reset Password"
      style={actionBtnStyle(theme)}
    >
      <KeyRound size={16} />
    </button>
    <button
      onClick={onSuspend}
      title={status === "active" ? "Suspend" : "Activate"}
      style={actionBtnStyle(theme)}
    >
      {status === "active" ? (
        <ShieldOff size={16} color={theme.warningText} />
      ) : (
        <CheckCircle size={16} color={theme.successText} />
      )}
    </button>
    <button
      onClick={onDelete}
      title="Delete"
      style={{
        ...actionBtnStyle(theme),
        color: theme.dangerText,
        borderColor: `${theme.dangerText}40`,
      }}
    >
      <Trash2 size={16} />
    </button>
  </div>
);

const Modal = ({ children, title, onClose, theme }) => (
  <div style={modalOverlayStyle(theme)}>
    <div style={modalContentStyle(theme)}>
      <div style={modalHeaderStyle(theme)}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            color: theme.textPrimary,
          }}
        >
          {title}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: theme.textMuted,
          }}
        >
          <X size={20} />
        </button>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  </div>
);

/* Theme-based styles (from your updated themed version) */

const primaryBtnStyle = (theme) => ({
  background: theme.primary,
  color: "white",
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
});

const secondaryBtnStyle = (theme) => ({
  padding: "10px 16px",
  borderRadius: 8,
  border: `1px solid ${theme.border}`,
  background: theme.cardBg,
  color: theme.textPrimary,
  cursor: "pointer",
  fontWeight: 600,
});

const toolbarStyle = (theme) => ({
  padding: "20px 24px",
  borderBottom: `1px solid ${theme.border}`,
  display: "flex",
  gap: 16,
  alignItems: "center",
  background:
    theme.innerBg ||
    (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
});

const searchIconStyle = (theme) => ({
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  color: theme.textMuted,
});

const inputStyle = (theme, isSearch) => ({
  width: "100%",
  padding: isSearch ? "10px 12px 10px 40px" : "10px 12px",
  borderRadius: 8,
  border: `1px solid ${theme.border}`,
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  background: theme.inputBg,
  color: theme.textPrimary,
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

const tableRowStyle = (theme, status) => ({
  borderBottom: `1px solid ${theme.border}`,
  background:
    status === "suspended"
      ? theme.isDark
        ? "#451a1a"
        : "#fef2f2"
      : theme.cardBg,
});

const loadingTdStyle = (theme) => ({
  padding: 40,
  textAlign: "center",
  color: theme.textMuted,
});

const actionBtnStyle = (theme) => ({
  background: theme.cardBg,
  border: `1px solid ${theme.border}`,
  padding: 6,
  borderRadius: 6,
  color: theme.textSecondary,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const labelStyle = (theme) => ({
  display: "block",
  fontSize: 13,
  fontWeight: 800,
  color: theme.textSecondary,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
});

const modalOverlayStyle = (theme) => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
});

const modalContentStyle = (theme) => ({
  background: theme.cardBg,
  borderRadius: 16,
  width: "100%",
  maxWidth: 500,
  boxShadow: theme.shadowPremium,
  overflow: "hidden",
});

const modalHeaderStyle = (theme) => ({
  padding: "20px 24px",
  borderBottom: `1px solid ${theme.border}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background:
    theme.innerBg ||
    (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
});

const modalFooterStyle = {
  marginTop: 32,
  display: "flex",
  gap: 12,
  justifyContent: "flex-end",
};