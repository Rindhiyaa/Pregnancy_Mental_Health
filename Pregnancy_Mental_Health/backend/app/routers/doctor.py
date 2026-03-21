from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email
from sqlalchemy import func
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/doctor", tags=["doctor"])

@router.get("/dashboard")
def get_doctor_dashboard(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Fetch dashboard data for doctors"""
    try:
        doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
        if not doctor or doctor.role != "doctor":
            raise HTTPException(status_code=403, detail="Doctor role required")
        
        # Assessments assigned to this doctor for review
        pending_reviews = db.query(models.Assessment).filter(
            models.Assessment.doctor_id == doctor.id,
            models.Assessment.status == "submitted"
        ).count()
        
        # Risk distribution for doctor's assigned patients
        high_risk = db.query(models.Assessment).filter(
            models.Assessment.assigned_doctor_id == doctor.id,
            models.Assessment.risk_level == "High Risk"
        ).count()
        
        moderate_risk = db.query(models.Assessment).filter(
            models.Assessment.assigned_doctor_id == doctor.id,
            models.Assessment.risk_level == "Moderate Risk"
        ).count()
        
        low_risk = db.query(models.Assessment).filter(
            models.Assessment.assigned_doctor_id == doctor.id,
            models.Assessment.risk_level == "Low Risk"
        ).count()
        
        # Get recent assessments
        recent_assessments = db.query(models.Assessment).filter(
            models.Assessment.assigned_doctor_id == doctor.id
        ).order_by(models.Assessment.created_at.desc()).limit(10).all()
        
        return {
            "stats": {
                "total": high_risk + moderate_risk + low_risk,
                "high": high_risk,
                "moderate": moderate_risk,
                "low": low_risk,
                "pending": pending_reviews
            },
            "recentAssessments": [
                {
                    "id": a.id,
                    "patient_name": a.patient_name,
                    "patient_email": a.patient_email,
                    "risk_level": a.risk_level,
                    "status": a.status,
                    "date": a.created_at.strftime("%Y-%m-%d")
                } for a in recent_assessments
            ]
        }
    except Exception as e:
        logger.error(f"Error in get_doctor_dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assessments/{id}", response_model=schemas.AssessmentSave)
def get_doctor_assessment(
    id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")
    
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == id,
        models.Assessment.doctor_id == doctor.id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found or not assigned to you")
    
    return assessment

@router.put("/assessments/{id}/review")
def review_doctor_assessment(
    id: int,
    payload: schemas.AssessmentReview,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")
    
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == id,
        models.Assessment.doctor_id == doctor.id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found or not assigned to you")
    
    assessment.risk_level_final = payload.risk_level_final
    assessment.override_reason = payload.override_reason
    assessment.plan = payload.plan
    assessment.notes = payload.notes
    assessment.status = payload.status
    assessment.overridden_by = doctor.id
    assessment.reviewed_at = datetime.now()
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return assessment

@router.get("/assessments", response_model=List[schemas.AssessmentSave])
def get_doctor_assessments(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")
    
    query = db.query(models.Assessment).filter(models.Assessment.doctor_id == doctor.id)
    if status:
        query = query.filter(models.Assessment.status == status)
        
    return query.all()

@router.get("/patients", response_model=List[schemas.PatientOut])
def get_doctor_patients(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")
    
    return db.query(models.Patient).filter(models.Patient.assigned_doctor_id == doctor.id).all()

@router.post("/patients", status_code=status.HTTP_201_CREATED)
def create_doctor_patient(
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")
    
    new_patient = models.Patient(
        name=payload['name'],
        email=payload['email'],
        age=payload.get('age'),
        phone=payload.get('phone'),
        clinician_email=current_user_email,
        assigned_doctor_id=doctor.id,
        status="active"
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient

@router.put("/patients/{id}")
def update_doctor_patient(
    id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")
    
    patient = db.query(models.Patient).filter(
        models.Patient.id == id,
        models.Patient.assigned_doctor_id == doctor.id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or not assigned to you")
    
    patient.name = payload.get('name', patient.name)
    patient.email = payload.get('email', patient.email)
    patient.age = payload.get('age', patient.age)
    patient.phone = payload.get('phone', patient.phone)
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/patients/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor_patient(
    id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    doctor = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=403, detail="Doctor role required")
    
    patient = db.query(models.Patient).filter(
        models.Patient.id == id,
        models.Patient.assigned_doctor_id == doctor.id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or not assigned to you")
    
    db.delete(patient)
    db.commit()
    return
