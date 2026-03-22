/**
 * Export utilities for PDF, Excel, and CSV generation
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


// PDF Export
export const exportToPDF = (data, title, columns, filename) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 22);

  // Generated date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

  // Prepare table data
  const tableData = data.map(item =>
    columns.map(col => {
      if (typeof col.accessor === 'function') return col.accessor(item);
      return item[col.accessor] != null ? String(item[col.accessor]) : '-';
    })
  );

  // ✅ FIXED: use autoTable(doc, {...})
  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [30, 58, 138], // blue
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    theme: 'grid',
  });

  // Save
  doc.save(`${filename || 'export'}.pdf`);
};

// Excel Export
export const exportToExcel = (data, title, filename) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
  XLSX.utils.sheet_add_aoa(ws, [[`Generated on: ${new Date().toLocaleString()}`]], { origin: 'A2' });
  const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));
  ws['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename || 'export'}.xlsx`);
};

// CSV Export
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] != null ? String(row[h]) : '';
        // Wrap in quotes if contains comma, newline or quote
        return /[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    )
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || 'export'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Patients ──
export const exportPatientsToPDF = (patients) => {
  exportToPDF(patients, 'Patients Directory', [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Age', accessor: 'age' },
    { header: 'Status', accessor: 'status' },
    { header: 'Created', accessor: (i) => new Date(i.created_at || i.member_since).toLocaleDateString() }
  ], 'patients-directory');
};

export const exportPatientsToExcel = (patients) => {
  exportToExcel(patients.map(p => ({
    Name: p.name, Email: p.email, Phone: p.phone, Age: p.age,
    'Blood Group': p.blood_group, Address: p.address, City: p.city,
    'Pregnancy Week': p.pregnancy_week,
    'Due Date': p.due_date ? new Date(p.due_date).toLocaleDateString() : '',
    Status: p.status,
    'Created Date': new Date(p.created_at || p.member_since).toLocaleDateString()
  })), 'Patients Directory', 'patients-directory');
};

export const exportPatientsToCSV = (patients) => {
  exportToCSV(patients.map(p => ({
    Name: p.name, Email: p.email, Phone: p.phone, Age: p.age,
    'Blood Group': p.blood_group, Status: p.status,
    'Created Date': new Date(p.created_at || p.member_since).toLocaleDateString()
  })), 'patients-directory');
};

// ── Assessments ──
export const exportAssessmentsToPDF = (assessments) => {
  exportToPDF(assessments, 'Assessments Report', [
    { header: 'Patient', accessor: 'patient_name' },
    { header: 'Risk Level', accessor: 'risk_level' },
    { header: 'Score', accessor: (i) => `${Math.round(i.risk_score || i.score || 0)}/30` },
    { header: 'Status', accessor: 'status' },
    { header: 'Date', accessor: (i) => new Date(i.created_at).toLocaleDateString() }
  ], 'assessments-report');
};

export const exportAssessmentsToExcel = (assessments) => {
  exportToExcel(assessments.map(a => ({
    'Patient Name': a.patient_name, 'Risk Level': a.risk_level,
    'Risk Score': Math.round(a.risk_score || a.score || 0),
    'EPDS Total': a.epds_total || 'N/A', Status: a.status,
    'Clinician Email': a.clinician_email,
    'Created Date': new Date(a.created_at).toLocaleDateString(),
    'Reviewed Date': a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString() : 'Not reviewed'
  })), 'Assessments Report', 'assessments-report');
};

export const exportAssessmentsToCSV = (assessments) => {
  exportToCSV(assessments.map(a => ({
    'Patient Name': a.patient_name, 'Risk Level': a.risk_level,
    'Risk Score': Math.round(a.risk_score || a.score || 0),
    'EPDS Total': a.epds_total || 'N/A', Status: a.status,
    'Created Date': new Date(a.created_at).toLocaleDateString()
  })), 'assessments-report');
};

// ── Doctors ──
export const exportDoctorsToPDF = (doctors) => {
  exportToPDF(doctors, 'Doctors Directory', [
    { header: 'Name', accessor: (i) => `Dr. ${i.name || i.fullName}` },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Specialization', accessor: (i) => i.specialization || 'General Medicine' },
    { header: 'Status', accessor: 'status' },
    { header: 'Joined', accessor: (i) => new Date(i.member_since).toLocaleDateString() }
  ], 'doctors-directory');
};

export const exportDoctorsToExcel = (doctors) => {
  exportToExcel(doctors.map(d => ({
    Name: `Dr. ${d.name || d.fullName}`, Email: d.email, Phone: d.phone,
    Specialization: d.specialization || 'General Medicine',
    Status: d.status, 'Join Date': new Date(d.member_since).toLocaleDateString()
  })), 'Doctors Directory', 'doctors-directory');
};

export const exportDoctorsToCSV = (doctors) => {
  exportToCSV(doctors.map(d => ({
    Name: `Dr. ${d.name || d.fullName}`, Email: d.email, Phone: d.phone,
    Specialization: d.specialization || 'General Medicine', Status: d.status
  })), 'doctors-directory');
};

// ── Nurses ──
export const exportNursesToPDF = (nurses) => {
  exportToPDF(nurses, 'Nurses Directory', [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Department', accessor: (i) => i.department || 'Maternity' },
    { header: 'Status', accessor: 'status' },
    { header: 'Joined', accessor: (i) => new Date(i.member_since).toLocaleDateString() }
  ], 'nurses-directory');
};

export const exportNursesToExcel = (nurses) => {
  exportToExcel(nurses.map(n => ({
    Name: n.name, Email: n.email, Phone: n.phone,
    Department: n.department || 'Maternity',
    Status: n.status, 'Join Date': new Date(n.member_since).toLocaleDateString()
  })), 'Nurses Directory', 'nurses-directory');
};

export const exportNursesToCSV = (nurses) => {
  exportToCSV(nurses.map(n => ({
    Name: n.name, Email: n.email, Phone: n.phone,
    Department: n.department || 'Maternity', Status: n.status
  })), 'nurses-directory');
};