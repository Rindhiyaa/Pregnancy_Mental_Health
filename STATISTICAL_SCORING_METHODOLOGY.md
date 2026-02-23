# Statistical Scoring Methodology
## For Statistics/Mathematics Teacher Review

---

## Executive Summary

This document explains the mathematical and statistical methodology used in the Postpartum Depression Risk Assessment System for academic review and validation.

---

## 1. DATA COLLECTION

### 1.1 Raw Input Variables
The system collects **26 raw variables** from clinical assessment:

| # | Variable Name | Type | Possible Values |
|---|---------------|------|-----------------|
| 1 | Age | Numerical | 18-50 |
| 2 | Residence | Categorical | City, Village |
| 3 | Education Level | Categorical | University, College, High School, Primary School |
| 4 | Marital Status | Categorical | Married, Divorced |
| 5 | Occupation | Categorical | Housewife, Business, Doctor, Teacher, Service, Student, Other |
| 6 | Partner Education | Categorical | University, College, High School, Primary School |
| 7 | Partner Income | Categorical | <5000, 5000-10000, 10000-20000, 20000-30000, >30000 |
| 8 | Total Children | Categorical | One, Two, More than two |
| 9 | Family Type | Categorical | Nuclear, Joint |
| 10 | Household Members | Categorical | 2-5, 6-8, 9 or more |
| 11 | Relationship with In-laws | Categorical | Good, Friendly, Neutral, Bad, Poor |
| 12 | Relationship with Husband | Categorical | Good, Friendly, Neutral, Bad, Poor |
| 13 | Support Received | Categorical | High, Medium, Low |
| 14 | Need for Support | Categorical | High, Medium, Low |
| 15 | Major Changes/Losses | Binary | Yes, No |
| 16 | Abuse | Binary | Yes, No |
| 17 | Trust & Share Feelings | Binary | Yes, No |
| 18 | Pregnancy Number | Numerical | 1, 2, 3, 4+ |
| 19 | Pregnancy Length | Categorical | <5m, 6m, 7m, 8m, 9m, 10m |
| 20 | Pregnancy Planned | Binary | Yes, No |
| 21 | Regular Checkups | Binary | Yes, No |
| 22 | Fear of Pregnancy | Binary | Yes, No |
| 23 | Medical Conditions | Categorical | None, Non-Chronic, Chronic |
| 24 | Depression Before Pregnancy | Binary | Positive, Negative |
| 25 | Depression During Pregnancy | Binary | Positive, Negative |
| 26 | Patient Name | Text | (Not used in model) |

**Total Raw Variables: 26** (25 used in model + 1 for identification)

---

## 2. FEATURE ENGINEERING

### 2.1 Why 69 Features from 26 Variables?

**Answer:** One-Hot Encoding transformation

When categorical variables are converted for machine learning, each category becomes a separate binary feature.

#### Example:
**Raw Variable:** Education Level (1 variable)  
**Possible Values:** University, College, High School, Primary School (4 categories)  
**After One-Hot Encoding:** 4 binary features
- Education Level_University: 0 or 1
- Education Level_College: 0 or 1
- Education Level_High School: 0 or 1
- Education Level_Primary School: 0 or 1

### 2.2 Complete Feature Expansion

| Raw Variable | Categories | Features Created |
|--------------|------------|------------------|
| Age | Numerical | 1 (unchanged) |
| Residence | 2 | 2 |
| Education Level | 4 | 4 |
| Marital Status | 2 | 2 |
| Occupation | 7 | 7 |
| Partner Education | 4 | 4 |
| Partner Income | 5 | 5 |
| Total Children | 3 | 3 |
| Family Type | 2 | 2 |
| Household Members | 3 | 3 |
| Relationship In-laws | 5 | 5 |
| Relationship Husband | 5 | 5 |
| Support Received | 3 | 3 |
| Need for Support | 3 | 3 |
| Major Changes | 2 | 2 |
| Abuse | 2 | 2 |
| Trust & Share | 2 | 2 |
| Pregnancy Number | Numerical | 1 (unchanged) |
| Pregnancy Length | 6 → Encoded | 1 (mapped to 1-6) |
| Pregnancy Planned | 2 | 2 |
| Regular Checkups | 2 | 2 |
| Fear of Pregnancy | 2 | 2 |
| Medical Conditions | 2 | 2 |
| Depression Before | 2 | 2 |
| Depression During | 2 | 2 |
| **TOTAL** | **26 variables** | **69 features** |

---

## 3. MACHINE LEARNING MODEL

### 3.1 Algorithm: CatBoost Classifier

**Type:** Gradient Boosting Decision Tree  
**Purpose:** Multi-class classification  
**Classes:** 3 (Low, Medium, High)

