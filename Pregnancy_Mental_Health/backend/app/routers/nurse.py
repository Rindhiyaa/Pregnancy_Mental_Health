from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional, List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email, get_current_user
from ..config import DEFAULT_USER_PASSWORD
from ..security import hash_password
from sqlalchemy.exc import IntegrityError
# from ..audit import log_admin_action  # Assuming you have this from admin panel
import logging


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nurse", tags=["nurse"])

@router.get("/dashboard")
def get_nurse_dashboard(
    db: Session = Depends(get_db),
    nurse: models.User = Depends(get_current_user)
):
    """Fetch dashboard stats for nurses"""
    try:
        if nurse.role != "nurse":
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

    # Required fields (no password now, we force TempPass123!)
    required = ["fullName", "email", "phone"]
    missing = [f for f in required if not payload.get(f)]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {', '.join(missing)}"
        )

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
        # --- Create User with fixed temp password ---
        name_parts = payload["fullName"].strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        TEMP_PASSWORD = DEFAULT_USER_PASSWORD

        new_user = models.User(
            first_name=first_name,
            last_name=last_name,
            email=payload["email"],
            phone_number=payload["phone"],
            hashed_password=hash_password(TEMP_PASSWORD),
            role="patient",
            is_active=True,
            first_login=True,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # --- Build patient_data (this MUST exist before creating Patient) ---
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
            patient_data["dob"] = datetime.strptime(payload["dob"], "%Y-%m-%d")
        if payload.get("age"):
            patient_data["age"] = int(payload["age"])
        if payload.get("bloodGroup"):
            patient_data["blood_group"] = payload["bloodGroup"]
        if payload.get("pregnancyWeek"):
            patient_data["pregnancy_week"] = int(payload["pregnancyWeek"])
        if payload.get("address"):
            patient_data["address"] = payload["address"]
        if payload.get("city"):
            patient_data["city"] = payload["city"]
        if payload.get("previousPregnancies"):
            patient_data["previous_pregnancies"] = int(payload["previousPregnancies"])
        if payload.get("hospitalName"):
            patient_data["hospital_name"] = payload["hospitalName"]
        if payload.get("wardBed"):
            patient_data["ward_bed"] = payload["wardBed"]

        # Now patient_data is definitely defined here
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
    

@router.get("/assessments")
def get_nurse_assessments(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = (
        db.query(models.User)
        .filter(models.User.email == current_user_email)
        .first()
    )
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    assessments = (
        db.query(models.Assessment)
        .filter(models.Assessment.nurse_id == nurse.id)
        .order_by(models.Assessment.created_at.desc())
        .all()
    )

    results = []
    for a in assessments:
        doctor_name = None
        if a.assigned_doctor_id:
            doc = (
                db.query(models.User)
                .filter(models.User.id == a.assigned_doctor_id)
                .first()
            )
            if doc:
                doctor_name = (
                    f"{doc.first_name or ''} {doc.last_name or ''}".strip()
                    or doc.email
                )

        results.append(
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "patient_name": a.patient_name,
                "risk_level": a.risk_level,
                "status": a.status,
                "created_at": a.created_at,
                "assigned_doctor_id": a.assigned_doctor_id,
                "assigned_doctor": doctor_name,  # <- new
            }
        )

    return results


@router.get("/patients")
def get_nurse_patients(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = (
        db.query(models.User)
        .filter(models.User.email == current_user_email)
        .first()
    )
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    patients = (
        db.query(models.Patient)
        .filter(models.Patient.created_by_nurse_id == nurse.id)
        .order_by(models.Patient.created_at.desc())
        .all()
    )

    results = []
    for p in patients:
        latest = (
            db.query(models.Assessment)
            .filter(models.Assessment.patient_id == p.id)
            .order_by(models.Assessment.created_at.desc())
            .first()
        )

        if latest:
            if latest.status == "draft":
                patient_status = "Draft"
            elif latest.risk_level == "Pending" or latest.status == "submitted":
                patient_status = "Pending"
            else:
                patient_status = "Active"
        else:
            patient_status = "Active"

        last_assessment_date = latest.created_at if latest else None
        last_assessment_label = None
        if latest:
            last_assessment_label = f"Risk: {latest.risk_level or 'Pending'}"

        doctor_name = None
        if p.assigned_doctor_id:
            doc = (
                db.query(models.User)
                .filter(models.User.id == p.assigned_doctor_id)
                .first()
            )
            if doc:
                doctor_name = (
                    f"{doc.first_name or ''} {doc.last_name or ''}".strip()
                    or doc.email
                )

        results.append(
            {
                "id": p.id,
                "name": p.name,
                "email": p.email,
                "phone": p.phone,
                "pregnancy_week": p.pregnancy_week,
                "status": patient_status,
                "assigned_doctor": doctor_name,
                "doctor_id": p.assigned_doctor_id,
                "last_assessment": last_assessment_label,
                "last_assessment_date": last_assessment_date,
            }
        )

    return results

@router.get("/patients/{patient_id}")
def get_nurse_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = (
        db.query(models.User)
        .filter(models.User.email == current_user_email)
        .first()
    )
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.id == patient_id,
            models.Patient.created_by_nurse_id == nurse.id,  # only own patients
        )
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor_name = None
    if patient.assigned_doctor_id:
        doc = db.query(models.User).filter(models.User.id == patient.assigned_doctor_id).first()
        if doc:
            doctor_name = (
                f"{doc.first_name or ''} {doc.last_name or ''}".strip()
                or doc.email
            )

    return {
        "id": patient.id,
        "name": patient.name,
        "email": patient.email,
        "phone": patient.phone,
        "dob": patient.dob,
        "age": patient.age,
        "blood_group": patient.blood_group,
        "address": patient.address,
        "city": patient.city,
        "pregnancy_week": patient.pregnancy_week,
        "previous_pregnancies": patient.previous_pregnancies,
        "status": patient.status,
        "assigned_doctor_id": patient.assigned_doctor_id,
        "assigned_doctor": doctor_name,
    }


@router.post("/assessments", status_code=status.HTTP_201_CREATED)
def create_nurse_assessment(
    payload: schemas.AssessmentSave,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    # 1) Create assessment
    new_assessment = models.Assessment(
        patient_id=payload.patient_id,
        patient_name=payload.patient_name,
        patient_email=payload.patient_email,
        nurse_id=nurse.id,
        assigned_doctor_id=payload.assigned_doctor_id,
        risk_score=payload.risk_score if payload.risk_score is not None else 0.0,
        risk_level=payload.risk_level,
        status=payload.status or "submitted",
        raw_data=payload.raw_data,
        plan=payload.plan,
        notes=payload.notes,
    )

    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)

    # 2) Ensure patient is linked to assigned doctor
    if payload.patient_id:
        patient = db.query(models.Patient).filter(models.Patient.id == payload.patient_id).first()
        if patient:
            patient.doctor_id = payload.assigned_doctor_id
            db.add(patient)
            db.commit()

    # 3) Create notification for the assigned doctor (only when submitted)
    if new_assessment.assigned_doctor_id and new_assessment.status == "submitted":
        doctor = (
            db.query(models.User)
            .filter(models.User.id == new_assessment.assigned_doctor_id)
            .first()
        )

        if doctor and doctor.email:
            title = "New Assessment Submitted"
            patient_name = new_assessment.patient_name or f"Patient #{new_assessment.patient_id}"
            message = (
                f"A new postpartum assessment for {patient_name} has been submitted "
                f"by Nurse {nurse.first_name or ''} {nurse.last_name or ''} "
                f"and is awaiting your review."
            )

            notification = models.Notification(
                title=title,
                message=message,
                type="alert",          # alert | info | success
                priority="high",       # high | medium | low
                clinician_email=doctor.email,
            )
            db.add(notification)
            db.commit()

    return new_assessment


@router.delete("/assessments/{assessment_id}", status_code=204)
def delete_nurse_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = (
        db.query(models.User)
        .filter(models.User.email == current_user_email)
        .first()
    )
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    assessment = (
        db.query(models.Assessment)
        .filter(
            models.Assessment.id == assessment_id,
            models.Assessment.nurse_id == nurse.id,   # <- use nurse_id
        )
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    db.delete(assessment)
    db.commit()

@router.get("/stats")
def get_nurse_stats(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    total_patients = (
        db.query(models.Patient)
        .filter(models.Patient.created_by_nurse_id == nurse.id)
        .count()
    )
    total_assessments = (
        db.query(models.Assessment)
        .filter(models.Assessment.nurse_id == nurse.id)
        .count()
    )

    return {
        "total_patients": total_patients,
        "total_assessments": total_assessments,
    }

@router.get("/scheduling-tasks")
def get_scheduling_tasks(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    # latest approved assessment for each patient created by this nurse
    subq = (
        db.query(
            models.Assessment.patient_id,
            func.max(models.Assessment.created_at).label("latest"),
        )
        .join(models.Patient, models.Patient.id == models.Assessment.patient_id)
        .filter(
            models.Patient.created_by_nurse_id == nurse.id,
            models.Assessment.status == "approved",        # doctor finalized
            models.Assessment.assigned_doctor_id.isnot(None),
        )
        .group_by(models.Assessment.patient_id)
        .subquery()
    )

    q = (
        db.query(models.Assessment, models.Patient, models.User)
        .join(subq,
              (models.Assessment.patient_id == subq.c.patient_id)
              & (models.Assessment.created_at == subq.c.latest))
        .join(models.Patient, models.Patient.id == models.Assessment.patient_id)
        .join(models.User, models.User.id == models.Assessment.assigned_doctor_id)
    )

    items = []
    for a, p, d in q.all():
        items.append({
            "instruction_id": a.id,              # you can treat assessment id as “task id”
            "patient_id": p.id,
            "patient_name": p.name,
            "doctor_id": d.id,
            "doctor_name": f"{d.first_name} {d.last_name}".strip() or d.email,
            "urgency": a.risk_level,            # "High"/"Medium"/"Low"
        })
    return items


@router.get("/appointments")
def list_nurse_appointments(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    appts = (
        db.query(models.Appointment)
        .order_by(models.Appointment.date.asc(), models.Appointment.time.asc())
        .all()
    )

    results = []
    for a in appts:
        patient = db.query(models.Patient).filter(models.Patient.id == a.patient_id).first()
        doctor = db.query(models.User).filter(models.User.id == a.doctor_id).first()

        results.append(
            {
                "id": a.id,
                "date": a.date.strftime("%Y-%m-%d") if a.date else None,
                "time": a.time.strftime("%H:%M") if a.time else None,
                "patientid": a.patient_id,
                "patientname": patient.name if patient else None,
                "doctorid": a.doctor_id,
                "doctorname": (
                    f"{doctor.first_name or ''} {doctor.last_name or ''}".strip()
                    if doctor
                    else None
                ),
                "type": a.type,
                "notes": a.notes,
                "urgency": a.urgency,
                "department": a.department,
            }
        )

    return results



@router.post("/appointments")
def create_nurse_appointment(
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    # 1) Create the Appointment (you already have similar code)
    appt = models.Appointment(
        patient_id=payload["patientid"],
        doctor_id=payload["doctorid"],
        date=payload["date"],          # "2026-03-30"
        time=payload["time"],          # "19:30:00" or "19:30"
        type=payload.get("type", "Follow-up"),
        notes=payload.get("notes", ""),
        urgency=payload.get("urgency", "Routine"),
        department=payload.get("department", "General"),
       # status="pending",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    # 2) Also create a FollowUp row used by patient dashboard
    try:
        # Combine date + time into a single datetime
        date_str = str(payload["date"])          # if it's already a string/date
        time_str = str(payload["time"])          # "HH:MM" or "HH:MM:SS"
        if len(time_str) == 5:                   # "HH:MM" -> add seconds
            time_str = time_str + ":00"
        scheduled_dt = datetime.fromisoformat(f"{date_str}T{time_str}")

        patient = db.query(models.Patient).filter(
            models.Patient.id == payload["patientid"]
        ).first()
        doctor = db.query(models.User).filter(
            models.User.id == payload["doctorid"]
        ).first()

        followup = models.FollowUp(
            patient_id=payload["patientid"],
            patient_email=patient.email if patient else None,
            assessment_id=None,
            scheduled_date=scheduled_dt,
            status="pending",                         # important for filters
            type=payload.get("type", "check-in"),
            notes=payload.get("notes", ""),
            clinician_email=doctor.email if doctor else current_user_email,
        )
        db.add(followup)
        db.commit()
        db.refresh(followup)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create FollowUp for appointment {appt.id}: {e}")

    return appt

@router.put("/appointments/{appointment_id}")
def update_nurse_appointment(
    appointment_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.patient_id = payload.get("patientid", appt.patient_id)
    appt.doctor_id = payload.get("doctorid", appt.doctor_id)
    appt.date = payload.get("date", appt.date)
    appt.time = payload.get("time", appt.time)
    appt.type = payload.get("type", appt.type)
    appt.notes = payload.get("notes", appt.notes)
    appt.urgency = payload.get("urgency", appt.urgency)
    appt.department = payload.get("department", appt.department)

    db.commit()
    db.refresh(appt)
    return appt

@router.post("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = (
        db.query(models.User)
        .filter(models.User.email == current_user_email)
        .first()
    )
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    appt = (
        db.query(models.Appointment)
        .filter(models.Appointment.id == appointment_id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = status

    # sync most recent matching FollowUp for this patient/date/time
    followup = (
        db.query(models.FollowUp)
        .filter(
            models.FollowUp.patient_id == appt.patient_id,
            models.FollowUp.status == "pending",
        )
        .order_by(models.FollowUp.scheduled_date.desc())
        .first()
    )
    if followup:
        followup.status = status.lower()  # or map "Completed" -> "completed", etc.
        db.add(followup)

    # existing assessment-complete logic...
    if status.lower() == "completed":
        latest_assessment = (
            db.query(models.Assessment)
            .filter(models.Assessment.patient_id == appt.patient_id)
            .order_by(models.Assessment.created_at.desc())
            .first()
        )
        if latest_assessment and latest_assessment.status in ["approved", "reviewed"]:
            latest_assessment.status = "complete"
            db.add(latest_assessment)

    db.add(appt)
    db.commit()
    return {"status": status}

@router.delete("/appointments/{appointment_id}", status_code=204)
def delete_nurse_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appt)
    db.commit()

