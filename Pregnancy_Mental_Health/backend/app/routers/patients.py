from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from ..database import get_db
from .. import models
from ..models import Patient, Assessment
from ..schemas import PatientCreate, PatientOut, PatientUpdate
from ..jwt_handler import get_current_user_email

router = APIRouter(prefix="/patients", tags=["patients"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[PatientOut])
def get_patients(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    """
    Get all patients for the current clinician (doctor or nurse).
    Nurses see patients they created; doctors see patients assigned to them or with their clinician_email.
    """
    try:
        current_user = (
            db.query(models.User)
            .filter(models.User.email == current_user_email)
            .first()
        )

        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

        if current_user.role == "nurse":
            patients = (
                db.query(Patient)
                .filter(Patient.created_by_nurse_id == current_user.id)
                .order_by(Patient.created_at.desc())
                .all()
            )
        else:
            patients = (
                db.query(Patient)
                .filter(
                    (Patient.clinician_email == current_user_email)
                    | (Patient.assigned_doctor_id == current_user.id)
                )
                .order_by(Patient.created_at.desc())
                .all()
            )

        return patients
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching patients: {e}")
        raise HTTPException(status_code=500, detail="Error fetching patients")


@router.post("/", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    """
    Create a new patient record for the current clinician.
    Does NOT auto-create a User account anymore; that is handled by admin/nurse routes.
    """
    current_user = (
        db.query(models.User)
        .filter(models.User.email == current_user_email)
        .first()
    )
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_patient = (
        db.query(Patient)
        .filter(
            Patient.name == patient_data.name,
            Patient.clinician_email == current_user_email,
        )
        .first()
    )
    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail=f"Patient with name '{patient_data.name}' already exists",
        )

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
        created_by_nurse_id=current_user.id if current_user.role == "nurse" else None,
        status="active",
    )

    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)

    # Optional: notification to clinician
    try:
        new_patient_notif = models.Notification(
            title="👤 New Patient Added",
            message=f"A new patient record for {db_patient.name} has been created.",
            type="info",
            priority="low",
            clinician_email=current_user_email,
            is_read=False,
        )
        db.add(new_patient_notif)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to create new patient notification: {e}")

    return db_patient


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    """
    Get a specific patient by ID belonging to the current clinician.
    """
    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id,
            Patient.clinician_email == current_user_email,
        )
        .first()
    )

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    """
    Update a patient record owned by the current clinician.
    """
    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id,
            Patient.clinician_email == current_user_email,
        )
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    for key, value in patient_update.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    """
    Delete a patient and all related assessments for the current clinician.
    """
    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id,
            Patient.clinician_email == current_user_email,
        )
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.query(Assessment).filter(Assessment.patient_id == patient_id).delete()
    db.delete(patient)
    db.commit()

    return {"message": "Patient and all related data deleted successfully"}