### 3.2 Model Training (Historical)

The model was trained on a dataset where:
- **Input (X):** 69 features (demographic + psychosocial factors)
- **Output (y):** EPDS Result classification (Low/Medium/High)
- **Training Method:** Supervised learning with labeled data

### 3.3 Model Output

For each assessment, the model produces:

```
Output = {
    predicted_class: "Medium",
    probabilities: [P(High), P(Low), P(Medium)]
}
```

Where:
- P(High) + P(Low) + P(Medium) = 1.0
- Each probability ∈ [0, 1]

**Example:**
```
predicted_class = "Medium"
P(High) = 0.15
P(Low) = 0.25
P(Medium) = 0.60
Sum = 1.00 ✓
```

---

## 4. SCORING METHODOLOGY

### 4.1 Mathematical Formula

The risk score (0-100) is calculated using a piecewise linear function based on the predicted class and its probability:

```
Let:
  P_H = Probability of High Risk
  P_M = Probability of Medium Risk
  P_L = Probability of Low Risk

Risk Score = 
  ⎧ 70 + (P_H × 30)      if P_H ≥ P_M and P_H ≥ P_L
  ⎨ 40 + (P_M × 30)      if P_M > P_H and P_M ≥ P_L
  ⎩ P_L × 40             if P_L > P_H and P_L > P_M
```

### 4.2 Score Ranges

| Risk Level | Score Range | Formula | Min Score | Max Score |
|------------|-------------|---------|-----------|-----------|
| Low Risk | [0, 40] | P_L × 40 | 0 | 40 |
| Moderate Risk | [40, 70] | 40 + (P_M × 30) | 40 | 70 |
| High Risk | [70, 100] | 70 + (P_H × 30) | 70 | 100 |

### 4.3 Rationale for Score Ranges

The ranges are designed to:
1. **Separate risk levels clearly** with non-overlapping ranges
2. **Reflect confidence** - higher probability = higher score within range
3. **Align with clinical thresholds** - similar to EPDS cutoffs (0-9, 10-12, 13+)
4. **Provide actionable information** - clear boundaries for intervention

---

## 5. WORKED EXAMPLES

### Example 1: Clear Low Risk Case

**Input Data:**
- Age: 28
- Good relationships (husband, in-laws)
- High support
- No depression history
- Planned pregnancy
- No abuse

**Model Output:**
```
P(High) = 0.05
P(Medium) = 0.15
P(Low) = 0.80
```

**Calculation:**
```
Maximum probability = P(Low) = 0.80
Risk Level = "Low Risk"
Score = P_L × 40 = 0.80 × 40 = 32.0
```

**Result:** Low Risk, Score = 32/100

---

### Example 2: Moderate Risk Case

**Input Data:**
- Age: 35 (higher risk age)
- Neutral relationships
- Medium support
- No depression history
- Unplanned pregnancy
- Fear of childbirth

**Model Output:**
```
P(High) = 0.20
P(Medium) = 0.65
P(Low) = 0.15
```

**Calculation:**
```
Maximum probability = P(Medium) = 0.65
Risk Level = "Moderate Risk"
Score = 40 + (P_M × 30) = 40 + (0.65 × 30) = 40 + 19.5 = 59.5
```

**Result:** Moderate Risk, Score = 59.5/100

---

### Example 3: High Risk Case

**Input Data:**
- Age: 19 (very young)
- Poor/bad relationships
- Low support
- Depression before AND during pregnancy
- Abuse present
- Unplanned pregnancy
- No one to trust

**Model Output:**
```
P(High) = 0.90
P(Medium) = 0.08
P(Low) = 0.02
```

**Calculation:**
```
Maximum probability = P(High) = 0.90
Risk Level = "High Risk"
Score = 70 + (P_H × 30) = 70 + (0.90 × 30) = 70 + 27 = 97.0
```

**Result:** High Risk, Score = 97/100

---

## 6. STATISTICAL PROPERTIES

### 6.1 Score Distribution Properties

- **Continuous:** Score can be any value within range (not just integers)
- **Bounded:** Score ∈ [0, 100]
- **Monotonic:** Higher probability → Higher score within each risk level
- **Non-overlapping ranges:** Clear boundaries between risk levels

### 6.2 Probability Interpretation

The model probabilities represent:
- **Confidence level** in each classification
- **Uncertainty quantification** - spread across classes indicates ambiguity
- **Not absolute risk** - relative likelihood based on training data patterns

### 6.3 Model Assumptions

1. **Independence:** Features are treated as independent predictors
2. **Training data representativeness:** Model learned from specific population
3. **Feature importance:** Not all 69 features contribute equally
4. **Non-linear relationships:** CatBoost captures complex interactions

