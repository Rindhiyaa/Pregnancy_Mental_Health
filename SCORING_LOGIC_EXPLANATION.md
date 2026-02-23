# Scoring Logic Explanation
## How Risk Assessment Works in Your Project

---

## Overview

Your project uses a **Machine Learning-based scoring system** with the CatBoost classifier. Here's the complete flow:

---

## Step-by-Step Scoring Process

### STEP 1: Data Collection (Frontend)
**File:** `NewAssessment.jsx`

The clinician fills out a 35-question assessment form covering:
- Demographics (7 questions)
- Relationships & Support (6 questions)
- Pregnancy History (6 questions)
- Mental Health History (6 questions)
- EPDS Assessment (10 questions)

**Important:** EPDS questions are collected but NOT directly used in the ML model prediction.

---

### STEP 2: Data Submission
**Endpoint:** `POST /api/assessments/predict`

When the clinician clicks "Generate AI Risk Assessment", the form data is sent to the backend.

---

### STEP 3: Feature Engineering
**File:** `ml_model.py` → `build_model_input_from_form()`

The raw form data (26 variables) is transformed into model-ready features:

```python
# Example transformation:
{
    "Age": 28,
    "Residence": "City",
    "Education Level": "University",
    "Depression during pregnancy (PHQ2)": "Negative",
    # ... 22 more features
}
```

Then:
1. **One-hot encoding** converts categorical variables into binary columns
2. **Feature alignment** ensures exactly 69 features match the training data
3. Missing columns are filled with 0

**Result:** A 69-dimensional feature vector

---

### STEP 4: ML Model Prediction
**File:** `assessments.py` → `predict_assessment()`

The CatBoost model processes the 69 features and outputs:

```python
# Model output:
pred_class = "Medium"  # Predicted class
proba = [0.15, 0.25, 0.60]  # Probabilities for [High, Low, Medium]
```

The model returns:
- **Predicted class:** "High", "Medium", or "Low"
- **Probability distribution:** Confidence for each class (0.0 to 1.0)

---

### STEP 5: Score Calculation
**File:** `assessments.py` → Lines 28-40

The system converts ML probabilities into a 0-100 risk score:

```python
# Get probabilities for each class
high_prob = 0.15   # 15% chance of High risk
med_prob = 0.60    # 60% chance of Medium risk
low_prob = 0.25    # 25% chance of Low risk

# Determine risk level (pick highest probability)
if high_prob >= med_prob and high_prob >= low_prob:
    risk_level = "High Risk"
    pred_score = 70 + (high_prob * 30)  # Score: 70-100
    
elif med_prob >= low_prob:
    risk_level = "Moderate Risk"
    pred_score = 40 + (med_prob * 30)   # Score: 40-70
    
else:
    risk_level = "Low Risk"
    pred_score = low_prob * 40          # Score: 0-40
```

---

## Score Ranges

| Risk Level | Score Range | Calculation Formula |
|------------|-------------|---------------------|
| **Low Risk** | 0 - 40 | `low_probability × 40` |
| **Moderate Risk** | 40 - 70 | `40 + (medium_probability × 30)` |
| **High Risk** | 70 - 100 | `70 + (high_probability × 30)` |

---

## Example Calculations

### Example 1: Low Risk Patient
```
Model Output:
- High probability: 0.05 (5%)
- Medium probability: 0.15 (15%)
- Low probability: 0.80 (80%)

Calculation:
- Highest probability: Low (0.80)
- Risk Level: "Low Risk"
- Score: 0.80 × 40 = 32.0/100
```

### Example 2: Moderate Risk Patient
```
Model Output:
- High probability: 0.20 (20%)
- Medium probability: 0.65 (65%)
- Low probability: 0.15 (15%)

Calculation:
- Highest probability: Medium (0.65)
- Risk Level: "Moderate Risk"
- Score: 40 + (0.65 × 30) = 59.5/100
```

### Example 3: High Risk Patient
```
Model Output:
- High probability: 0.85 (85%)
- Medium probability: 0.10 (10%)
- Low probability: 0.05 (5%)

Calculation:
- Highest probability: High (0.85)
- Risk Level: "High Risk"
- Score: 70 + (0.85 × 30) = 95.5/100
```

---

