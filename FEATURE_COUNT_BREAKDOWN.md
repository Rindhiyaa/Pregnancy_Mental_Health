# Exact Feature Count Breakdown
## How 26 Variables Become 69 Features

---

## Counting Method

For each variable, I'll show:
- Variable name
- Number of possible values
- How many features it creates after one-hot encoding

---

## NUMERICAL VARIABLES (Stay as 1 feature each)

| # | Variable | Type | Features |
|---|----------|------|----------|
| 1 | Age | Number (18-50) | **1** |
| 2 | Pregnancy Number | Number (1-4) | **1** |
| 3 | Pregnancy Length | Encoded to 1-6 | **1** |

**Subtotal: 3 features**

---

## CATEGORICAL VARIABLES (Expand based on options)

### Demographics (16 features)

| # | Variable | Options | Features Created |
|---|----------|---------|------------------|
| 4 | Residence | City, Village | **2** |
| 5 | Education Level | University, College, High School, Primary School | **4** |
| 6 | Marital Status | Married, Divorced | **2** |
| 7 | Occupation | Housewife, Business, Doctor, Teacher, Service, Student, Other | **7** |
| 8 | Partner Education | University, College, High School, Primary School | **4** |

**Subtotal: 2 + 4 + 2 + 7 + 4 = 19 features**

### Financial & Family (13 features)

| # | Variable | Options | Features Created |
|---|----------|---------|------------------|
| 9 | Partner Income | <5000, 5000-10000, 10000-20000, 20000-30000, >30000 | **5** |
| 10 | Total Children | One, Two, More than two | **3** |
| 11 | Family Type | Nuclear, Joint | **2** |
| 12 | Household Members | 2-5, 6-8, 9 or more | **3** |

**Subtotal: 5 + 3 + 2 + 3 = 13 features**

### Relationships (13 features)

| # | Variable | Options | Features Created |
|---|----------|---------|------------------|
| 13 | Relationship In-laws | Good, Friendly, Neutral, Bad, Poor | **5** |
| 14 | Relationship Husband | Good, Friendly, Neutral, Bad, Poor | **5** |
| 15 | Support Received | High, Medium, Low | **3** |

**Subtotal: 5 + 5 + 3 = 13 features**

### Support & Safety (7 features)

| # | Variable | Options | Features Created |
|---|----------|---------|------------------|
| 16 | Need for Support | High, Medium, Low | **3** |
| 17 | Major Changes/Losses | Yes, No | **2** |
| 18 | Trust & Share Feelings | Yes, No | **2** |

**Subtotal: 3 + 2 + 2 = 7 features**

### Pregnancy Details (8 features)

| # | Variable | Options | Features Created |
|---|----------|---------|------------------|
| 19 | Pregnancy Planned | Yes, No | **2** |
| 20 | Regular Checkups | Yes, No | **2** |
| 21 | Fear of Pregnancy | Yes, No | **2** |
| 22 | Medical Conditions | Chronic Disease, Non-Chronic Disease | **2** |

**Subtotal: 2 + 2 + 2 + 2 = 8 features**

### Mental Health & Abuse (6 features)

| # | Variable | Options | Features Created |
|---|----------|---------|------------------|
| 23 | Abuse | Yes, No | **2** |
| 24 | Depression Before Pregnancy | Positive, Negative | **2** |
| 25 | Depression During Pregnancy | Positive, Negative | **2** |

**Subtotal: 2 + 2 + 2 = 6 features**

---

## FINAL COUNT

| Category | Features |
|----------|----------|
| Numerical Variables | 3 |
| Demographics | 19 |
| Financial & Family | 13 |
| Relationships | 13 |
| Support & Safety | 7 |
| Pregnancy Details | 8 |
| Mental Health & Abuse | 6 |
| **TOTAL** | **69** |

---

## Verification: 3 + 19 + 13 + 13 + 7 + 8 + 6 = 69 ✓

---

## Visual Breakdown

```
26 Raw Variables:
├── 3 Numerical (stay as 3)
└── 23 Categorical (expand to 66)
    ├── 2-option variables (×11) = 22 features
    ├── 3-option variables (×4) = 12 features
    ├── 4-option variables (×2) = 8 features
    ├── 5-option variables (×3) = 15 features
    └── 7-option variables (×1) = 7 features
    
Total: 3 + 66 = 69 features
```

---

## Example: How One Variable Expands

**Variable #13: Relationship with In-laws**

Original question: "How is your relationship with in-laws?"
- Good
- Friendly
- Neutral
- Bad
- Poor

After one-hot encoding, this becomes 5 separate features:

```python
If answer is "Neutral":

Relationship_with_in-laws_Good = 0
Relationship_with_in-laws_Friendly = 0
Relationship_with_in-laws_Neutral = 1  ← Only this is 1
Relationship_with_in-laws_Bad = 0
Relationship_with_in-laws_Poor = 0
```

So 1 question → 5 features!

---

## Why This Matters

The machine learning model needs numbers, not text:
- ❌ Can't use "Good" or "Bad" directly
- ✓ Converts to binary 0s and 1s
- ✓ Each option becomes its own feature
- ✓ Model learns which combinations predict risk

---

## Summary

**26 variables collected from clinician**  
↓  
**One-hot encoding transformation**  
↓  
**69 binary/numerical features for AI model**  
↓  
**Risk prediction (Low/Medium/High)**  
↓  
**Score 0-100**

The 69 is NOT 69 questions - it's the mathematical representation of 26 questions!
