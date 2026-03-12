from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Patient
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
    
    # Create new patient
    db_patient = Patient(
        name=patient_data.name,
        age=patient_data.age,
        phone=patient_data.phone,
        clinician_email=current_user_email
    )
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
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
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Update a patient"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinician_email == current_user_email
    ).first()
    
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )
    
    # Update fields if provided
    if patient_data.name is not None:
        # Check for duplicate names
        existing_patient = db.query(Patient).filter(
            Patient.name == patient_data.name,
            Patient.clinician_email == current_user_email,
            Patient.id != patient_id
        ).first()
        
        if existing_patient:
            raise HTTPException(
                status_code=400,
                detail=f"Patient with name '{patient_data.name}' already exists"
            )
        
        patient.name = patient_data.name
    
    if patient_data.age is not None:
        patient.age = patient_data.age
    
    if patient_data.phone is not None:
        patient.phone = patient_data.phone
    
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
    
    db.delete(patient)
    db.commit()
    
    return {"message": f"Patient '{patient.name}' deleted successfully"}