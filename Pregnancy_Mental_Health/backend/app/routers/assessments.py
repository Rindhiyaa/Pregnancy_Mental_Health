from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..schemas import AssessmentCreate, AssessmentResult, AssessmentSave
from ..ml_model import model
from .. import models

router = APIRouter(prefix="/api", tags=["assessments"])

def formdata_to_features(data: AssessmentCreate) -> float:
    epds_scores = [
        data.epds_1 or 0, data.epds_2 or 0, data.epds_3 or 0, data.epds_4 or 0,
        data.epds_5 or 0, data.epds_6 or 0, data.epds_7 or 0, data.epds_8 or 0,
        data.epds_9 or 0, data.epds_10 or 0,
    ]
    return sum(epds_scores)

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


@router.post("/assessments/predict", response_model=AssessmentResult)
def predict_assessment(payload: AssessmentCreate):
    epds_total = formdata_to_features(payload)

    pred_score = min(max(epds_total / 30 * 100, 0), 100)

    if pred_score < 33:
        risk_level = "Low Risk"
    elif pred_score < 66:
        risk_level = "Moderate Risk"
    else:
        risk_level = "High Risk"

    return AssessmentResult(risk_level=risk_level, score=pred_score)


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



