# Simple Scoring Explanation
## For Quick Understanding

---

## The Big Picture

```
26 RAW VARIABLES (what we collect)
         ↓
    ONE-HOT ENCODING (mathematical transformation)
         ↓
69 MODEL FEATURES (what the AI uses)
         ↓
    ML MODEL PREDICTION
         ↓
RISK SCORE 0-100 (what we show)
```

---

## Why 69 Features from 26 Variables?

### Simple Example:

**Question:** "What is your education level?"

**Raw Variable (1):** Education Level

**Possible Answers (4):**
- University
- College  
- High School
- Primary School

**After One-Hot Encoding (4 features):**
```
If answer is "College":
  Education_University = 0
  Education_College = 1      ← This is 1
  Education_HighSchool = 0
  Education_PrimarySchool = 0
```

So 1 question with 4 options becomes 4 separate features!

---

## Complete Breakdown

| What We Collect | How Many Options | Features Created |
|-----------------|------------------|------------------|
| Age | Number (18-50) | 1 |
| Residence | 2 options | 2 |
| Education | 4 options | 4 |
| Marital Status | 2 options | 2 |
| Occupation | 7 options | 7 |
| Partner Education | 4 options | 4 |
| Partner Income | 5 options | 5 |
| Total Children | 3 options | 3 |
| Family Type | 2 options | 2 |
| Household Members | 3 options | 3 |
| Relationship In-laws | 5 options | 5 |
| Relationship Husband | 5 options | 5 |
| Support Received | 3 options | 3 |
| Need Support | 3 options | 3 |
| Major Changes | 2 options | 2 |
| Abuse | 2 options | 2 |
| Trust & Share | 2 options | 2 |
| Pregnancy Number | Number (1-4) | 1 |
| Pregnancy Length | 6 options → Number | 1 |
| Pregnancy Planned | 2 options | 2 |
| Regular Checkups | 2 options | 2 |
| Fear Pregnancy | 2 options | 2 |
| Medical Conditions | 2 options | 2 |
| Depression Before | 2 options | 2 |
| Depression During | 2 options | 2 |
| **TOTAL** | **26 variables** | **69 features** |

---

## How Scoring Works

### Step 1: AI Model Predicts
```
Input: 69 features
Output: Probabilities for each risk level

Example:
  High Risk: 15%
  Medium Risk: 60%
  Low Risk: 25%
```

### Step 2: Pick Highest Probability
```
60% is highest → Medium Risk
```

### Step 3: Calculate Score
```
Medium Risk Formula: 40 + (probability × 30)
Score = 40 + (0.60 × 30)
Score = 40 + 18
Score = 58/100
```

---

## Score Formulas

| Risk Level | Formula | Example | Score Range |
|------------|---------|---------|-------------|
| **Low** | probability × 40 | 0.80 × 40 = 32 | 0-40 |
| **Medium** | 40 + (probability × 30) | 40 + (0.60 × 30) = 58 | 40-70 |
| **High** | 70 + (probability × 30) | 70 + (0.90 × 30) = 97 | 70-100 |

---

## Real Examples

### Example 1: Healthy Patient
```
Input: Good relationships, high support, no depression
AI Output: Low 80%, Medium 15%, High 5%
Winner: Low (80%)
Score: 0.80 × 40 = 32/100
Result: LOW RISK - Score 32
```

### Example 2: Some Concerns
```
Input: Neutral relationships, medium support, fear of childbirth
AI Output: Low 15%, Medium 65%, High 20%
Winner: Medium (65%)
Score: 40 + (0.65 × 30) = 59.5/100
Result: MODERATE RISK - Score 59.5
```

### Example 3: Multiple Risk Factors
```
Input: Poor relationships, low support, depression history, abuse
AI Output: Low 2%, Medium 8%, High 90%
Winner: High (90%)
Score: 70 + (0.90 × 30) = 97/100
Result: HIGH RISK - Score 97
```

---

## Key Points for Statistics Teacher

1. ✅ We collect **26 variables**
2. ✅ One-hot encoding creates **69 features** (this is standard ML practice)
3. ✅ CatBoost model outputs **probabilities** (not scores)
4. ✅ We convert probabilities to **0-100 score** using formulas
5. ✅ Score ranges are **non-overlapping** (0-40, 40-70, 70-100)
6. ✅ Higher probability = higher score within each range

---

## Questions to Discuss

1. **Is the formula mathematically sound?**
   - Linear scaling within ranges
   - Non-overlapping boundaries

2. **Should we use different ranges?**
   - Current: 0-40, 40-70, 70-100
   - Alternative: 0-33, 33-66, 66-100?

3. **Should we weight the probabilities differently?**
   - Current: Direct linear conversion
   - Alternative: Logarithmic? Exponential?

4. **How do we validate the model?**
   - Need accuracy metrics
   - Need comparison with actual outcomes

---

## What We DON'T Do

❌ We DON'T manually score EPDS questions (0-3 each)  
❌ We DON'T add up scores like traditional EPDS  
❌ We DON'T use Low=1, Medium=2, High=3 scoring  
❌ We DON'T have safety overrides (should add this!)

---

## Bottom Line

**26 variables → 69 features → AI prediction → 0-100 score**

The "69" is just a mathematical transformation, not 69 different questions!
