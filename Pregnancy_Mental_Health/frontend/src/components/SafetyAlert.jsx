import { useState } from 'react';
import '../styles/SafetyAlert.css';

export default function SafetyAlert({ epdsData, patientName, onAcknowledge }) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Check for critical risk factors
  const selfHarmRisk = epdsData?.epds_10 > 0;
  const highEPDSTotal = calculateEPDSTotal(epdsData) >= 13;

  // If no critical risks, don't show alert
  if (!selfHarmRisk && !highEPDSTotal) {
    return null;
  }

  const handleAcknowledge = () => {
    setAcknowledged(true);
    if (onAcknowledge) {
      onAcknowledge();
    }
  };

  if (acknowledged) {
    return null; // Hide completely after acknowledgment
  }

  return (
    <div className="safety-alert-compact">
      <div className="alert-top">
        <div className="alert-title">
          <span className="alert-icon-small">⚠️</span>
          <h3>Critical Risk Alert</h3>
        </div>
        <button className="close-btn" onClick={handleAcknowledge}>×</button>
      </div>

      <div className="alert-content-compact">
        {selfHarmRisk && (
          <div className="alert-message critical">
            🚨 Self-harm risk detected - Immediate attention required
          </div>
        )}
        {highEPDSTotal && (
          <div className="alert-message high">
            ⚠️ EPDS Score: {calculateEPDSTotal(epdsData)}/30 - Above clinical threshold
          </div>
        )}

        <div className="crisis-compact">
          <strong>Crisis Support:</strong>
          <div className="crisis-numbers">
            <a href="tel:9820466726">AASRA: 9820466726</a>
            <a href="tel:18602662345">Vandrevala: 1860-2662-345</a>
            <a href="tel:112" className="emergency-link">Emergency: 112</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate EPDS total
function calculateEPDSTotal(epdsData) {
  if (!epdsData) return 0;
  
  let total = 0;
  for (let i = 1; i <= 10; i++) {
    total += parseInt(epdsData[`epds_${i}`]) || 0;
  }
  return total;
}
