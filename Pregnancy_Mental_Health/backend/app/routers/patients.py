from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from ..database import get_db
from ..models import Patient, Assessment
from ..schemas import PatientCreate, PatientOut, PatientUpdate
from ..jwt_handler import get_current_user_email

router = APIRouter(prefix="/api/patients", tags=["patients"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[PatientOut])
@router.get("", response_model=List[PatientOut])
def get_patients(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    """Get all patients for the current clinician"""
    try:
        # Check if user is nurse
        from .. import models
        current_user = db.query(models.User).filter(models.User.email == current_user_email).first()
        
        if current_user and current_user.role == "nurse":
            # Nurses see patients they created
            patients = db.query(Patient).filter(
                Patient.created_by_nurse_id == current_user.id
            ).order_by(Patient.created_at.desc()).all()
        else:
            # Doctors see patients assigned to them OR they created
            patients = db.query(Patient).filter(
                (Patient.clinician_email == current_user_email) | 
                (Patient.assigned_doctor_id == (current_user.id if current_user else None))
            ).order_by(Patient.created_at.desc()).all()
        
        return patients
    except Exception as e:
        logger.error(f"Error fetching patients: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=PatientOut)
@router.post("", response_model=PatientOut)
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
    # Get current user to check role
    from .. import models
    current_user = db.query(models.User).filter(models.User.email == current_user_email).first()
    
    db_patient = Patient(
        name=patient_data.name,
        age=patient_data.age,
        phone=patient_data.phone,
        email=patient_data.email,
        dob=patient_data.dob,
        blood_group=patient_data.blood_group,
        address=patient_data.address,
        city=patient_data.city,
        emergency_name=patient_data.emergency_name,
        emergency_phone=patient_data.emergency_phone,
        emergency_relation=patient_data.emergency_relation,
        pregnancy_week=patient_data.pregnancy_week,
        due_date=patient_data.due_date,
        gravida=patient_data.gravida,
        para=patient_data.para,
        clinician_email=current_user_email,
        created_by_nurse_id=current_user.id if current_user and current_user.role == "nurse" else None,
        status="active"
    )
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)

    # --- START: Auto-Create User Account for Patient ---
    try:
        # Generate temporary password: Patient@123 (or custom)
        # Use the format from the user input for consistency: Patient@123
        default_password = "Patient@123"
        from ..security import hash_password
        
        # Check if user already exists by email or phone
        existing_user = None
        if db_patient.email:
            existing_user = db.query(models.User).filter(models.User.email == db_patient.email).first()
        
        if not existing_user and db_patient.phone:
            existing_user = db.query(models.User).filter(models.User.phone_number == db_patient.phone).first()

        if not existing_user:
            new_user = models.User(
                first_name=db_patient.name.split(' ')[0],
                last_name=db_patient.name.split(' ')[1] if len(db_patient.name.split(' ')) > 1 else "",
                email=db_patient.email or f"patient_{db_patient.id}@hospital.com",
                phone_number=db_patient.phone,
                hashed_password=hash_password(default_password),
                role="patient",
                first_login=True
            )
            db.add(new_user)
            db.commit()
            logger.info(f"Created user account for patient {db_patient.name}")
    except Exception as e:
        logger.error(f"Failed to create user account for patient: {e}")
    # --- END: Auto-Create User Account for Patient ---

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