---

## 7. VALIDATION METRICS (For Discussion)

### 7.1 Questions for Statistical Review

1. **Is the scoring formula mathematically sound?**
   - Are the ranges appropriate?
   - Is the linear scaling within ranges justified?

2. **Is the one-hot encoding approach valid?**
   - Does it introduce multicollinearity?
   - Should we use dummy encoding (drop first category)?

3. **Are there better scoring methods?**
   - Logistic regression probabilities?
   - Weighted sum of probabilities?
   - Non-linear transformation?

4. **How should we handle edge cases?**
   - Equal probabilities across classes?
   - Very low confidence predictions?

5. **What validation metrics should we report?**
   - Accuracy, Precision, Recall?
   - ROC-AUC for each class?
   - Confusion matrix?
   - Calibration curves?

---

## 8. LIMITATIONS

### 8.1 Statistical Limitations

1. **Model is a black box** - CatBoost doesn't provide simple coefficients
2. **No confidence intervals** - single point estimate for score
3. **No p-values** - not hypothesis testing, just prediction
4. **Training data bias** - model reflects patterns in training set
5. **Overfitting risk** - 69 features with potentially limited training data

### 8.2 Clinical Limitations

1. **Not diagnostic** - screening tool only
2. **Requires clinical judgment** - AI assists, doesn't replace
3. **Population-specific** - may not generalize to all demographics
4. **Temporal validity** - model may need retraining over time

---

## 9. COMPARISON WITH STANDARD EPDS SCORING

### 9.1 Traditional EPDS Method

**Standard EPDS Scoring:**
- 10 questions, each scored 0-3
- Total score: 0-30
- Cutoffs:
  - 0-9: Low risk
  - 10-12: Moderate risk
  - 13-30: High risk

**Your System:**
- Collects EPDS questions but doesn't directly score them
- Uses 26 demographic/psychosocial variables
- ML model predicts risk based on patterns
- Score: 0-100 (different scale)

### 9.2 Why Not Use EPDS Directly?

**Advantages of ML Approach:**
1. Considers broader context (relationships, support, history)
2. Can identify at-risk patients before symptoms manifest
3. Captures complex interactions between factors
4. More comprehensive than 10 questions alone

**Disadvantages:**
1. Less interpretable than simple sum
2. Requires more data collection
3. Harder to validate clinically
4. Not standardized like EPDS

---

## 10. RECOMMENDATIONS FOR STATISTICAL VALIDATION

### 10.1 Suggested Analyses

1. **Feature Importance Analysis**
   - Which of the 69 features contribute most?
   - Can we reduce dimensionality?

2. **Model Performance Metrics**
   - Accuracy on test set
   - Precision/Recall for each class
   - ROC curves and AUC

3. **Calibration Assessment**
   - Do predicted probabilities match actual outcomes?
   - Calibration plots

4. **Sensitivity Analysis**
   - How do small changes in input affect output?
   - Robustness testing

5. **Cross-Validation**
   - K-fold validation results
   - Generalization performance

### 10.2 Documentation Needed

For academic review, provide:
- Training dataset description (size, distribution)
- Model hyperparameters
- Training/validation/test split
- Performance metrics
- Feature importance rankings
- Confusion matrix
- Sample predictions with explanations

---

## 11. MATHEMATICAL NOTATION SUMMARY

```
Let:
  X = [x₁, x₂, ..., x₆₉]  // Input feature vector
  f(X) = CatBoost model
  
Model Output:
  ŷ = f(X) = {class, [P_H, P_L, P_M]}
  
Where:
  class ∈ {High, Low, Medium}
  P_H, P_L, P_M ∈ [0, 1]
  P_H + P_L + P_M = 1
  
Risk Score Function:
  S(P_H, P_M, P_L) = 
    ⎧ 70 + 30P_H    if argmax(P) = H
    ⎨ 40 + 30P_M    if argmax(P) = M
    ⎩ 40P_L         if argmax(P) = L
    
  Where S: [0,1]³ → [0,100]
```

---

## 12. CONCLUSION

**Summary for Statistics Teacher:**

1. **26 raw variables** are collected
2. **One-hot encoding** expands to **69 binary/numerical features**
3. **CatBoost ML model** predicts risk class + probabilities
4. **Piecewise linear function** converts probabilities to 0-100 score
5. **Three risk levels** with non-overlapping score ranges
6. **Model-based approach** differs from traditional EPDS manual scoring

**Key Question for Review:**
Is this scoring methodology statistically sound and clinically appropriate?

---

**Prepared for:** Statistics/Mathematics Teacher Review  
**Date:** [Current Date]  
**Version:** 1.0
