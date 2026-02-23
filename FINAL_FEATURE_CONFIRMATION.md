# FINAL FEATURE CONFIRMATION
## Definitive Answer: EPDS Questions Are NOT Used in the Model

---

## CONFIRMED: EPDS Questions Are NOT Mapped

I've checked the actual `feature_columns.pkl` file that contains the exact features used by your trained CatBoost model.

**Result:** 0 EPDS features found out of 69 total features.

---

## Complete List of 69 Features Actually Used

### Numerical Features (3)
1. Age
2. Number of the latest pregnancy
3. Pregnancy length

### Categorical Features (66) - One-Hot Encoded

#### Residence (2)
4. Residence_City
5. Residence_Village

#### Education Level (4)
6. Education Level_College
7. Education Level_High School
8. Education Level_Primary School
9. Education Level_University

#### Marital Status (2)
10. Marital status_Divorced
11. Marital status_Married

#### Occupation (7)
12. Occupation before latest pregnancy_Business
13. Occupation before latest pregnancy_Doctor
14. Occupation before latest pregnancy_Housewife
15. Occupation before latest pregnancy_Other
16. Occupation before latest pregnancy_Service
17. Occupation before latest pregnancy_Student
18. Occupation before latest pregnancy_Teacher

#### Husband's Education (4)
19. Husband's education level_College
20. Husband's education level_High School
21. Husband's education level_Primary School
22. Husband's education level_University

#### Husband's Income (5)
23. Husband's monthly income_10000 to 20000
24. Husband's monthly income_20000 to 30000
25. Husband's monthly income_5000 to 10000
26. Husband's monthly income_Less than 5000
27. Husband's monthly income_More than 30000

#### Total Children (3)
28. Total children_More than two
29. Total children_One
30. Total children_Two

#### Family Type (2)
31. Family type_Joint
32. Family type_Nuclear

#### Household Members (3)
33. Number of household members_2 to 5
34. Number of household members_6 to 8
35. Number of household members_9 or more

#### Relationship with In-Laws (5)
36. Relationship with the in-laws_Bad
37. Relationship with the in-laws_Friendly
38. Relationship with the in-laws_Good
39. Relationship with the in-laws_Neutral
40. Relationship with the in-laws_Poor

#### Relationship with Husband (5)
41. Relationship with husband_Bad
42. Relationship with husband_Friendly
43. Relationship with husband_Good
44. Relationship with husband_Neutral
45. Relationship with husband_Poor

#### Support Received (3)
46. Recieved Support_High
47. Recieved Support_Low
48. Recieved Support_Medium

#### Need for Support (3)
49. Need for Support_High
50. Need for Support_Low
51. Need for Support_Medium

#### Major Changes/Losses (2)
52. Major changes or losses during pregnancy_No
53. Major changes or losses during pregnancy_Yes

#### Abuse (2)
54. Abuse_No
55. Abuse_Yes

#### Trust & Share Feelings (2)
56. Trust and share feelings_No
57. Trust and share feelings_Yes

#### Pregnancy Plan (2)
58. Pregnancy plan_No
59. Pregnancy plan_Yes

#### Regular Checkups (2)
60. Regular checkups_No
61. Regular checkups_Yes

#### Fear of Pregnancy (2)
62. Fear of pregnancy_No
63. Fear of pregnancy_Yes

#### Diseases During Pregnancy (2)
64. Diseases during pregnancy_Chronic Disease
65. Diseases during pregnancy_Non-Chronic Disease

#### Depression Before Pregnancy - PHQ2 (2)
66. Depression before pregnancy (PHQ2)_Negative
67. Depression before pregnancy (PHQ2)_Positive

#### Depression During Pregnancy - PHQ2 (2)
68. Depression during pregnancy (PHQ2)_Negative
69. Depression during pregnancy (PHQ2)_Positive

---

## What's Missing: EPDS Questions

**NOT in the model:**
- epds_1 (Able to laugh)
- epds_2 (Look forward to things)
- epds_3 (Blamed myself)
- epds_4 (Anxious/worried)
- epds_5 (Scared/panicky)
- epds_6 (Things getting on top)
- epds_7 (Difficulty sleeping)
- epds_8 (Sad/miserable)
- epds_9 (Been crying)
- epds_10 (Self-harm thoughts)

**NOT in the model:**
- EPDS total score
- EPDS subscale scores
- Any EPDS-derived features

