# Improved feature extraction that uses ALL 41 questions

def formdata_to_comprehensive_features(data: AssessmentCreate) -> list:
    """
    Convert all assessment data to ML features
    Uses ALL 41 questions instead of just EPDS
    """
    
    features = []
    
    # 1. Demographics (4 features)
    features.append(data.age or 25)  # Default age
    
    # Education level (ordinal encoding)
    education_map = {"School": 1, "Undergraduate": 2, "Postgraduate": 3}
    features.append(education_map.get(data.education_level, 1))
    
    # Employment status (binary)
    features.append(1 if data.employment_status == "Employed" else 0)
    
    # 2. Medical History (4 features)
    # Delivery type risk score
    delivery_risk = {"Normal": 0, "C-Section": 1, "Assisted": 2, "Other": 1}
    features.append(delivery_risk.get(data.delivery_type, 0))
    
    # Complications (binary)
    features.append(0 if data.delivery_complications == "None" else 1)
    
    # Past obstetric issues (binary)
    features.append(0 if data.past_obstetric == "None" else 1)
    
    # Medical conditions (binary)
    features.append(0 if data.medical_conditions == "None" else 1)
    
    # 3. Mental Health History (3 features) - HIGH IMPACT
    features.append(1 if data.history_depression == "Yes" else 0)
    features.append(1 if data.history_anxiety == "Yes" else 0)
    features.append(0 if data.previous_treatment == "None" else 1)
    
    # 4. Current Symptoms (7 features)
    symptom_map = {"None": 0, "Mild": 1, "Moderate": 2, "Severe": 3,
                   "Very good": 0, "Good": 1, "Fair": 2, "Poor": 3,
                   "Low": 1, "High": 3, "Normal": 0}
    
    features.append(symptom_map.get(data.sleep_quality, 1))
    features.append(symptom_map.get(data.anxiety_level, 1))
    features.append(symptom_map.get(data.stress_level, 1))
    features.append(symptom_map.get(data.fatigue_level, 1))
    features.append(symptom_map.get(data.pain_level, 0))
    features.append(symptom_map.get(data.appetite, 0))
    features.append(symptom_map.get(data.energy_level, 0))
    
    # 5. Social Support (5 features) - HIGH IMPACT
    support_map = {"Low": 1, "Weak": 1, "Moderate": 2, "Strong": 3}
    features.append(support_map.get(data.family_support, 2))
    features.append(support_map.get(data.partner_support, 2))
    features.append(support_map.get(data.social_network, 2))
    
    # Living situation risk
    living_risk = {"Alone": 2, "With partner": 0, "With family": 1, "Other": 1}
    features.append(living_risk.get(data.living_situation, 1))
    
    # Additional support
    features.append(0 if data.additional_support == "None" else 1)
    
    # 6. Life Stressors (5 features) - HIGH IMPACT
    features.append(0 if data.major_life_events == "None" else 1)
    
    # Financial stress
    financial_map = {"Stable/comfortable": 0, "Some stress": 1, 
                    "High stress": 2, "Very high/critical": 3}
    features.append(financial_map.get(data.financial_stress, 1))
    
    # Employment status current
    employment_risk = {"Working (full/part-time)": 0, "On maternity leave": 1,
                      "Not working": 2, "Student": 1}
    features.append(employment_risk.get(data.employment_status_current, 1))
    
    # Relationship stress
    stress_map = {"None": 0, "Mild": 1, "Moderate": 2, "Severe": 3}
    features.append(stress_map.get(data.relationship_stress, 0))
    
    # Caregiving responsibilities
    caregiving_map = {"None": 0, "Some": 1, "Many": 2}
    features.append(caregiving_map.get(data.caregiving_responsibilities, 0))
    
    # 7. EPDS Scores (10 features) - MOST IMPORTANT
    epds_scores = [
        data.epds_1 or 0, data.epds_2 or 0, data.epds_3 or 0, data.epds_4 or 0,
        data.epds_5 or 0, data.epds_6 or 0, data.epds_7 or 0, data.epds_8 or 0,
        data.epds_9 or 0, data.epds_10 or 0,
    ]
    features.extend(epds_scores)
    
    # 8. Composite Features (3 additional features)
    # EPDS total
    features.append(sum(epds_scores))
    
    # Mental health risk index
    mental_risk = (features[7] * 3) + (features[8] * 2) + features[9]  # Depression + anxiety + treatment
    features.append(mental_risk)
    
    # Social support index  
    social_support = features[17] + features[18] + features[19]  # Family + partner + social
    features.append(social_support)
    
    return features  # Total: ~40 features instead of just 1 EPDS sum!


def improved_predict_assessment(payload: AssessmentCreate):
    """
    Improved prediction using ALL assessment data
    """
    
    # Extract comprehensive features (uses all 41 questions)
    features = formdata_to_comprehensive_features(payload)
    
    # Use actual ML model (if available) or improved scoring
    if hasattr(model, 'predict') and len(features) > 10:
        # Use trained ML model
        prediction = model.predict([features])[0]
        probability = model.predict_proba([features])[0]
        pred_score = float(probability[1] * 100)  # Probability of high risk
    else:
        # Improved scoring algorithm using weighted features
        pred_score = calculate_weighted_risk_score(features)
    
    # Determine risk level
    if pred_score < 30:
        risk_level = "Low Risk"
    elif pred_score < 60:
        risk_level = "Moderate Risk"
    else:
        risk_level = "High Risk"
    
    return AssessmentResult(risk_level=risk_level, score=pred_score)


def calculate_weighted_risk_score(features) -> float:
    """
    Calculate risk score using weighted features based on research
    """
    
    score = 0
    
    # EPDS contribution (40% weight) - Most important
    epds_total = features[27]  # EPDS total score
    score += (epds_total / 30) * 40
    
    # Mental health history (25% weight) - Very important
    depression_history = features[7] * 15  # History of depression
    anxiety_history = features[8] * 10     # History of anxiety
    score += depression_history + anxiety_history
    
    # Social support (15% weight) - Important
    social_support_total = features[39]  # Social support index
    score += (1 - (social_support_total / 9)) * 15  # Inverse - low support = high risk
    
    # Life stressors (10% weight)
    financial_stress = features[23] * 3    # Financial stress
    relationship_stress = features[25] * 2  # Relationship stress
    score += financial_stress + relationship_stress
    
    # Current symptoms (10% weight)
    anxiety_level = features[11] * 2       # Current anxiety
    stress_level = features[12] * 2        # Current stress
    sleep_quality = features[10] * 1       # Sleep issues
    score += anxiety_level + stress_level + sleep_quality
    
    # Ensure score is between 0-100
    return min(max(score, 0), 100)