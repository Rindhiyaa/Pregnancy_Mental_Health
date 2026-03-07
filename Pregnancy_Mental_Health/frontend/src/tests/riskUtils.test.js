/**
 * Test Suite: Risk Calculation Logic
 * Critical for IEEE paper - validates core scoring algorithm
 */

import { describe, it, expect } from 'vitest';
import { getRiskLevel, getEPDSScore, validateForm, REQUIRED_FIELDS } from '../utils/riskUtils';

describe('getRiskLevel - Risk Score Boundaries', () => {
  it('returns High Risk for score >= 66', () => {
    expect(getRiskLevel(66)).toBe("High Risk");
    expect(getRiskLevel(100)).toBe("High Risk");
    expect(getRiskLevel(75)).toBe("High Risk");
  });

  it('returns Moderate Risk for score 33-65', () => {
    expect(getRiskLevel(33)).toBe("Moderate Risk");
    expect(getRiskLevel(65)).toBe("Moderate Risk");
    expect(getRiskLevel(50)).toBe("Moderate Risk");
  });

  it('returns Low Risk for score below 33', () => {
    expect(getRiskLevel(0)).toBe("Low Risk");
    expect(getRiskLevel(32)).toBe("Low Risk");
    expect(getRiskLevel(15)).toBe("Low Risk");
  });

  it('handles boundary values correctly', () => {
    expect(getRiskLevel(32)).toBe("Low Risk");       // just below Moderate
    expect(getRiskLevel(33)).toBe("Moderate Risk");  // boundary
    expect(getRiskLevel(65)).toBe("Moderate Risk");  // just below High
    expect(getRiskLevel(66)).toBe("High Risk");      // boundary
  });

  it('handles edge cases', () => {
    expect(getRiskLevel(0)).toBe("Low Risk");        // minimum
    expect(getRiskLevel(100)).toBe("High Risk");     // maximum
    expect(getRiskLevel(32.9)).toBe("Low Risk");     // float below boundary
    expect(getRiskLevel(33.1)).toBe("Moderate Risk"); // float above boundary
  });
});

describe('getEPDSScore - EPDS Calculation', () => {
  it('sums all 10 EPDS responses correctly', () => {
    const answers = {
      epds_1: "3", epds_2: "3", epds_3: "3", epds_4: "3", epds_5: "3",
      epds_6: "3", epds_7: "3", epds_8: "3", epds_9: "3", epds_10: "3"
    };
    expect(getEPDSScore(answers)).toBe(30); // max EPDS score
  });

  it('returns 0 for all zero responses', () => {
    const answers = Object.fromEntries(
      Array.from({length: 10}, (_, i) => [`epds_${i+1}`, "0"])
    );
    expect(getEPDSScore(answers)).toBe(0);
  });

  it('calculates mixed responses correctly', () => {
    const answers = {
      epds_1: "1", epds_2: "2", epds_3: "0", epds_4: "3", epds_5: "1",
      epds_6: "2", epds_7: "0", epds_8: "1", epds_9: "3", epds_10: "2"
    };
    expect(getEPDSScore(answers)).toBe(15);
  });

  it('handles string numbers correctly', () => {
    const answers = {
      epds_1: "1", epds_2: "1", epds_3: "1", epds_4: "1", epds_5: "1",
      epds_6: "1", epds_7: "1", epds_8: "1", epds_9: "1", epds_10: "1"
    };
    expect(getEPDSScore(answers)).toBe(10);
  });
});

describe('validateForm - Form Validation', () => {
  it('fails when required fields are empty', () => {
    const emptyForm = Object.fromEntries(REQUIRED_FIELDS.map(f => [f, ""]));
    const result = validateForm(emptyForm, REQUIRED_FIELDS);
    expect(result.valid).toBe(false);
    expect(result.missing).toHaveLength(34);
  });

  it('passes when all required fields are filled', () => {
    const fullForm = Object.fromEntries(REQUIRED_FIELDS.map(f => [f, "yes"]));
    const result = validateForm(fullForm, REQUIRED_FIELDS);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('correctly identifies missing family_type (bug fix verification)', () => {
    const form = Object.fromEntries(REQUIRED_FIELDS.map(f => [f, "yes"]));
    form.family_type = "";
    const result = validateForm(form, REQUIRED_FIELDS);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("family_type");
  });

  it('validates exactly 34 required fields', () => {
    expect(REQUIRED_FIELDS).toHaveLength(34);
  });

  it('identifies multiple missing fields', () => {
    const form = Object.fromEntries(REQUIRED_FIELDS.map(f => [f, "yes"]));
    form.age = "";
    form.family_type = "";
    form.epds_1 = "";
    const result = validateForm(form, REQUIRED_FIELDS);
    expect(result.valid).toBe(false);
    expect(result.missing).toHaveLength(3);
    expect(result.missing).toContain("age");
    expect(result.missing).toContain("family_type");
    expect(result.missing).toContain("epds_1");
  });
});

describe('REQUIRED_FIELDS - Field Alignment', () => {
  it('includes all demographic fields', () => {
    const demographics = ["age", "residence", "education_level", "marital_status",
                         "partner_education", "partner_income", "household_members"];
    demographics.forEach(field => {
      expect(REQUIRED_FIELDS).toContain(field);
    });
  });

  it('includes all relationship fields', () => {
    const relationships = ["relationship_inlaws", "relationship_husband",
                          "support_during_pregnancy", "need_more_support",
                          "trust_share_feelings", "family_type"];
    relationships.forEach(field => {
      expect(REQUIRED_FIELDS).toContain(field);
    });
  });

  it('includes all EPDS fields', () => {
    for (let i = 1; i <= 10; i++) {
      expect(REQUIRED_FIELDS).toContain(`epds_${i}`);
    }
  });

  it('includes occupation_before_surgery', () => {
    expect(REQUIRED_FIELDS).toContain("occupation_before_surgery");
  });

  it('includes major_life_changes_pregnancy (not major_changes_losses)', () => {
    expect(REQUIRED_FIELDS).toContain("major_life_changes_pregnancy");
    expect(REQUIRED_FIELDS).not.toContain("major_changes_losses");
  });
});
