from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..schemas import AssessmentCreate, AssessmentResult, AssessmentSave
from ..ml_model import model
from .. import models

router = APIRouter(prefix="/api", tags=["assessments"])

def formdata_to_features(data: AssessmentCreate) -> list:
    """
    Convert 47 prenatal assessment questions to ML model features
    Predicts postpartum depression risk from prenatal data
    """
    features = []
    
    # Section 1: Demographics (7 features)
    features.append(data.age or 25)
    
    residence_map = {"City": 1, "Village": 0}
    features.append(residence_map.get(data.residence, 1))
    
    education_map = {"University": 4, "College": 3, "High School": 2, "Primary School": 1}
    features.append(education_map.get(data.education_level, 2))
    
    marital_map = {"Married": 1, "Divorced": 0}
    features.append(marital_map.get(data.marital_status, 1))
    
    partner_edu_map = {"University": 4, "College": 3, "High School": 2, "Primary School": 1}
    features.append(partner_edu_map.get(data.partner_education, 2))
    
    income_map = {"5000-10000": 1, "10000-20000": 2, "20000-30000": 3, ">30000": 4}
    features.append(income_map.get(data.partner_income, 2))
    
    household_map = {"2 to 5": 1, "6 to 8": 2, "9 or more": 3}
    features.append(household_map.get(data.household_members, 1))
    
    # Section 2: Relationships & Support (6 features)
    relationship_map = {"Good": 4, "Neutral": 3, "Friendly": 4, "Bad": 1, "Poor": 0}
    features.append(relationship_map.get(data.relationship_inlaws, 3))
    features.append(relationship_map.get(data.relationship_husband, 4))
    
    support_map = {"High": 2, "Medium": 1, "Low": 0}
    features.append(support_map.get(data.support_during_pregnancy, 1))
    features.append(support_map.get(data.need_more_support, 1))
    
    yes_no_map = {"Yes": 1, "No": 0}
    features.append(yes_no_map.get(data.major_changes_losses, 0))
    features.append(yes_no_map.get(data.trust_share_feelings, 1))
    
    # Section 3: Pregnancy History (6 features)
    children_map = {"One": 1, "Two": 2, "More than two": 3}
    features.append(children_map.get(data.total_children_now, 1))
    
    pregnancy_num_map = {"1": 1, "2": 2, "3": 3, "4": 4}
    features.append(int(data.pregnancy_number or 1))
    
    length_map = {"Less than 5m": 1, "6m": 2, "7m": 3, "8m": 4, "9m": 5, "10m": 6}
    features.append(length_map.get(data.pregnancy_length, 5))
    
    features.append(yes_no_map.get(data.pregnancy_planned, 1))
    features.append(yes_no_map.get(data.regular_checkups, 1))
    
    medical_map = {"Chronic": 2, "Non-Chronic": 1, "None": 0}
    features.append(medical_map.get(data.medical_conditions_pregnancy, 0))
    
    # Section 4: Mental Health History (6 features)
    pos_neg_map = {"Positive": 1, "Negative": 0}
    features.append(pos_neg_map.get(data.depression_before_pregnancy, 0))
    features.append(pos_neg_map.get(data.depression_during_pregnancy, 0))
    
    features.append(yes_no_map.get(data.fear_pregnancy_childbirth, 0))
    features.append(yes_no_map.get(data.major_life_changes_pregnancy, 0))
    features.append(yes_no_map.get(data.abuse_during_pregnancy, 0))
    
    family_map = {"Nuclear": 1, "Joint": 0}
    features.append(family_map.get(data.family_type, 1))
    
    # Section 5: Current Mental State (6 features)
    mood_map = {"Happy": 0, "Neutral": 1, "Sad": 2}
    features.append(mood_map.get(data.feeling_about_motherhood, 0))
    
    features.append(yes_no_map.get(data.angry_irritable_since_pregnancy, 0))
    
    activities_map = {"Worried": 2, "Tired": 1, "Afraid": 3}
    features.append(activities_map.get(data.feeling_daily_activities, 1))
    
    sleep_map = {"Good": 0, "Fair": 1, "Poor": 2}
    features.append(sleep_map.get(data.sleep_quality_since_pregnancy, 1))
    
    level_map = {"Low": 0, "Medium": 1, "High": 2}
    features.append(level_map.get(data.anxiety_level_now, 0))
    features.append(level_map.get(data.stress_level_now, 0))
    
    # Section 6: EPDS Individual Scores (10 features)
    epds_scores = [
        data.epds_1 or 0, data.epds_2 or 0, data.epds_3 or 0, data.epds_4 or 0,
        data.epds_5 or 0, data.epds_6 or 0, data.epds_7 or 0, data.epds_8 or 0,
        data.epds_9 or 0, data.epds_10 or 0
    ]
    features.extend(epds_scores)
    
    print(f"🔧 47-QUESTION PRENATAL FEATURES ({len(features)} features): {features[:15]}... (showing first 15)")
    print(f"📊 EPDS Scores: {epds_scores} (Total: {sum(epds_scores)})")
    return features

