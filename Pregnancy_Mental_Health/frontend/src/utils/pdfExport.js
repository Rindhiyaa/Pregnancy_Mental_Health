import jsPDF from 'jspdf';

export const exportAssessmentToPDF = (assessment) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  // Professional color palette
  const colors = {
    headerBlue: [31, 58, 95],
    darkGrey: [51, 51, 51],
    mediumGrey: [85, 85, 85],
    lightGrey: [200, 200, 200],
    sectionBg: [248, 249, 250],
    highRisk: [220, 53, 69],
    moderateRisk: [255, 152, 0],
    lowRisk: [40, 167, 69],
  };

  // Helper: Add divider line
  const addDivider = (y, thickness = 0.3) => {
    doc.setDrawColor(...colors.lightGrey);
    doc.setLineWidth(thickness);
    doc.line(margin, y, pageWidth - margin, y);
    return y + 6;
  };

  // Helper: Add section header
  const addSectionHeader = (title, y) => {
    doc.setFillColor(...colors.sectionBg);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(...colors.darkGrey);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, y + 5.5);
    return y + 12;
  };

  // Helper: Add label-value pair
  const addLabelValue = (label, value, y) => {
    doc.setFontSize(10);
    doc.setTextColor(...colors.mediumGrey);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 3, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 55, y);
    return y + 6;
  };

  // Helper: Wrapped text
  const addWrappedText = (text, y, maxWidth) => {
    doc.setFontSize(10);
    doc.setTextColor(...colors.mediumGrey);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, margin + 3, y);
    return y + (lines.length * 5);
  };

  // ==================== HEADER ====================
  doc.setFillColor(...colors.headerBlue);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Postpartum Risk Insight', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Clinical Assessment Report', pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(8);
  const genDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const genTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Generated: ${genDate} at ${genTime}`, pageWidth / 2, 29, { align: 'center' });

  yPos = 45;

  // ==================== PATIENT INFORMATION ====================
  yPos = addSectionHeader('Patient Information', yPos);
  
  yPos = addLabelValue('Patient Name:', assessment.patient_name || 'Unknown', yPos);
  yPos = addLabelValue('Assessment Date:', assessment.date || new Date().toLocaleDateString(), yPos);
  yPos = addLabelValue('Clinician:', assessment.clinician_email || 'Not specified', yPos);
  
  yPos += 2;
  yPos = addDivider(yPos);

  // ==================== RISK ASSESSMENT ====================
  const riskLevel = assessment.risk_level || 'Unknown';
  let riskColor = colors.mediumGrey;
  let riskBgColor = [245, 245, 245];
  
  if (riskLevel.toLowerCase().includes('high')) {
    riskColor = colors.highRisk;
    riskBgColor = [255, 243, 245];
  } else if (riskLevel.toLowerCase().includes('moderate') || riskLevel.toLowerCase().includes('medium')) {
    riskColor = colors.moderateRisk;
    riskBgColor = [255, 248, 235];
  } else if (riskLevel.toLowerCase().includes('low')) {
    riskColor = colors.lowRisk;
    riskBgColor = [240, 253, 244];
  }

  yPos = addSectionHeader('Risk Assessment', yPos);
  
  // Risk box
  doc.setFillColor(...riskBgColor);
  doc.setDrawColor(...riskColor);
  doc.setLineWidth(1);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 28, 'FD');
  
  yPos += 7;
  
  // AI Risk Level
  doc.setFontSize(10);
  doc.setTextColor(...colors.mediumGrey);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Risk Level:', margin + 3, yPos);
  
  // Risk badge
  doc.setFillColor(...riskColor);
  const badgeText = riskLevel.toUpperCase();
  const badgeWidth = doc.getTextWidth(badgeText) + 8;
  doc.rect(margin + 55, yPos - 4, badgeWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(badgeText, margin + 59, yPos);
  
  yPos += 8;
  
  // AI Score
  const score = assessment.score != null ? Number(assessment.score).toFixed(1) : '0.0';
  doc.setTextColor(...colors.mediumGrey);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Risk Score:', margin + 3, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${score} / 100`, margin + 55, yPos);
  
  yPos += 8;
  
  // Clinician Assessment
  doc.setFont('helvetica', 'bold');
  doc.text('Clinician Assessment:', margin + 3, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(assessment.clinician_risk || 'Not Set', margin + 55, yPos);
  
  yPos += 8;
  yPos = addDivider(yPos);

  // ==================== HIGH RISK ALERT ====================
  if (riskLevel.toLowerCase().includes('high')) {
    doc.setFillColor(220, 53, 69);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('IMMEDIATE ACTION REQUIRED - High Risk Assessment', pageWidth / 2, yPos + 6.5, { align: 'center' });
    yPos += 14;
  }

  // ==================== EPDS SUMMARY ====================
  if (assessment.raw_data) {
    yPos = addSectionHeader('EPDS Assessment Summary', yPos);
    
    // Calculate EPDS total
    let epdsTotal = 0;
    for (let i = 1; i <= 10; i++) {
      const value = parseInt(assessment.raw_data[`epds_${i}`]) || 0;
      epdsTotal += value;
    }

    // EPDS Score
    doc.setFontSize(11);
    doc.setTextColor(...colors.darkGrey);
    doc.setFont('helvetica', 'bold');
    doc.text(`EPDS Total Score: ${epdsTotal} / 30`, margin + 3, yPos);
    
    yPos += 7;
    
    // Interpretation
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    let interpretation = '';
    let interpretColor = colors.mediumGrey;
    
    if (epdsTotal >= 13) {
      interpretation = 'Clinical Interpretation: Indicates elevated risk - Further evaluation recommended';
      interpretColor = colors.highRisk;
    } else if (epdsTotal >= 10) {
      interpretation = 'Clinical Interpretation: Monitoring advised - Clinical follow-up recommended';
      interpretColor = colors.moderateRisk;
    } else {
      interpretation = 'Clinical Interpretation: Score within normal range';
      interpretColor = colors.lowRisk;
    }
    
    doc.setTextColor(...interpretColor);
    const interpLines = doc.splitTextToSize(interpretation, pageWidth - 2 * margin - 6);
    doc.text(interpLines, margin + 3, yPos);
    yPos += interpLines.length * 5;

    // Self-harm risk alert
    const selfHarmScore = parseInt(assessment.raw_data.epds_10) || 0;
    if (selfHarmScore > 0) {
      yPos += 4;
      doc.setFillColor(255, 243, 245);
      doc.setDrawColor(220, 53, 69);
      doc.setLineWidth(1);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 14, 'FD');
      
      yPos += 5;
      doc.setTextColor(220, 53, 69);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Self-harm thoughts indicated (EPDS Q10 > 0)', margin + 3, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.text('Immediate clinical evaluation and safety assessment required', margin + 3, yPos);
      yPos += 6;
    }
    
    yPos += 2;
    yPos = addDivider(yPos);
  }

  // Check if new page needed
  if (yPos > pageHeight - 70) {
    doc.addPage();
    yPos = 20;
  }

  // ==================== TREATMENT PLAN ====================
  yPos = addSectionHeader('Treatment Plan', yPos);
  
  const plan = assessment.plan || 'No treatment plan specified';
  yPos = addWrappedText(plan, yPos, pageWidth - 2 * margin - 6);
  
  yPos += 4;
  yPos = addDivider(yPos);

  // Check if new page needed
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 20;
  }

  // ==================== CLINICAL NOTES ====================
  yPos = addSectionHeader('Clinical Notes', yPos);
  
  const notes = assessment.notes || 'No additional notes provided';
  yPos = addWrappedText(notes, yPos, pageWidth - 2 * margin - 6);

  // ==================== EMERGENCY CONTACTS (High Risk) ====================
  if (riskLevel.toLowerCase().includes('high')) {
    yPos += 8;
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(40, 167, 69);
    doc.setLineWidth(1);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 20, 'FD');
    
    yPos += 6;
    doc.setTextColor(40, 167, 69);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Emergency Crisis Support (India)', margin + 3, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('AASRA: 9820466726  |  Vandrevala: 1860-2662-345  |  Emergency: 112', margin + 3, yPos);
    yPos += 5;
    doc.setFontSize(8);
    doc.text('Available 24/7 - Free & Confidential', margin + 3, yPos);
  }

  // ==================== FOOTER ====================
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...colors.lightGrey);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('Confidential Medical Document', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Postpartum Risk Insight', pageWidth - margin, pageHeight - 10, { align: 'right' });
    
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text('Handle according to data protection regulations', pageWidth / 2, pageHeight - 6, { align: 'center' });
  }

  // Save the PDF
  const fileName = `PPD_Assessment_${assessment.patient_name?.replace(/\s+/g, '_') || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