## What Influences the Score?

The ML model considers these factors (in order of typical importance):

### High Impact Factors:
1. **Depression during pregnancy** (PHQ2 Positive) - STRONGEST predictor
2. **Depression before pregnancy** (PHQ2 Positive)
3. **Abuse during pregnancy** (Yes)
4. **Low support** from family/friends
5. **Poor/Bad relationship** with husband
6. **No one to trust** and share feelings with

### Medium Impact Factors:
7. Age extremes (<20 or >35 years)
8. Poor relationship with in-laws
9. High need for more support
10. Major changes or losses during pregnancy
11. Unplanned pregnancy
12. Fear of pregnancy/childbirth
13. Chronic medical conditions

### Lower Impact Factors:
14. Low education level
15. Low income
16. Village residence
17. Joint family (vs. Nuclear)
18. Large household (9+ members)
19. Multiple pregnancies (3+)
20. No regular checkups

---

## Backup Scoring System (NOT Currently Used)

There's a fallback function `calculate_weighted_risk_score()` in the code, but it's **NOT active**. If the ML model fails, the system returns an error instead of using backup scoring.

```python
def calculate_weighted_risk_score(features) -> float:
    """
    Fallback calculation using weighted features based on research
    (NOT CURRENTLY USED)
    """
    score = 0
    
    # Relationship factors (30% weight)
    relationship_score = (features[1] + features[4]) / 8 * 30
    score += relationship_score
    
    # Support factors (25% weight)
    support_score = features[2] / 2 * 25
    score += support_score
    
    # Mental health factors (25% weight)
    mental_score = (features[6] + features[9]) / 5 * 25
    score += mental_score
    
    # Age factor (10% weight)
    age_risk = 1 if features[3] < 20 or features[3] > 35 else 0
    score += age_risk * 10
    
    # Newborn bonding (10% weight)
    bonding_score = (4 - features[5]) / 4 * 10
    score += bonding_score
    
    return min(max(score, 0), 100)
```

---

## EPDS Questions - What Happens to Them?

The 10 EPDS questions (epds_1 to epds_10) are:
- ✅ **Collected** from the clinician
- ✅ **Stored** in the database (raw_data field)
- ❌ **NOT used** in the ML model prediction
- ❌ **NOT scored** manually (0-30 scale)

**Why?** The ML model was trained on the final EPDS classification (Low/Medium/High), not individual question scores. It learns patterns from demographic and psychosocial factors that correlate with EPDS outcomes.

---

## Safety Overrides

**Currently:** There are NO automatic safety overrides in the code.

**What this means:**
- Even if EPDS question 10 (self-harm thoughts) is answered with high risk, the system doesn't automatically flag it
- The ML model considers all factors together
- Clinicians must manually review responses and override if needed

**Recommendation:** Consider adding safety checks for:
- EPDS Q10 (self-harm) > 0
- Abuse = "Yes"
- Depression during pregnancy = "Positive"

---

## Complete Flow Diagram

```
User fills form (35 questions)
         ↓
Submit to /api/assessments/predict
         ↓
Extract 26 variables
         ↓
Transform to 69 features (one-hot encoding)
         ↓
Feed into CatBoost ML Model
         ↓
Model outputs: class + probabilities
         ↓
Convert to risk level + score (0-100)
         ↓
Return to frontend
         ↓
Display result to clinician
         ↓
Clinician adds their assessment
         ↓
Save to database
```

---

## Key Takeaways

1. **Scoring is ML-based**, not manual calculation
2. **Score range is 0-100**, derived from model confidence
3. **EPDS questions are collected but not directly scored**
4. **No automatic safety overrides** currently implemented
5. **Clinician can override** the AI assessment with their own judgment
6. **Model considers 69 features** from 26 input variables
7. **Depression during pregnancy is the strongest predictor**

---

## Files Involved

| File | Purpose |
|------|---------|
| `NewAssessment.jsx` | Frontend form for data collection |
| `assessments.py` | Backend API endpoint for prediction |
| `ml_model.py` | Feature engineering and model loading |
| `catboost_epds_model.cbm` | Trained ML model file |
| `feature_columns.pkl` | List of 69 feature names |

---

**Last Updated:** [Current Date]  
**System Version:** 1.0
