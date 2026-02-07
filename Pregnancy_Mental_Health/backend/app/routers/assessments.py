from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd
from typing import List, Optional

from ..database import get_db
from ..schemas import AssessmentCreate, AssessmentResult, AssessmentSave
from ..ml_model import model, feature_columns, build_model_input_from_form
from .. import models

router = APIRouter(prefix="/api", tags=["assessments"])


@router.post("/assessments/predict", response_model=AssessmentResult)
def predict_assessment(payload: AssessmentCreate):
    # 1) Build 1-row dataframe with same raw columns as training
    df_input = build_model_input_from_form(payload)  # DataFrame with 26 cols

    # 2) One-hot encode exactly like during training
    X_encoded = pd.get_dummies(df_input, drop_first=False)

    # 3) Align columns with training feature_columns (fill missing with 0)
    X_aligned = X_encoded.reindex(columns=feature_columns, fill_value=0)

    try:
        # 4) Predict EPDS Result class and probabilities
        # Classes: assume CatBoost was trained with target ["High", "Medium", "Low"]
        pred_class = model.predict(X_aligned)[0]
        proba = model.predict_proba(X_aligned)[0]

        # Map class probabilities to Low/Moderate/High risk for UI
        # Adjust class order according to model.classes_
        cat_classes = list(model.classes_)  # e.g. ['High', 'Low', 'Medium']

        class_to_prob = {cls: p for cls, p in zip(cat_classes, proba)}
        high_prob = class_to_prob.get("High", 0.0)
        med_prob = class_to_prob.get("Medium", 0.0)
        low_prob = class_to_prob.get("Low", 0.0)

        # Pick max-probability risk level
        if high_prob >= med_prob and high_prob >= low_prob:
            risk_level = "High Risk"
            pred_score = 70 + high_prob * 30
        elif med_prob >= low_prob:
            risk_level = "Moderate Risk"
            pred_score = 40 + med_prob * 30
        else:
            risk_level = "Low Risk"
            pred_score = low_prob * 40

        print("CatBoost EPDS prediction:")
        print(f"  classes: {cat_classes}")
        print(f"  probs: {proba}")
        print(f"  risk_level: {risk_level}, score: {pred_score:.1f}")

    except Exception as e:
        # If something breaks, return a safe error
        print(f"❌ ML Model failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Model prediction failed. Please contact admin."
        )

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