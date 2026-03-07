/**
 * Risk calculation utilities
 * Extracted from NewAssessment.jsx for testability
 */

/**
 * Calculate risk level based on final score
 * @param {number} score - Final risk score (0-100)
 * @returns {string} Risk level: "Low Risk", "Moderate Risk", or "High Risk"
 */
export const getRiskLevel = (score) => {
  if (score >= 66) return "High Risk";
  if (score >= 33) return "Moderate Risk";
  return "Low Risk";
};

/**
 * Calculate EPDS total score from individual responses
 * @param {Object} epdsAnswers - Object with epds_1 through epds_10 keys
 * @returns {number} Total EPDS score (0-30)
 */
export const getEPDSScore = (epdsAnswers) => {
  return Object.values(epdsAnswers).reduce((sum, v) => sum + Number(v), 0);
};

/**
 * Validate all required fields are filled
 * @param {Object} formData - Form data object
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} { valid: boolean, missing: Array<string> }
 */
export const validateForm = (formData, requiredFields) => {
  const missing = requiredFields.filter(f => !formData[f]);
  return { 
    valid: missing.length === 0, 
    missing 
  };
};

/**
 * Required fields for assessment (34 total)
 */
export const REQUIRED_FIELDS = [
  // Demographics (7 fields)
  "age", "residence", "education_level", "marital_status",
  "partner_education", "partner_income", "household_members",
  
  // Relationships & Support (6 fields)
  "relationship_inlaws", "relationship_husband", 
  "support_during_pregnancy", "need_more_support",
  "trust_share_feelings", "family_type",
  
  // Obstetric & Pregnancy (6 fields)
  "total_children_now", "pregnancy_number",
  "pregnancy_planned", "regular_checkups",
  "medical_conditions_pregnancy", "occupation_before_surgery",
  
  // Mental Health (5 fields)
  "depression_before_pregnancy", "depression_during_pregnancy",
  "fear_pregnancy_childbirth", "major_life_changes_pregnancy",
  "abuse_during_pregnancy",
  
  // EPDS Assessment (10 fields)
  "epds_1", "epds_2", "epds_3", "epds_4", "epds_5",
  "epds_6", "epds_7", "epds_8", "epds_9", "epds_10"
];
