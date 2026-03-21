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

router = APIRouter(prefix="/api/nurse", tags=["nurse"])

@router.get("/dashboard")
def get_nurse_dashboard(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Fetch dashboard stats for nurses"""
    try:
        nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
        if not nurse or nurse.role != "nurse":
            raise HTTPException(status_code=403, detail="Nurse role required")
        
        today = datetime.now().date()
        
        new_patients_today = db.query(models.Patient).filter(
            models.Patient.created_by_nurse_id == nurse.id,
            func.date(models.Patient.created_at) == today
        ).count()
        
        pending_assessments = db.query(models.Assessment).filter(
            models.Assessment.nurse_id == nurse.id,
            models.Assessment.status == "draft"
        ).count()
        
        waiting_review = db.query(models.Assessment).filter(
            models.Assessment.nurse_id == nurse.id,
            models.Assessment.status == "submitted"
        ).count()
        
        total_patients = db.query(models.Patient).filter(models.Patient.created_by_nurse_id == nurse.id).count()
        
        # Get recent patients
        recent_patients_list = db.query(models.Patient).filter(
            models.Patient.created_by_nurse_id == nurse.id
        ).order_by(models.Patient.created_at.desc()).limit(5).all()
        
        return {
            "stats": {
                "new_patients_today": new_patients_today,
                "pending_assessments": pending_assessments,
                "waiting_review": waiting_review,
                "total_patients": total_patients
            },
            "recentPatients": [
                {
                    "id": p.id,
                    "name": p.name,
                    "email": p.email,
                    "phone": p.phone,
                    "pregnancy_week": p.pregnancy_week,
                    "assigned_doctor": p.assigned_doctor_name,
                    "status": "Active" if p.last_assessment_date else "Draft",
                    "created_at": p.created_at.strftime("%Y-%m-%d")
                } for p in recent_patients_list
            ]
        }
    except Exception as e:
        logger.error(f"Error in get_nurse_dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/doctors", response_model=List[schemas.UserOut])
def get_nurse_doctors(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Fetch all doctors for assignment by nurse"""
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")
    
    return db.query(models.User).filter(models.User.role == "doctor").all()

from ..security import hash_password
from ..schemas import UserOut

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_patient(
    payload: dict, # Using dict for flexibility with the frontend payload
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")
    
    # 1. Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == payload['email']).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # 2. Create User account for Patient Portal access
    first_name = payload['fullName'].split(' ')[0]
    last_name = payload['fullName'].split(' ')[1] if ' ' in payload['fullName'] else ""
    
    new_user = models.User(
        first_name=first_name,
        last_name=last_name,
        email=payload['email'],
        phone_number=payload['phone'],
        hashed_password=hash_password(payload['password']),
        role="patient",
        is_active=True,
        first_login=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 3. Create Patient record for Clinical data
    new_patient = models.Patient(
        name=payload['fullName'],
        email=payload['email'],
        phone=payload['phone'],
        dob=datetime.strptime(payload['dob'], '%Y-%m-%d') if payload.get('dob') else None,
        blood_group=payload.get('bloodGroup'),
        pregnancy_week=int(payload['pregnancyWeek']) if payload.get('pregnancyWeek') else None,
        due_date=datetime.strptime(payload['edd'], '%Y-%m-%d') if payload.get('edd') else None,
        clinician_email=current_user_email, # Link to the nurse who registered them
        created_by_nurse_id=nurse.id,
        assigned_doctor_id=payload.get('assignedDoctor'),
        status="active"
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    return {
        "user": UserOut.model_validate(new_user).model_dump(),
        "patient_id": new_patient.id
    }

@router.get("/assessments", response_model=List[schemas.AssessmentSave])
def get_nurse_assessments(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")
    
    return db.query(models.Assessment).filter(models.Assessment.nurse_id == nurse.id).all()

@router.get("/patients", response_model=List[schemas.PatientOut])
def get_nurse_patients(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")
    
    return db.query(models.Patient).filter(models.Patient.created_by_nurse_id == nurse.id).all()

@router.post("/assessments", status_code=status.HTTP_201_CREATED)
def create_nurse_assessment(
    payload: schemas.AssessmentSave,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")
    
    # Use existing logic from assessments.py or similar
    # For now, let's just implement a basic version that links to the nurse
    
    new_assessment = models.Assessment(
        patient_id=payload.patient_id,
        patient_name=payload.patient_name,
        patient_email=payload.patient_email,
        nurse_id=nurse.id,
        assigned_doctor_id=payload.assigned_doctor_id,
        risk_score=payload.risk_score,
        risk_level=payload.risk_level,
        epds_score=payload.epds_score,
        status=payload.status,
        raw_data=payload.raw_data,
        plan=payload.plan,
        is_draft=payload.is_draft
    )
    
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    
    # Update patient's last assessment date
    if payload.patient_id:
        patient = db.query(models.Patient).filter(models.Patient.id == payload.patient_id).first()
        if patient:
            patient.last_assessment_date = datetime.now()
            db.add(patient)
            db.commit()

    return new_assessment
