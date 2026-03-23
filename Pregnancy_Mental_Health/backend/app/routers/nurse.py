from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional, List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email
from ..security import hash_password
from sqlalchemy.exc import IntegrityError
# from ..audit import log_admin_action  # Assuming you have this from admin panel
import logging


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nurse", tags=["nurse"])

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
        

        recentPatients = []
        for p in recent_patients_list:
            doctor_name = None
            if p.assigned_doctor_id:
                doctor = (
                    db.query(models.User)
                    .filter(models.User.id == p.assigned_doctor_id)
                    .first()
                )
                if doctor:
                    doctor_name = f"{doctor.first_name} {doctor.last_name}".strip()

            recentPatients.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "email": p.email,
                    "phone": p.phone,
                    "pregnancy_week": p.pregnancy_week,
                    "assigned_doctor": doctor_name,
                    # Simple status for now; adjust later as needed
                    "status": "Active",
                    "created_at": p.created_at.strftime("%Y-%m-%d"),
                }
            )

        return {
            "stats": {
                "new_patients_today": new_patients_today,
                "pending_assessments": pending_assessments,
                "waiting_review": waiting_review,
                "total_patients": total_patients,
            },
            "recentPatients": recentPatients,
        }
    except Exception as e:
        logger.error(f"Error in get_nurse_dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/doctors")
def get_nurse_doctors(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    # All doctors
    doctors = (
        db.query(models.User)
        .filter(models.User.role == "doctor")
        .all()
    )

    # Count patients per doctor_id, using the patients table
    counts = dict(
        db.query(models.Patient.doctor_id, func.count(models.Patient.id))
        .group_by(models.Patient.doctor_id)
        .all()
    )

    result = []
    for d in doctors:
        full_name = f"{d.first_name or ''} {d.last_name or ''}".strip() or d.email
        result.append(
            {
                "id": d.id,
                "first_name": d.first_name,
                "last_name": d.last_name,
                "fullName": full_name,
                "email": d.email,
                "specialization": getattr(d, "specialization", None),
                "active_patients": counts.get(d.id, 0),
            }
        )
    return result


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_patient(
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    # 1) Basic validation
    required = ["fullName", "email", "phone", "password"]
    missing = [f for f in required if not payload.get(f)]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {', '.join(missing)}"
        )

    # 2) Check if user already exists (software-level)
    existing_user = (
        db.query(models.User)
        .filter(models.User.email == payload["email"])
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    try:
        # 3) Create User
        name_parts = payload["fullName"].strip().split(" ", 1)
        first_name = name_parts
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        new_user = models.User(
            first_name=first_name,
            last_name=last_name,
            email=payload["email"],
            phone_number=payload["phone"],
            hashed_password=hash_password(payload["password"]),
            role="patient",
            is_active=True,
            first_login=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # 4) Build patient data safely against your actual model
        patient_data = {
            "name": payload["fullName"],
            "email": payload["email"],
            "phone": payload["phone"],
            "clinician_email": current_user_email,
            "created_by_nurse_id": nurse.id,
            "assigned_doctor_id": payload.get("assignedDoctor"),
            "status": "active",
        }

        if payload.get("dob"):
            patient_data["dob"] = datetime.strptime(
                payload["dob"], "%Y-%m-%d"
            )
        if payload.get("age"):
            patient_data["age"] = int(payload["age"])
        if payload.get("bloodGroup"):
            patient_data["blood_group"] = payload["bloodGroup"]
        if payload.get("pregnancyWeek"):
            patient_data["pregnancy_week"] = int(payload["pregnancyWeek"])
        if payload.get("previousPregnancies"):
            patient_data["previous_pregnancies"] = int(
                payload["previousPregnancies"]
            )
        if payload.get("hospitalName"):
            # only add if this column exists in models.Patient
            patient_data["hospital_name"] = payload["hospitalName"]
        if payload.get("wardBed"):
            patient_data["ward_bed"] = payload["wardBed"]

        new_patient = models.Patient(**patient_data)
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)

        logger.info(
            f"Nurse {nurse.email} created patient user_id={new_user.id} patient_id={new_patient.id}"
        )

        return {
            "success": True,
            "message": "Patient registered successfully",
            "user_id": new_user.id,
            "patient_id": new_patient.id,
        }

    except IntegrityError:
        db.rollback()
        # DB-level unique email violation fallback
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    except ValueError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid date or numeric field")
    except Exception as e:
        db.rollback()
        logger.exception("Error registering patient")
        raise HTTPException(status_code=500, detail="Registration failed")
    

@router.get("/assessments", response_model=List[schemas.NurseAssessmentOut])
def get_nurse_assessments(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    assessments = (
        db.query(models.Assessment)
        .filter(models.Assessment.nurse_id == nurse.id)
        .order_by(models.Assessment.created_at.desc())
        .all()
    )

    results: list[schemas.NurseAssessmentOut] = []
    for a in assessments:
        doctor_name = None
        if a.doctor_id:
            doc = db.query(models.User).filter(models.User.id == a.doctor_id).first()
            if doc:
                doctor_name = f"{doc.first_name or ''} {doc.last_name or ''}".strip() or doc.email

        results.append(
            schemas.NurseAssessmentOut(
                id=a.id,
                patient_id=a.patient_id,
                patient_name=a.patient_name,
                created_at=a.created_at,
                status=a.status,
                risk_level=a.risk_level,
                risk_score=a.risk_score,
                doctor_id=a.doctor_id,
                assigned_doctor=doctor_name,
            )
        )

    return results

@router.get("/patients")
def get_nurse_patients(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    patients = db.query(models.Patient).all()

    result = []
    for p in patients:
        doctor_name = None
        if p.doctor_id:
            doc = db.query(models.User).filter(models.User.id == p.doctor_id).first()
            if doc:
                doctor_name = f"{doc.first_name} {doc.last_name or ''}".strip()

        result.append(
            {
                "id": p.id,
                "name": p.name,
                "phone": p.phone,
                "pregnancy_week": p.pregnancy_week,
                "status": p.status,
                "doctor_id": p.doctor_id,
                "assigned_doctor": doctor_name,
            }
        )
    return result

@router.get("/patients/{patient_id}", response_model=schemas.PatientOut)
def get_nurse_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    # For now, relax nurse filter so details always load if patient exists
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.id == patient_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient

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
        doctor_id=payload.assigned_doctor_id,
        risk_score=payload.risk_score or 0.0,
        risk_level=payload.risk_level,
        status=payload.status,
        raw_data=payload.raw_data,
        plan=payload.plan,
    )

    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)

    # Link patient to this doctor
    if payload.patient_id:
        patient = (
            db.query(models.Patient)
            .filter(models.Patient.id == payload.patient_id)
            .first()
        )
        if patient:
            patient.doctor_id = payload.assigned_doctor_id   # make sure this column exists
            db.add(patient)
            db.commit()

    return new_assessment

@router.delete("/assessments/{assessment_id}", status_code=204)
def delete_nurse_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    assessment = (
        db.query(models.Assessment)
        .filter(
            models.Assessment.id == assessment_id,
            models.Assessment.nurse_id == nurse.id,  # only own assessments
        )
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    db.delete(assessment)
    db.commit()