@router.post("/assessments/predict", response_model=AssessmentResult)
def predict_assessment(payload: AssessmentCreate):
    # Extract the 10 features the model expects
    features = formdata_to_features(payload)
    
    try:
        # Use ONLY the CatBoost ML model - NO MANUAL OVERRIDES
        prediction = model.predict([features])[0]
        probabilities = model.predict_proba([features])[0]
        
        print(f" PURE ML MODEL OUTPUT:")
        print(f"   - Prediction class: {prediction}")
        print(f"   - All probabilities: {probabilities}")
        
        # Convert 6-class model to 3-class system
        low_prob = probabilities[0] + probabilities[1]      # Classes 0,1
        moderate_prob = probabilities[2] + probabilities[3]  # Classes 2,3  
        high_prob = probabilities[4] + probabilities[5]      # Classes 4,5
        
        print(f"ML Model Classification:")
        print(f"   - Low Risk: {low_prob:.3f} ({low_prob*100:.1f}%)")
        print(f"   - Moderate Risk: {moderate_prob:.3f} ({moderate_prob*100:.1f}%)")
        print(f"   - High Risk: {high_prob:.3f} ({high_prob*100:.1f}%)")
        
        # Use ONLY ML model decision - no manual overrides
        max_prob = max(low_prob, moderate_prob, high_prob)
        
        if max_prob == high_prob:
            risk_level = "High Risk"
            pred_score = 70 + (high_prob * 30)  # Score between 70-100
        elif max_prob == moderate_prob:
            risk_level = "Moderate Risk"
            pred_score = 40 + (moderate_prob * 30)  # Score between 40-70
        else:
            risk_level = "Low Risk"
            pred_score = low_prob * 40  # Score between 0-40
        
        print(f"✅ PURE ML RESULT: {risk_level} (Score: {pred_score:.1f})")
        
    except Exception as e:
        print(f"❌ ML Model failed: {e}")
        print(f"📊 Features provided: {len(features)} features")
        
        # Fallback to weighted calculation only if ML model fails
        pred_score = calculate_weighted_risk_score(features)
        
        if pred_score < 30:
            risk_level = "Low Risk"
        elif pred_score < 60:
            risk_level = "Moderate Risk"
        else:
            risk_level = "High Risk"
            
        print(f"🔄 Fallback calculation: {risk_level} (Score: {pred_score})")

    return AssessmentResult(risk_level=risk_level, score=pred_score)

def calculate_weighted_risk_score(features) -> float:
    """
    Fallback calculation using weighted features based on research
    """
    score = 0
    
    # Relationship factors (30% weight)
    relationship_score = (features[1] + features[4]) / 8 * 30  # Husband + in-laws
    score += relationship_score
    
    # Support factors (25% weight)
    support_score = features[2] / 2 * 25  # Support received
    score += support_score
    
    # Mental health factors (25% weight)
    mental_score = (features[6] + features[9]) / 5 * 25  # Anger + depression
    score += mental_score
    
    # Age factor (10% weight)
    age_risk = 1 if features[3] < 20 or features[3] > 35 else 0
    score += age_risk * 10
    
    # Newborn bonding (10% weight)
    bonding_score = (4 - features[5]) / 4 * 10  # Inverted worry
    score += bonding_score
    
    return min(max(score, 0), 100)

@router.post("/assessments")
def save_assessment(payload: AssessmentSave, db: Session = Depends(get_db)):
    assessment = models.Assessment(
        patient_name=payload.patient_name,
        raw_data=payload.raw_data,
        risk_score=payload.score,
        risk_level=payload.risk_level,
        clinician_risk=payload.clinician_risk,
        plan=payload.plan,
        notes=payload.notes,
        clinician_email=payload.clinician_email,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    created_at = getattr(assessment, "created_at", None)
    timestamp = created_at.isoformat() if created_at else None
    date_str = created_at.date().isoformat() if created_at else None

    return {
        "id": assessment.id,
        "patient_name": assessment.patient_name,
        "date": date_str,
        "timestamp": timestamp,
        "risk_level": assessment.risk_level,
        "score": assessment.risk_score,
        "clinician_risk": assessment.clinician_risk,
        "plan": assessment.plan,
        "notes": assessment.notes,
        "clinician_email": assessment.clinician_email,
    }

@router.get("/assessments")
def list_assessments(
    clinician_email: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Assessment)
    if clinician_email:
        query = query.filter(models.Assessment.clinician_email == clinician_email)

    records = query.order_by(models.Assessment.created_at.desc()).all()

    return [
        {
            "id": a.id,
            "patient_name": a.patient_name,
            "date": a.created_at.date().isoformat(),
            "timestamp": a.created_at.isoformat(),
            "risk_level": a.risk_level,
            "score": a.risk_score,
            "clinician_risk": a.clinician_risk,
            "plan": a.plan,
            "notes": a.notes,
            "clinician_email": a.clinician_email,
        }
        for a in records
    ]

@router.delete("/assessments/clear", status_code=status.HTTP_204_NO_CONTENT)
def clear_assessments_for_clinician(
    clinician_email: str = Query(...),
    db: Session = Depends(get_db),
):
    deleted = (
        db.query(models.Assessment)
        .filter(models.Assessment.clinician_email == clinician_email)
        .delete(synchronize_session=False)
    )

    db.commit()
    return

@router.delete("/assessments/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
):
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == assessment_id
    ).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found!!!")   

    db.delete(assessment)
    db.commit()
    return