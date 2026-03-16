from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Patient, Assessment
from ..schemas import PatientCreate, PatientOut, PatientUpdate
from ..jwt_handler import get_current_user_email

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.get("/", response_model=List[PatientOut])
def get_patients(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Get all patients for the current clinician"""
    patients = db.query(Patient).filter(
        Patient.clinician_email == current_user_email
    ).order_by(Patient.created_at.desc()).all()
    
    return patients


@router.post("/", response_model=PatientOut)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Create a new patient"""
    # Check if patient with same name already exists for this clinician
    existing_patient = db.query(Patient).filter(
        Patient.name == patient_data.name,
        Patient.clinician_email == current_user_email
    ).first()
    
    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail=f"Patient with name '{patient_data.name}' already exists"
        )
    
    # Create new patientt
    db_patient = Patient(
        name=patient_data.name,
        age=patient_data.age,
        phone=patient_data.phone,
        email=patient_data.email,
        clinician_email=current_user_email
    )
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)

    # --- START: Trigger New Patient Notification ---
    try:
        from .. import models
        new_patient_notif = models.Notification(
            title="👤 New Patient Added",
            message=f"A new patient record for {db_patient.name} has been created.",
            type="info",
            priority="low",
            clinician_email=current_user_email,
            is_read=False
        )
        db.add(new_patient_notif)
        db.commit()
    except Exception as e:
        print(f"Failed to create new patient notification: {e}")
    # --- END: Trigger New Patient Notification ---
    
    return db_patient


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Get a specific patient by ID"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinician_email == current_user_email
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )
    
    return patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Update a patient"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinician_email == current_user_email
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Update fields
    for key, value in patient_update.dict(exclude_unset=True).items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Delete a patient"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinician_email == current_user_email
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )
    
    # Manually delete all assessments linked to this patient for data integrity
    db.query(Assessment).filter(Assessment.patient_id == patient_id).delete()
    
    db.delete(patient)
    db.commit()
    
    return {"message": "Patient and all related data deleted successfully"}