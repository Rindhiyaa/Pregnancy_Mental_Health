from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AssessmentCreate, AssessmentResult
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


@router.post("/assessments", response_model=AssessmentResult)
def create_assessment(payload: AssessmentCreate, db: Session = Depends(get_db)):
    epds_total = formdata_to_features(payload)

    # Example rule-based score 0–100 from EPDS 0–30
    pred_score = min(max(epds_total / 30 * 100, 0), 100)

    if pred_score < 33:
        risk_level = "Low Risk"
    elif pred_score < 66:
        risk_level = "Moderate Risk"
    else:
        risk_level = "High Risk"

    assessment = models.Assessment(
        patient_name=payload.patient_name,
        raw_data=payload.model_dump(),
        risk_score=pred_score,
        risk_level=risk_level,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return AssessmentResult(risk_level=risk_level, score=pred_score)
