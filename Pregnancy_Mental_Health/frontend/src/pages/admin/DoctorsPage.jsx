// src/pages/admin/DoctorsPage.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import AdminLayout from "../../components/AdminLayout";
import FilterToolbar from "../../components/FilterToolbar";
import { PageTitle, Divider, Card, Badge, Pagination } from "../../components/UI";
import { api, addAuditLog, getErrorMessage } from "../../utils/api";
import {
  Plus,
  Trash2,
  ShieldOff,
  KeyRound,
  CheckCircle,
  X,
  Stethoscope,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import {
  exportDoctorsToPDF,
  exportDoctorsToExcel,
  exportDoctorsToCSV,
} from "../../utils/exportUtils";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  role: "doctor",
  specialization: "",
  hospital_name: "",
  department: "",
  designation: "",
};

export default function DoctorsPage() {
  const { theme } = useTheme();
  const { isMobile, isTablet } = useBreakpoint();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter]);

  const validateDoctorForm = (values) => {
    const newErrors = {};

    const name = (values.name || "").trim();
    const email = (values.email || "").trim();
    const phone = (values.phone || "").trim();
    const hospital = (values.hospital_name || "").trim();
    const department = (values.department || "").trim();
    const designation = (values.designation || "").trim();
    const specialization = (values.specialization || "").trim();

    if (!name) {
      newErrors.name = "Full name is required";
    } else if (name.length < 3) {
      newErrors.name = "Full name must be at least 3 characters";
    } else if (!/^[A-Za-z.\s]+$/.test(name)) {
      newErrors.name = "Name should contain only letters, spaces, and periods";
    }

    if (!hospital) {
      newErrors.hospital_name = "Hospital name is required";
    } else if (hospital.length < 3) {
      newErrors.hospital_name = "Hospital name must be at least 3 characters";
    }

    if (!email) {
      newErrors.email = "Email address is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(phone)) {
      newErrors.phone = "Enter a valid phone number";
    }

    if (department && department.length < 2) {
      newErrors.department = "Department must be at least 2 characters";
    }

    if (designation && designation.length < 2) {
      newErrors.designation = "Designation must be at least 2 characters";
    }

    if (specialization && specialization.length < 2) {
      newErrors.specialization = "Specialization must be at least 2 characters";
    }

    return newErrors;
  };

  const handleFieldChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (touched[field]) {
      setErrors(validateDoctorForm(updated));
    }
  };

  const handleFieldBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateDoctorForm(formData));
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/clinicians");
      const clinicians = Array.isArray(data) ? data : [];

      const doctorsOnly = clinicians.filter((u) => u.role === "doctor");
      const mapped = doctorsOnly.map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name || ""}`.trim(),
        email: u.email,
        phone: u.phone_number,
        status: u.is_active ? "active" : "suspended",
        specialization: u.specialization || "",
        hospital_name: u.hospital_name || "",
        department: u.department || "",
        designation: u.designation || "",
        joinDate: u.member_since || u.created_at || null,
      }));

      setDoctors(mapped);
    } catch (err) {
      console.error("loadDoctors error:", err);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    if (activeFilter === "All") return matchesSearch;
    if (activeFilter === "Active") return matchesSearch && u.status === "active";
    if (activeFilter === "Suspended") return matchesSearch && u.status === "suspended";
    return matchesSearch;
  });

  const filterOptions = [
    { value: "All", label: "All Doctors", icon: Stethoscope },
    { value: "Active", label: "Active", icon: UserCheck },
    { value: "Suspended", label: "Suspended", icon: UserX },
  ];

  const handlePDFExport = () => {
    if (!filteredDoctors.length) {
      toast.error("No doctors to export");
      return;
    }
    exportDoctorsToPDF(filteredDoctors);
    toast.success("PDF exported!");
  };

  const handleExcelExport = () => {
    if (!filteredDoctors.length) {
      toast.error("No doctors to export");
      return;
    }
    exportDoctorsToExcel(filteredDoctors);
    toast.success("Excel exported!");
  };

  const handleCSVExport = () => {
    if (!filteredDoctors.length) {
      toast.error("No doctors to export");
      return;
    }
    exportDoctorsToCSV(filteredDoctors);
    toast.success("CSV exported!");
  };

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage) || 1;
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateDoctor = async (e) => {
    e.preventDefault();

    const validationErrors = validateDoctorForm(formData);
    setErrors(validationErrors);
    setTouched({
      name: true,
      hospital_name: true,
      department: true,
      designation: true,
      specialization: true,
      email: true,
      phone: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const rawName = (formData.name || "").trim();
      const [firstName, ...rest] = rawName.split(/\s+/);
      const lastName = rest.join(" ");

      const { data: created } = await api.post("/admin/users", {
        first_name: firstName,
        last_name: lastName,
        email: formData.email.trim(),
        phone_number: formData.phone.trim(),
        password: "TempPass123!",
        role: "doctor",
        specialization: formData.specialization.trim(),
        hospital_name: formData.hospital_name.trim(),
        department: formData.department.trim(),
        designation: formData.designation.trim(),
      });

      try {
        await addAuditLog(
          "User Created",
          `Created doctor ${created.first_name} ${created.last_name || ""} (ID ${created.id})`
        );
      } catch (logErr) {
        console.warn("Audit log failed", logErr);
      }

      setFormData(initialFormData);
      setErrors({});
      setTouched({});
      toast.success(`Doctor ${rawName} added successfully!`);
      setShowModal(false);
      loadDoctors();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to add doctor"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (id, currentStatus) => {
    const newIsActive = currentStatus !== "active";
    try {
      await api.patch(`/admin/users/${id}/status?is_active=${newIsActive}`);
      toast.success(`Account ${newIsActive ? "activated" : "suspended"}`);
      loadDoctors();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to update status"));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}?`)) return;

    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User record deleted");
      loadDoctors();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to delete user"));
    }
  };

  const handleResetPassword = async (doctor) => {
    if (!window.confirm(`Reset password for ${doctor.name}?`)) return;

    try {
      const { data } = await api.post(`/admin/users/${doctor.id}/reset-password`);
      console.log("Reset response:", data);

      try {
        await addAuditLog(
          "Password Reset",
          `Reset password for ${doctor.name} (ID ${doctor.id})`
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

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setErrors({});
    setTouched({});
  };

  return (
    <AdminLayout pageTitle="Doctors Directory">
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? 12 : 0,
          marginBottom: 24,
        }}
      >
        <PageTitle
          title="Doctors Directory"
          subtitle={
            isMobile
              ? "Manage medical specialists"
              : "Manage hospital medical specialists and credentials"
          }
        />
        <button
          onClick={() => setShowModal(true)}
          style={{
            ...primaryBtnStyle(theme),
            alignSelf: isMobile ? "flex-start" : "auto",
            fontSize: isMobile ? 13 : 14,
            padding: isMobile ? "8px 14px" : "10px 16px",
          }}
        >
          <Plus size={16} />
          {isMobile ? "Add" : "Add Doctor"}
        </button>
      </div>

      <Divider style={{ marginBottom: 24 }} />

      <Card style={{ padding: 0, overflow: "hidden" }}>
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

        {isMobile ? (
          <div style={{ padding: "8px 0" }}>
            {loading ? (
              <div style={loadingTdStyle(theme)}>Loading clinicians...</div>
            ) : filteredDoctors.length === 0 ? (
              <div style={loadingTdStyle(theme)}>No doctors found.</div>
            ) : (
              paginatedDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  style={{
                    padding: "14px 16px",
                    borderBottom: `1px solid ${theme.divider}`,
                    background:
                      doctor.status === "suspended"
                        ? theme.isDark
                          ? "#451a1a"
                          : "#fef2f2"
                        : theme.cardBg,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: theme.textPrimary,
                          fontSize: 14,
                        }}
                      >
                        Dr. {doctor.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: theme.textMuted,
                          marginTop: 2,
                        }}
                      >
                        ID: {doctor.id}
                      </div>
                    </div>
                    <StatusBadge status={doctor.status} theme={theme} />
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={mobileLabelStyle}>Spec.</span>
                    <Badge type="warning">
                      {doctor.specialization || "General Medicine"}
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{ ...mobileLabelStyle, paddingTop: 1 }}>Contact</span>
                    <div>
                      <div style={{ fontSize: 13, color: theme.textSecondary }}>
                        {doctor.email}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {doctor.phone}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                      paddingTop: 4,
                      borderTop: `1px solid ${theme.divider}`,
                    }}
                  >
                    <ActionButtons
                      onReset={() => handleResetPassword(doctor)}
                      onSuspend={() => handleSuspend(doctor.id, doctor.status)}
                      onDelete={() => handleDelete(doctor.id, doctor.name)}
                      status={doctor.status}
                      theme={theme}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: isTablet ? 600 : 750,
              }}
            >
              <thead>
                <tr style={tableHeaderRowStyle(theme)}>
                  <th style={thStyle(theme, isTablet)}>Doctor Details</th>
                  <th style={thStyle(theme, isTablet)}>Specialization</th>
                  {!isTablet && <th style={thStyle(theme, isTablet)}>Contact</th>}
                  <th style={thStyle(theme, isTablet)}>Status</th>
                  <th
                    style={{
                      ...thStyle(theme, isTablet),
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
                    <td colSpan={isTablet ? 4 : 5} style={loadingTdStyle(theme)}>
                      Loading clinicians...
                    </td>
                  </tr>
                ) : filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={isTablet ? 4 : 5} style={loadingTdStyle(theme)}>
                      No doctors found.
                    </td>
                  </tr>
                ) : (
                  paginatedDoctors.map((doctor) => (
                    <tr
                      key={doctor.id}
                      style={{
                        ...tableRowStyle(theme, doctor.status),
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.tableHover
                          ? theme.tableHover
                          : theme.isDark
                          ? "rgba(255,255,255,0.03)"
                          : "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          doctor.status === "suspended"
                            ? theme.isDark
                              ? "#451a1a"
                              : "#fef2f2"
                            : theme.cardBg;
                      }}
                    >
                      <td style={tdStyle(isTablet)}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: theme.textPrimary,
                            fontSize: isTablet ? 13 : 14,
                          }}
                        >
                          Dr. {doctor.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: theme.textMuted,
                            marginTop: 3,
                          }}
                        >
                          ID: {doctor.id}
                        </div>
                        {isTablet && (
                          <div
                            style={{
                              fontSize: 11,
                              color: theme.textSecondary,
                              marginTop: 3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 160,
                            }}
                          >
                            {doctor.email}
                          </div>
                        )}
                      </td>

                      <td style={tdStyle(isTablet)}>
                        <Badge type="warning">
                          {doctor.specialization || "General Medicine"}
                        </Badge>
                      </td>

                      {!isTablet && (
                        <td style={tdStyle(isTablet)}>
                          <div
                            style={{
                              fontSize: 13,
                              color: theme.textSecondary,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {doctor.email}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: theme.textMuted,
                              marginTop: 4,
                            }}
                          >
                            {doctor.phone}
                          </div>
                        </td>
                      )}

                      <td style={tdStyle(isTablet)}>
                        <StatusBadge status={doctor.status} theme={theme} />
                      </td>

                      <td
                        style={{
                          ...tdStyle(isTablet),
                          textAlign: "right",
                        }}
                      >
                        <ActionButtons
                          onReset={() => handleResetPassword(doctor)}
                          onSuspend={() => handleSuspend(doctor.id, doctor.status)}
                          onDelete={() => handleDelete(doctor.id, doctor.name)}
                          status={doctor.status}
                          theme={theme}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>

      {showModal && (
        <Modal
          onClose={closeModal}
          title="Add New Doctor"
          theme={theme}
          isMobile={isMobile}
        >
          <form onSubmit={handleCreateDoctor} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle(theme)}>Full Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                  style={inputStyle(theme, errors.name)}
                  placeholder="Jane Smith"
                />
                {touched.name && errors.name && (
                  <div style={errorTextStyle(theme)}>{errors.name}</div>
                )}
              </div>

              <div>
                <label style={labelStyle(theme)}>Hospital Name</label>
                <input
                  required
                  type="text"
                  value={formData.hospital_name}
                  onChange={(e) =>
                    handleFieldChange("hospital_name", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("hospital_name")}
                  style={inputStyle(theme, errors.hospital_name)}
                  placeholder="ABC Women & Child Hospital"
                />
                {touched.hospital_name && errors.hospital_name && (
                  <div style={errorTextStyle(theme)}>{errors.hospital_name}</div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label style={labelStyle(theme)}>Department / Unit</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleFieldChange("department", e.target.value)}
                    onBlur={() => handleFieldBlur("department")}
                    style={inputStyle(theme, errors.department)}
                    placeholder="OB-GYN"
                  />
                  {touched.department && errors.department && (
                    <div style={errorTextStyle(theme)}>{errors.department}</div>
                  )}
                </div>

                <div>
                  <label style={labelStyle(theme)}>Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => handleFieldChange("designation", e.target.value)}
                    onBlur={() => handleFieldBlur("designation")}
                    style={inputStyle(theme, errors.designation)}
                    placeholder="Consultant Psychiatrist"
                  />
                  {touched.designation && errors.designation && (
                    <div style={errorTextStyle(theme)}>{errors.designation}</div>
                  )}
                </div>
              </div>

              <div>
                <label style={labelStyle(theme)}>Specialization</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) =>
                    handleFieldChange("specialization", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("specialization")}
                  style={inputStyle(theme, errors.specialization)}
                  placeholder="e.g. Obstetrician"
                />
                {touched.specialization && errors.specialization && (
                  <div style={errorTextStyle(theme)}>{errors.specialization}</div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label style={labelStyle(theme)}>Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    style={inputStyle(theme, errors.email)}
                    placeholder="doctor.jane@ppdrisk.com"
                  />
                  {touched.email && errors.email && (
                    <div style={errorTextStyle(theme)}>{errors.email}</div>
                  )}
                </div>

                <div>
                  <label style={labelStyle(theme)}>Phone Number</label>
                  <input
                    required
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    onBlur={() => handleFieldBlur("phone")}
                    style={inputStyle(theme, errors.phone)}
                    placeholder="+91 98765 43210"
                  />
                  {touched.phone && errors.phone && (
                    <div style={errorTextStyle(theme)}>{errors.phone}</div>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 12,
                justifyContent: "flex-end",
                marginTop: 24,
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                style={{
                  ...secondaryBtnStyle(theme),
                  width: isMobile ? "100%" : "auto",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  ...primaryBtnStyle(theme),
                  width: isMobile ? "100%" : "auto",
                  justifyContent: "center",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Adding..." : "Add Doctor"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}

/* Sub-components */

const StatusBadge = ({ status, theme }) => {
  const isActive = status === "active";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 50,
          flexShrink: 0,
          background: isActive ? theme.successText : theme.dangerText,
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isActive ? theme.successText : theme.dangerText,
          whiteSpace: "nowrap",
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
};

const ActionButtons = ({ onReset, onSuspend, onDelete, status, theme }) => {
  const isActive = status === "active";
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
      <button onClick={onReset} title="Reset Password" style={actionBtnStyle(theme)}>
        <KeyRound size={15} />
      </button>

      <button
        onClick={onSuspend}
        title={isActive ? "Suspend" : "Activate"}
        style={actionBtnStyle(theme)}
      >
        {isActive ? (
          <ShieldOff size={15} color={theme.warningText} />
        ) : (
          <CheckCircle size={15} color={theme.successText} />
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
        <Trash2 size={15} />
      </button>
    </div>
  );
};

const Modal = ({ children, title, onClose, theme, isMobile }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: isMobile ? "16px" : 0,
    }}
  >
    <div
      style={{
        background: theme.cardBg,
        borderRadius: isMobile ? 12 : 16,
        width: "100%",
        maxWidth: 500,
        boxShadow: theme.shadowPremium,
        overflow: "hidden",
        border: `1px solid ${theme.border}`,
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: theme.innerBg,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: isMobile ? 16 : 18,
            color: theme.textPrimary,
            fontWeight: 700,
          }}
        >
          {title}
        </h2>

        <button
          type="button"
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

      <div style={{ padding: isMobile ? "16px 24px" : "20px 24px" }}>{children}</div>
    </div>
  </div>
);

/* Styles */

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
  whiteSpace: "nowrap",
});

const secondaryBtnStyle = (theme) => ({
  padding: "10px 16px",
  borderRadius: 8,
  border: `1px solid ${theme.border}`,
  background: theme.cardBg,
  color: theme.textPrimary,
  cursor: "pointer",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
});

const inputStyle = (theme, hasError) => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${hasError ? theme.dangerText : theme.border}`,
  fontSize: 16,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  background: theme.inputBg,
  color: theme.textPrimary,
});

const errorTextStyle = (theme) => ({
  marginTop: 6,
  fontSize: 12,
  color: theme.dangerText,
  fontWeight: 600,
});

const tableHeaderRowStyle = (theme) => ({
  background: theme.tableHeaderBg || (theme.isDark ? theme.innerBg : "#f8fafc"),
  borderBottom: `2px solid ${theme.border}`,
});

const thStyle = (theme, isTablet) => ({
  padding: isTablet ? "12px 12px" : "14px 16px",
  fontSize: 11,
  fontWeight: 800,
  color: theme.textSecondary,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  textAlign: "left",
  whiteSpace: "nowrap",
});

const tdStyle = (isTablet) => ({
  padding: isTablet ? "12px 12px" : "14px 16px",
  verticalAlign: "middle",
});

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
  minWidth: 30,
  minHeight: 30,
});

const labelStyle = (theme) => ({
  display: "block",
  fontSize: 12,
  fontWeight: 800,
  color: theme.textSecondary,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.02em",
});

const mobileLabelStyle = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#94A3B8",
  minWidth: 44,
  flexShrink: 0,
};