# Model Features Documentation
## Postpartum Depression Risk Prediction System

---

## Overview

The CatBoost machine learning model uses **69 features** derived from **26 raw input variables** collected through the clinical assessment form. The features are one-hot encoded categorical variables and numerical features.

---

## Feature Categories

### 1. DEMOGRAPHIC FEATURES (3 numerical + 16 categorical)

#### Numerical Features:
1. **Age** - Patient's age (18-50 years)
2. **Number of the latest pregnancy** - Pregnancy count (1, 2, 3, 4+)
3. **Pregnancy length** - Encoded as 1-6 (Less than 5m to 10m)

#### Categorical Features (One-Hot Encoded):

**Residence (2 features):**
4. Residence_City
5. Residence_Village

**Education Level (4 features):**
6. Education Level_College
7. Education Level_High School
8. Education Level_Primary School
9. Education Level_University

**Marital Status (2 features):**
10. Marital status_Divorced
11. Marital status_Married

**Occupation before latest pregnancy (7 features):**
12. Occupation before latest pregnancy_Business
13. Occupation before latest pregnancy_Doctor
14. Occupation before latest pregnancy_Housewife
15. Occupation before latest pregnancy_Other
16. Occupation before latest pregnancy_Service
17. Occupation before latest pregnancy_Student
18. Occupation before latest pregnancy_Teacher

---

### 2. PARTNER/FAMILY FEATURES (17 categorical)

**Husband's Education Level (4 features):**
19. Husband's education level_College
20. Husband's education level_High School
21. Husband's education level_Primary School
22. Husband's education level_University

**Husband's Monthly Income (5 features):**
23. Husband's monthly income_10000 to 20000
24. Husband's monthly income_20000 to 30000
25. Husband's monthly income_5000 to 10000
26. Husband's monthly income_Less than 5000
27. Husband's monthly income_More than 30000

**Total Children (3 features):**
28. Total children_More than two
29. Total children_One
30. Total children_Two

**Family Type (2 features):**
31. Family type_Joint
32. Family type_Nuclear

**Number of Household Members (3 features):**
33. Number of household members_2 to 5
34. Number of household members_6 to 8
35. Number of household members_9 or more

---

### 3. RELATIONSHIP & SUPPORT FEATURES (17 categorical)

**Relationship with In-Laws (5 features):**
36. Relationship with the in-laws_Bad
37. Relationship with the in-laws_Friendly
38. Relationship with the in-laws_Good
39. Relationship with the in-laws_Neutral
40. Relationship with the in-laws_Poor

**Relationship with Husband (5 features):**
41. Relationship with husband_Bad
42. Relationship with husband_Friendly
43. Relationship with husband_Good
44. Relationship with husband_Neutral
45. Relationship with husband_Poor

**Received Support (3 features):**
46. Recieved Support_High
47. Recieved Support_Low
48. Recieved Support_Medium

**Need for Support (3 features):**
49. Need for Support_High
50. Need for Support_Low
51. Need for Support_Medium

**Trust and Share Feelings (2 features):**
56. Trust and share feelings_No
57. Trust and share feelings_Yes

---

### 4. PREGNANCY HISTORY FEATURES (10 categorical)

**Major Changes or Losses (2 features):**
52. Major changes or losses during pregnancy_No
53. Major changes or losses during pregnancy_Yes

**Pregnancy Plan (2 features):**
58. Pregnancy plan_No
59. Pregnancy plan_Yes

**Regular Checkups (2 features):**
60. Regular checkups_No
61. Regular checkups_Yes

**Fear of Pregnancy (2 features):**
62. Fear of pregnancy_No
63. Fear of pregnancy_Yes

**Diseases During Pregnancy (2 features):**
64. Diseases during pregnancy_Chronic Disease
65. Diseases during pregnancy_Non-Chronic Disease

---

### 5. MENTAL HEALTH & ABUSE FEATURES (6 categorical)

**Abuse (2 features):**
54. Abuse_No
55. Abuse_Yes

**Depression Before Pregnancy - PHQ2 (2 features):**
66. Depression before pregnancy (PHQ2)_Negative
67. Depression before pregnancy (PHQ2)_Positive

**Depression During Pregnancy - PHQ2 (2 features):**
68. Depression during pregnancy (PHQ2)_Negative
69. Depression during pregnancy (PHQ2)_Positive

---

## Feature Engineering Process

### Step 1: Raw Data Collection
26 raw variables collected from the assessment form:
- Patient demographics (7 variables)
- Relationships & support (6 variables)
- Pregnancy history (6 variables)
- Mental health history (6 variables)
- Patient name (1 variable - not used in model)

### Step 2: Data Preprocessing
- Categorical variables are one-hot encoded
- Pregnancy length is mapped to numerical values (1-6)
- Missing values are filled with defaults
- Text standardization (e.g., "High school" → "High School")

### Step 3: Feature Alignment
- Final feature vector has exactly 69 dimensions
- Missing columns after one-hot encoding are filled with 0
- Feature order matches training data exactly

---

## Important Notes

### Features NOT Used in Model:
- **EPDS Questions (epds_1 to epds_10)** - These 10 questions are collected but NOT directly fed into the model as individual features
- **Patient Name** - Used only for record-keeping
- **Clinician fields** (clinician_risk, plan, notes) - Added after prediction

### Why EPDS is Not Directly Used:
The model was trained on the **EPDS Result** (Low/Medium/High) as the target variable, not the individual EPDS question scores. The model learns patterns from demographic and psychosocial factors that correlate with EPDS outcomes.

### Feature Importance:
Based on typical PPD research, the most predictive features are likely:
1. Depression during pregnancy (PHQ2)
2. Depression before pregnancy (PHQ2)
3. Received Support level
4. Relationship with husband
5. Abuse
6. Age (extremes: <20 or >35)
7. Trust and share feelings
8. Major changes or losses

---

## Model Architecture

- **Algorithm:** CatBoost Classifier
- **Input Dimensions:** 69 features
- **Output Classes:** 3 (Low, Medium, High)
- **Output Format:** 
  - Predicted class (string)
  - Probability distribution across 3 classes
  - Risk score (0-100) derived from probabilities

---

## Data Flow

```
User Input (26 variables)
    ↓
Preprocessing & Mapping
    ↓
One-Hot Encoding
    ↓
Feature Vector (69 dimensions)
    ↓
CatBoost Model
    ↓
Prediction (Low/Medium/High + Score)
```

---

## Feature Value Ranges

### Numerical Features:
- **Age:** 18-50
- **Number of the latest pregnancy:** 1-4
- **Pregnancy length:** 1-6 (encoded)

### Categorical Features:
All categorical features are binary (0 or 1) after one-hot encoding.

---

## Model Performance Considerations

The model's accuracy depends on:
1. Quality of training data
2. Balance of classes in training set
3. Feature correlation with actual PPD outcomes
4. Proper handling of missing values
5. Consistency in data collection

---

## Compliance & Ethical Notes

- All features are based on validated clinical research
- No discriminatory features (race, religion, etc.)
- Sensitive information (abuse, depression) handled with care
- Model output is advisory, not diagnostic
- Clinician retains final decision authority

---

**Last Updated:** [Current Date]  
**Model Version:** 1.0  
**Feature Set Version:** 1.0