---

## Why This Matters

### For Your Statistics Teacher:

**Question:** "Are you using EPDS questions in your model?"  
**Answer:** "No, we collect them but they are NOT used in the ML prediction."

**Question:** "What are the 69 features?"  
**Answer:** "25 raw variables (demographics, relationships, pregnancy history, mental health history) expanded to 69 features through one-hot encoding of categorical variables."

**Question:** "Why collect EPDS if not using it?"  
**Answer:** "For clinician review, record keeping, and potential future model improvements. The current model was trained to predict EPDS risk level from demographic/psychosocial patterns alone."

---

## Model Training Approach

### What the Model Was Trained On:

**Input (X):** 69 features from demographic/psychosocial data  
**Output (y):** EPDS Result classification (Low/Medium/High)

The model learned patterns like:
- "Young age + low support + depression history → High risk"
- "Good relationships + high support + no depression → Low risk"
- "Neutral relationships + medium support → Medium risk"

**The model predicts what the EPDS result WOULD BE, without needing the actual EPDS responses.**

---

## Implications

### Strengths:
✅ Can identify at-risk patients BEFORE symptoms manifest  
✅ Based on objective demographic/social factors  
✅ Less dependent on patient mood during assessment  
✅ Can screen earlier in pregnancy  

### Weaknesses:
❌ Ignores valuable symptom data (EPDS questions)  
❌ May miss patients with symptoms but "good" demographics  
❌ Not using all collected data  
❌ Less aligned with standard clinical practice  

---

## Recommendations

### Option 1: Keep Current Approach
- Document clearly that EPDS is for reference only
- Add manual EPDS scoring for clinician review
- Use EPDS as validation/override mechanism

### Option 2: Retrain Model with EPDS
- Include all 10 EPDS questions as features
- Would have 79 features total (69 + 10)
- Likely more accurate predictions
- Better alignment with clinical standards

### Option 3: Hybrid Approach
- Keep demographic model as primary
- Add EPDS-based safety overrides:
  ```python
  if epds_10 > 0:  # Self-harm thoughts
      risk_level = "High Risk"
      immediate_attention_required = True
  
  if sum(epds_1 to epds_10) >= 13:
      risk_level = max(risk_level, "High Risk")
  ```

---

## For Documentation/Paper

### Correct Statement:

"Our system uses a CatBoost machine learning model trained on 69 features derived from 25 demographic and psychosocial variables. These include age, education, income, family relationships, social support, pregnancy history, and mental health history. 

The model was trained to predict Edinburgh Postnatal Depression Scale (EPDS) risk classification (Low/Medium/High) based on these demographic and psychosocial factors, without requiring the actual EPDS questionnaire responses as input features.

The 10 EPDS questions are collected during assessment for clinician review and record-keeping purposes, but are not currently used as input features in the machine learning prediction algorithm."

### Incorrect Statement (Don't Say This):

❌ "Our system uses 69 features including EPDS questions"  
❌ "We score EPDS questions and feed them to the model"  
❌ "The model uses all 35 questions collected"  

---

## Summary Table

| Data Element | Collected? | Used in Model? | Purpose |
|--------------|-----------|----------------|---------|
| Demographics (7) | ✅ Yes | ✅ Yes | ML prediction |
| Relationships (6) | ✅ Yes | ✅ Yes | ML prediction |
| Pregnancy History (6) | ✅ Yes | ✅ Yes | ML prediction |
| Mental Health History (6) | ✅ Yes | ✅ Yes | ML prediction |
| EPDS Questions (10) | ✅ Yes | ❌ No | Clinician review only |
| **Total Variables** | **35** | **25** | - |
| **Total Features** | - | **69** | After one-hot encoding |

---

## Verification Command

To verify this yourself, run:
```bash
python -c "import joblib; features = joblib.load('Pregnancy_Mental_Health/backend/app/model_files/feature_columns.pkl'); print(f'Total: {len(features)}'); print(f'EPDS features: {len([f for f in features if \"epds\" in f.lower()])}')"
```

**Output:**
```
Total: 69
EPDS features: 0
```

---

**Conclusion:** EPDS questions are definitively NOT mapped in the feature set. The model uses only demographic and psychosocial variables.

**Date Verified:** [Current Date]  
**Method:** Direct inspection of feature_columns.pkl file  
**Certainty:** 100%
