# Model Performance Report
## CatBoost PPD Risk Prediction Model

---

## Current Status

⚠️ **Performance metrics are NOT available** because:
1. The trained model file (.cbm) doesn't store training metrics
2. No training/validation script is available in the repository
3. No test dataset with ground truth labels is provided

---

## What We Know About the Model

### Model Architecture
- **Algorithm:** CatBoost Classifier (Gradient Boosting)
- **Input Features:** 69 features (from 25 demographic/psychosocial variables)
- **Output Classes:** 3 (Low, Medium, High)
- **Model File:** `catboost_epds_model.cbm`
- **Feature File:** `feature_columns.pkl`

### Current Scoring System (After GitHub Update)
```
Final Score = (ML Model Score × 0.70) + (EPDS Score × 0.30)

Where:
- ML Model Score: 0-100 (from CatBoost prediction on 69 features)
- EPDS Score: 0-100 (scaled from EPDS total 0-30)
```

### Risk Classification Thresholds
| Score Range | Risk Level |
|-------------|------------|
| 0-32 | Low Risk |
| 33-65 | Moderate Risk |
| 66-100 | High Risk |

---

## What Performance Metrics Are Needed

To properly evaluate this model, you need:

### 1. Classification Metrics
- **Accuracy:** Overall correctness (TP+TN)/(Total)
- **Precision:** Of predicted high-risk, how many are actually high-risk
- **Recall (Sensitivity):** Of actual high-risk, how many did we catch
- **F1-Score:** Harmonic mean of precision and recall
- **Specificity:** Of actual low-risk, how many did we correctly identify

### 2. Confusion Matrix
```
                Predicted
              Low  Med  High
Actual Low    [?]  [?]  [?]
       Med    [?]  [?]  [?]
       High   [?]  [?]  [?]
```

### 3. ROC-AUC Curves
- Area Under Curve for each class
- Shows trade-off between sensitivity and specificity

### 4. Calibration
- Do predicted probabilities match actual outcomes?
- Calibration plot: predicted vs. actual risk

### 5. Feature Importance
- Which of the 69 features contribute most to predictions?
- Top 10 most important features

---

## How to Get Performance Metrics

### Option 1: Test on New Data
1. Collect new patient data with known outcomes
2. Run predictions using your model
3. Compare predictions vs. actual outcomes
4. Calculate metrics

### Option 2: Request from Model Creator
If someone else trained this model, ask them for:
- Training accuracy
- Validation accuracy
- Test set performance
- Confusion matrix
- Feature importance rankings
- Training notebook/script

### Option 3: Retrain with Evaluation
1. Get the original training dataset
2. Split into train/validation/test sets
3. Train new model with evaluation code
4. Document all metrics

---

## Typical Performance Expectations

For PPD prediction models in research literature:

| Metric | Good Performance | Excellent Performance |
|--------|------------------|----------------------|
| Accuracy | 70-80% | >85% |
| Precision (High Risk) | 60-70% | >75% |
| Recall (High Risk) | 70-80% | >85% |
| F1-Score | 65-75% | >80% |
| ROC-AUC | 0.75-0.85 | >0.90 |

**Note:** For medical screening, HIGH RECALL (sensitivity) is more important than precision - we want to catch all high-risk patients, even if we have some false positives.

---

## Model Validation Checklist

To properly validate your model for academic/clinical use:

### Data Quality
- [ ] Training data size (minimum 500-1000 samples recommended)
- [ ] Class balance (Low/Medium/High distribution)
- [ ] Data quality (missing values, outliers)
- [ ] Representative sample (matches target population)

### Model Training
- [ ] Train/validation/test split (e.g., 70/15/15)
- [ ] Cross-validation performed (k-fold)
- [ ] Hyperparameter tuning documented
- [ ] Overfitting checked (train vs. validation performance)

### Performance Evaluation
- [ ] Accuracy on test set
- [ ] Precision, Recall, F1 for each class
- [ ] Confusion matrix
- [ ] ROC-AUC curves
- [ ] Calibration assessment

### Clinical Validation
- [ ] Comparison with standard EPDS scoring
- [ ] Expert clinician review
- [ ] Pilot testing with real patients
- [ ] Safety analysis (false negatives)

### Documentation
- [ ] Training methodology documented
- [ ] Feature engineering explained
- [ ] Model limitations stated
- [ ] Ethical considerations addressed

---

## Recommendations for Your Project

### Immediate Actions:

1. **Document Current Model:**
   - How was it trained?
   - What dataset was used?
   - What were the training metrics?

2. **Create Test Dataset:**
   - Collect 50-100 sample cases with known outcomes
   - Run predictions
   - Calculate basic metrics (accuracy, confusion matrix)

3. **Feature Importance Analysis:**
   - Extract feature importance from CatBoost model
   - Identify top predictors
   - Validate against clinical research

4. **Clinical Validation:**
   - Have clinicians review sample predictions
   - Compare AI predictions vs. clinician assessments
   - Identify discrepancies

### For Statistics Teacher Review:

Prepare a document with:
- Model architecture and parameters
- Training methodology (if available)
- Sample predictions with explanations
- Comparison with standard EPDS scoring
- Limitations and assumptions
- Validation plan

---

## Sample Performance Report Template

```
Model: CatBoost PPD Risk Classifier
Training Date: [Date]
Training Data: [N samples, distribution]

Performance Metrics (Test Set):
- Accuracy: [X]%
- Precision (High Risk): [X]%
- Recall (High Risk): [X]%
- F1-Score: [X]
- ROC-AUC: [X]

Confusion Matrix:
[Matrix here]

Top 5 Important Features:
1. [Feature name] - [Importance score]
2. [Feature name] - [Importance score]
...

Limitations:
- [List limitations]

Clinical Validation:
- [Results of clinician review]
```

---

## Next Steps

1. **Find training information** - Check with whoever trained the model
2. **Create test script** - Write code to evaluate on new data
3. **Document everything** - For academic/clinical approval
4. **Plan validation study** - Test with real clinical data

---

**Status:** Model is deployed but performance metrics are unknown  
**Priority:** HIGH - Need metrics for academic validation  
**Action Required:** Obtain training data and evaluation results

---

**Last Updated:** [Current Date]  
**Prepared By:** AI Analysis
