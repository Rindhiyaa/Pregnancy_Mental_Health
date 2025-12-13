from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..auth import get_current_user, require_roles
from ..models import Assessment, User, Role, AuditLog
from ..schemas import PredictRequest, PredictResponse, AssessmentRead
from ..ml.model import model_service
from ..database import get_session

router = APIRouter(prefix="/api", tags=["assessments"])


@router.post("/predict", response_model=PredictResponse)
def predict(body: PredictRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    features = body.model_dump()
    patient_code = features.pop("patient_code") or "anon"
    result = model_service.predict(features)
    assessment = Assessment(
        user_id=user.id,
        patient_code=patient_code,
        features=features,
        probability=result["probability"],
        label=result["label"],
        model_version=result["model_version"],
    )
    session.add(assessment)
    session.add(
        AuditLog(
            user_id=user.id,
            action="predict",
            meta={"model_version": result["model_version"], "label": result["label"], "probability": result["probability"]},
        )
    )
    session.commit()
    session.refresh(assessment)
    return {
        "id": assessment.id,
        "probability": assessment.probability,
        "label": assessment.label,
        "model_version": assessment.model_version,
        "top_features": result["top_features"],
        "created_at": assessment.created_at,
    }


@router.get("/assessments", response_model=List[AssessmentRead])
def list_assessments(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    query = select(Assessment)
    if user.role == Role.patient:
        query = query.where(Assessment.patient_code == user.email)
    assessments = session.exec(query.order_by(Assessment.created_at.desc()).limit(50)).all()
    return assessments


@router.get("/assessments/{assessment_id}", response_model=PredictResponse)
def get_assessment(
    assessment_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    assessment = session.get(Assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == Role.patient and assessment.patient_code != user.email:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {
        "id": assessment.id,
        "probability": assessment.probability,
        "label": assessment.label,
        "model_version": assessment.model_version,
        "top_features": [{"feature": k, "direction": "positive", "magnitude": 0.1, "label": k} for k in assessment.features.keys()],
        "created_at": assessment.created_at,
    }


