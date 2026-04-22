import React, { useState, useEffect } from "react";
import { useTheme } from "../../ThemeContext";
import AdminLayout from "../../components/AdminLayout";
import FilterToolbar from "../../components/FilterToolbar";
import { PageTitle, Divider, Card, Badge, Pagination } from "../../components/UI";
import {
  exportNursesToPDF,
  exportNursesToExcel,
  exportNursesToCSV,
} from "../../utils/exportUtils";
import {
  Plus,
  Trash2,
  ShieldOff,
  CheckCircle,
  X,
  Edit,
  UserCheck,
  Heart,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { api, addAuditLog, getErrorMessage } from "../../utils/api";

const initialFormData = {
  id: null,
  name: "",
  email: "",
  phone: "",
  role: "nurse",
  ward: "",
  hospital_name: "",
  department: "",
  years_of_experience: "",
};

export default function NursesPage() {
  const { theme } = useTheme();
  const { isMobile, isTablet } = useBreakpoint();
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("All");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const itemsPerPage = 10;

  useEffect(() => {
    loadNurses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter]);

  const loadNurses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/clinicians");
      const clinicians = Array.isArray(data) ? data : [];
      const nursesOnly = clinicians.filter((u) => u.role === "nurse");

      const mapped = nursesOnly.map((u) => ({
        id: u.id,
        name: `${u.first_name} ${u.last_name || ""}`.trim(),
        email: u.email,
        phone: u.phone_number || "",
        status: u.is_active ? "active" : "suspended",
        ward: u.ward || "",
        hospital_name: u.hospital_name || "",
        department: u.department || "",
        years_of_experience: u.years_of_experience ?? "",
        joinDate: u.member_since || u.created_at || null,
        lastActive: u.last_active,
        isOnline: u.is_online,
      }));

      setNurses(mapped);
    } catch (err) {
      console.error("loadNurses error", err);
      toast.error("Failed to load nurses");
    } finally {
      setLoading(false);
    }
  };

  const filteredNurses = nurses.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    if (activeFilter === "All") return matchesSearch;
    if (activeFilter === "Active") return matchesSearch && u.status === "active";
    if (activeFilter === "Suspended") return matchesSearch && u.status === "suspended";
    return matchesSearch;
  });

  const filterOptions = [
    { value: "All", label: "All Nurses", icon: Heart },
    { value: "Active", label: "Active", icon: UserCheck },
    { value: "Suspended", label: "Suspended", icon: UserX },
  ];

  const handlePDFExport = () => {
    if (!filteredNurses.length) {
      toast.error("No nurses to export");
      return;
    }
    exportNursesToPDF(filteredNurses);
    toast.success("PDF exported!");
  };

  const handleExcelExport = () => {
    if (!filteredNurses.length) {
      toast.error("No nurses to export");
      return;
    }
    exportNursesToExcel(filteredNurses);
    toast.success("Excel exported!");
  };

  const handleCSVExport = () => {
    if (!filteredNurses.length) {
      toast.error("No nurses to export");
      return;
    }
    exportNursesToCSV(filteredNurses);
    toast.success("CSV exported!");
  };

  const totalPages = Math.ceil(filteredNurses.length / itemsPerPage) || 1;
  const paginatedNurses = filteredNurses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const validateNurseForm = (values) => {
    const errors = {};

    if (!values.name?.trim()) {
      errors.name = "Full name is required";
    } else if (values.name.trim().length < 2) {
      errors.name = "Full name must be at least 2 characters";
    } else if (!/^[A-Za-z.'\-\s]+$/.test(values.name.trim())) {
      errors.name = "Name can contain only letters, spaces, apostrophes, periods, and hyphens";
    }

    if (!values.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!values.phone?.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(values.phone.replace(/\D/g, ""))) {
      errors.phone = "Phone number must be 10 digits";
    }

    if (!values.hospital_name?.trim()) {
      errors.hospital_name = "Hospital name is required";
    }

    if (!values.department?.trim()) {
      errors.department = "Department is required";
    }

    if (
      values.years_of_experience === "" ||
      values.years_of_experience === null ||
      values.years_of_experience === undefined
    ) {
      errors.years_of_experience = "Years of experience is required";
    } else if (
      isNaN(values.years_of_experience) ||
      Number(values.years_of_experience) < 0 ||
      Number(values.years_of_experience) > 50
    ) {
      errors.years_of_experience = "Enter a value between 0 and 50";
    }

    return errors;
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateNurseForm(formData));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (touched[name]) {
      setErrors(validateNurseForm(updated));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialFormData);
    setErrors({});
    setTouched({});
  };

  const handleCreateNurse = async (e) => {
    e.preventDefault();

    const validationErrors = validateNurseForm(formData);
    setErrors(validationErrors);
    setTouched({ name: true, email: true, phone: true, hospital_name: true, department: true, ward: true, years_of_experience: true });

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const rawName = formData.name.trim();
      const [first_name, ...rest] = rawName.split(/\s+/);
      const last_name = rest.join(" ");
      const email = formData.email.trim().toLowerCase();

      if (formData.id) {
        // ── EDIT MODE ──
        await api.patch(`/admin/users/${formData.id}`, {
          first_name, last_name, email,
          phone_number: formData.phone.trim(),
          hospital_name: formData.hospital_name.trim(),
          department: formData.department.trim(),
          ward: formData.ward.trim(),
          years_of_experience: Number(formData.years_of_experience),
        });
        await addAuditLog("User Updated", `Updated nurse ${rawName} (ID ${formData.id})`).catch(() => {});
        toast.success(`Nurse ${rawName} updated successfully!`);
      } else {
        // ── CREATE MODE ──
        const { data: created } = await api.post("/admin/users", {
          first_name, last_name, email,
          phone_number: formData.phone.trim(),
          password: "TempPass123!",
          role: "nurse",
          hospital_name: formData.hospital_name.trim(),
          department: formData.department.trim(),
          ward: formData.ward.trim(),
          years_of_experience: Number(formData.years_of_experience),
        });
        await addAuditLog("User Created", `Created nurse ${created.first_name} ${created.last_name || ""} (ID ${created.id})`).catch(() => {});
        toast.success(`Nurse ${rawName} added successfully!`);
      }

      setFormData(initialFormData);
      setErrors({});
      setTouched({});
      setShowModal(false);
      loadNurses();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, formData.id ? "Failed to update nurse" : "Failed to add nurse"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNurse = (nurse) => {
    setFormData({
      id: nurse.id,
      name: nurse.name,
      email: nurse.email,
      phone: nurse.phone || "",
      role: "nurse",
      ward: nurse.ward || "",
      hospital_name: nurse.hospital_name || "",
      department: nurse.department || "",
      years_of_experience: nurse.years_of_experience ?? "",
    });
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  const handleSuspend = async (id, currentStatus) => {
    const newIsActive = currentStatus !== "active";
    const nurse = nurses.find(n => n.id === id);
    const nurseName = nurse?.name || `Nurse ID ${id}`;
    
    try {
      await api.patch(`/admin/users/${id}/status?is_active=${newIsActive}`);
      
      try {
        await addAuditLog(
          newIsActive ? "User Activated" : "User Suspended",
          `${newIsActive ? "Activated" : "Suspended"} nurse ${nurseName} (ID ${id})`
        );
      } catch (logErr) {
        console.warn("Audit log failed", logErr);
      }
      
      toast.success(`Account ${newIsActive ? "activated" : "suspended"}`);
      loadNurses();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to update status"));
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      
      try {
        await addAuditLog(
          "User Deleted",
          `Deleted nurse ${name} (ID ${id})`
        );
      } catch (logErr) {
        console.warn("Audit log failed", logErr);
      }
      
      toast.success("User record deleted");
      loadNurses();
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, "Failed to delete user"));
    }
  };

  return (
    <AdminLayout pageTitle="Nurses Directory">
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
          title="Nurses Directory"
          subtitle={
            isMobile
              ? "Manage nursing staff"
              : "Manage hospital nursing staff and ward assignments"
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
          {isMobile ? "Add" : "Add Nurse"}
        </button>
      </div>

      <Divider style={{ marginBottom: 16 }} />

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
              <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>
                Loading nursing staff...
              </div>
            ) : filteredNurses.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>
                No nurses found.
              </div>
            ) : (
              paginatedNurses.map((nurse) => (
                <div
                  key={nurse.id}
                  style={{
                    padding: "12px 14px",
                    borderBottom: `1px solid ${theme.divider}`,
                    background:
                      nurse.status === "suspended"
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
                        {nurse.name}
                      </div>
                      <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                        ID: {nurse.id}
                      </div>
                    </div>
                    <StatusBadge status={nurse.status} isOnline={nurse.isOnline} theme={theme} />
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={mobileLabelStyle}>Ward</span>
                    <Badge type="warning">{nurse.ward || "General Ward"}</Badge>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ ...mobileLabelStyle, paddingTop: 1 }}>Contact</span>
                    <div>
                      <div style={{ fontSize: 13, color: theme.textSecondary }}>
                        {nurse.email}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                        {nurse.phone}
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
                      onEdit={() => handleEditNurse(nurse)}
                      onSuspend={() => handleSuspend(nurse.id, nurse.status)}
                      onDelete={() => handleDelete(nurse.id, nurse.name)}
                      status={nurse.status}
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
              className="portal-table"
              style={{
                borderColor: theme.border,
                minWidth: isTablet ? 580 : 720,
              }}
            >
              <thead>
                <tr style={{ background: theme.tableHeaderBg || (theme.isDark ? theme.innerBg : "#f8fafc"), borderColor: theme.border }}>
                  <th style={{ color: theme.textSecondary }}>Nurse Details</th>
                  <th style={{ color: theme.textSecondary }}>Ward / Unit</th>
                  {!isTablet && <th style={{ color: theme.textSecondary }}>Contact</th>}
                  <th style={{ color: theme.textSecondary }}>Status</th>
                  <th style={{ color: theme.textSecondary, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isTablet ? 4 : 5} style={loadingTdStyle(theme)}>
                      Loading nursing staff...
                    </td>
                  </tr>
                ) : filteredNurses.length === 0 ? (
                  <tr>
                    <td colSpan={isTablet ? 4 : 5} style={loadingTdStyle(theme)}>
                      No nurses found.
                    </td>
                  </tr>
                ) : (
                  paginatedNurses.map((nurse) => (
                    <tr
                      key={nurse.id}
                      style={{
                        ...tableRowStyle(theme, nurse.status),
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          theme.tableHover ||
                          (theme.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc");
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          nurse.status === "suspended"
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
                          {nurse.name}
                        </div>
                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
                          ID: {nurse.id}
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
                            {nurse.email}
                          </div>
                        )}
                      </td>

                      <td style={tdStyle(isTablet)}>
                        <Badge type="warning">{nurse.ward || "General Ward"}</Badge>
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
                            {nurse.email}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: theme.textMuted,
                              marginTop: 4,
                            }}
                          >
                            {nurse.phone}
                          </div>
                        </td>
                      )}

                      <td style={tdStyle(isTablet)}>
                        <StatusBadge status={nurse.status} isOnline={nurse.isOnline} theme={theme} />
                      </td>

                      <td style={{ ...tdStyle(isTablet), textAlign: "right" }}>
                        <ActionButtons
                          onEdit={() => handleEditNurse(nurse)}
                          onSuspend={() => handleSuspend(nurse.id, nurse.status)}
                          onDelete={() => handleDelete(nurse.id, nurse.name)}
                          status={nurse.status}
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
          title={formData.id ? "Edit Nurse" : "Add New Nurse"}
          theme={theme}
          isMobile={isMobile}
        >
          <form onSubmit={handleCreateNurse} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle(theme)}>Full Name *</label>
                <input
                  name="name"
                  required
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  style={inputStyle(theme, errors.name)}
                  placeholder="Jane Doe"
                />
                {touched.name && errors.name && (
                  <div style={errorTextStyle(theme)}>{errors.name}</div>
                )}
              </div>

              <div>
                <label style={labelStyle(theme)}>Hospital Name *</label>
                <input
                  name="hospital_name"
                  required
                  type="text"
                  value={formData.hospital_name}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  style={inputStyle(theme, errors.hospital_name)}
                  placeholder="e.g. City General Hospital"
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
                  <label style={labelStyle(theme)}>Department *</label>
                  <input
                    name="department"
                    required
                    type="text"
                    value={formData.department}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    style={inputStyle(theme, errors.department)}
                    placeholder="e.g. Obstetrics"
                  />
                  {touched.department && errors.department && (
                    <div style={errorTextStyle(theme)}>{errors.department}</div>
                  )}
                </div>

                <div>
                  <label style={labelStyle(theme)}>Years of Experience *</label>
                  <input
                    name="years_of_experience"
                    required
                    type="number"
                    min="0"
                    value={formData.years_of_experience}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    style={inputStyle(theme, errors.years_of_experience)}
                    placeholder="e.g. 4"
                  />
                  {touched.years_of_experience && errors.years_of_experience && (
                    <div style={errorTextStyle(theme)}>
                      {errors.years_of_experience}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={labelStyle(theme)}>Ward / Unit</label>
                <input
                  name="ward"
                  type="text"
                  value={formData.ward}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  style={inputStyle(theme, errors.ward)}
                  placeholder="e.g. Maternity Ward B"
                />
                {touched.ward && errors.ward && (
                  <div style={errorTextStyle(theme)}>{errors.ward}</div>
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
                  <label style={labelStyle(theme)}>Email Address *</label>
                  <input
                    name="email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    style={inputStyle(theme, errors.email)}
                    placeholder="nurse.name@ppdrisk.com"
                  />
                  {touched.email && errors.email && (
                    <div style={errorTextStyle(theme)}>{errors.email}</div>
                  )}
                </div>

                <div>
                  <label style={labelStyle(theme)}>Phone Number *</label>
                  <input
                    name="phone"
                    required
                    type="text"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
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
                marginTop: 24,
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                flexDirection: isMobile ? "column-reverse" : "row",
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
                {submitting ? "Saving..." : formData.id ? "Save Changes" : "Add Nurse"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}

const StatusBadge = ({ status, isOnline, theme }) => {
  const isSuspended = status === "suspended";
  
  let label = "Offline";
  let color = theme.textMuted;
  let dotColor = "#94A3B8";

  if (isSuspended) {
    label = "Suspended";
    color = theme.dangerText;
    dotColor = theme.dangerText;
  } else if (isOnline) {
    label = "Active";
    color = "#10B981";
    dotColor = "#10B981";
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          background: dotColor,
          boxShadow: isOnline && !isSuspended ? "0 0 8px #10B981" : "none"
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: "nowrap",
          color: color,
        }}
      >
        {label}
      </span>
    </div>
  );
};

const ActionButtons = ({ onEdit, onSuspend, onDelete, status, theme }) => (
  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
    <button onClick={onEdit} title="Edit" style={actionBtnStyle(theme)}>
      <Edit size={15} />
    </button>
    <button onClick={onSuspend} title={status === "active" ? "Suspend" : "Activate"} style={actionBtnStyle(theme)}>
      {status === "active" ? <ShieldOff size={15} color={theme.warningText} /> : <CheckCircle size={15} color={theme.successText} />}
    </button>
    <button onClick={onDelete} title="Delete" style={{ ...actionBtnStyle(theme), color: theme.dangerText, borderColor: theme.dangerText + "40" }}>
      <Trash2 size={15} />
    </button>
  </div>
);

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
          background:
            theme.innerBg || (theme.isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"),
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
      <div style={{ padding: isMobile ? "16px" : "24px" }}>{children}</div>
    </div>
  </div>
);

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
  minWidth: 48,
  flexShrink: 0,
};