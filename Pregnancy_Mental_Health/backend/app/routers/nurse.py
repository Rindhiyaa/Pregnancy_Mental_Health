from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
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

@router.get("/profile")
def get_nurse_profile(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    nurse = db.query(models.User).filter(
        models.User.email == current_user_email,
        models.User.role == "nurse"
    ).first()

    if not nurse:
        raise HTTPException(status_code=403, detail="Nurse not found")

    return {
        "id": nurse.id,
        "email": nurse.email,
        "first_name": nurse.first_name,
        "last_name": nurse.last_name,
        "full_name": f"{nurse.first_name} {nurse.last_name or ''}".strip(),
        "role": nurse.role,
        "phone_number": nurse.phone_number,
        "hospital_name": nurse.hospital_name,
        "department": nurse.department,
        "designation": nurse.designation,
        "specialization": nurse.specialization,
        "ward": nurse.ward,
        "years_of_experience": nurse.years_of_experience,
        "member_since": nurse.member_since,
    }

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
                    doctor_name = f"{doctor.first_name or ''} {doctor.last_name or ''}".strip()

            recentPatients.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "email": p.email,
                    "phone": p.phone,
                    "pregnancy_week": p.pregnancy_week,
                    "assigned_doctor": doctor_name,
                    "status": "Registered",
                    "created_at": p.created_at.strftime("%Y-%m-%d"),
                    "is_online": (datetime.now(timezone.utc) - p.user.last_active.replace(tzinfo=timezone.utc)).total_seconds() < 300 if p.user and p.user.last_active else False,
                }
            )

        # Calculate trends (last 7 days)
        last_7d = datetime.now() - timedelta(days=7)
        
        new_patients_last_7d = db.query(models.Patient).filter(
            models.Patient.created_by_nurse_id == nurse.id,
            models.Patient.created_at >= last_7d
        ).count()
        
        pending_assessments_last_7d = db.query(models.Assessment).filter(
            models.Assessment.nurse_id == nurse.id,
            models.Assessment.status == "draft",
            models.Assessment.created_at >= last_7d
        ).count()
        
        waiting_review_last_7d = db.query(models.Assessment).filter(
            models.Assessment.nurse_id == nurse.id,
            models.Assessment.status == "submitted",
            models.Assessment.created_at >= last_7d
        ).count()

        return {
            "stats": {
                "new_patients_today": new_patients_today,
                "pending_assessments": pending_assessments,
                "waiting_review": waiting_review,
                "total_patients": total_patients,
                "trends": {
                    "total_patients": f"+{new_patients_last_7d}" if new_patients_last_7d > 0 else "0",
                    "pending_assessments": f"+{pending_assessments_last_7d}" if pending_assessments_last_7d > 0 else "0",
                    "waiting_review": f"+{waiting_review_last_7d}" if waiting_review_last_7d > 0 else "0",
                    "new_patients_today": f"+{new_patients_today}" if new_patients_today > 0 else "0"
                }
            },
            "recentPatients": recentPatients,
        }
    except Exception as e:
        logger.error(f"Error in get_nurse_dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/doctors")
def get_nurse_doctors(db: Session = Depends(get_db)):  # ← PUBLIC!
    doctors = (
        db.query(models.User)
        .filter(models.User.role == "doctor")
        .all()
    )

    counts = dict(
        db.query(models.Patient.assigned_doctor_id, func.count(models.Patient.id))
        .group_by(models.Patient.assigned_doctor_id)
        .all()
    )

    result = []
    now = datetime.now(datetime.now().astimezone().tzinfo)
    for d in doctors:
        full_name = f"{d.first_name or ''} {d.last_name or ''}".strip() or d.email
        
        # ✅ Calculate is_online (active in last 5 minutes)
        is_online = False
        if d.last_active:
            # Handle timezone-aware comparison
            last_active = d.last_active
            if last_active.tzinfo is None:
                last_active = last_active.replace(tzinfo=timezone.utc)
            
            diff = datetime.now(timezone.utc) - last_active
            is_online = diff.total_seconds() < 300 # 5 minutes
            
        result.append(
            {
                "id": d.id,
                "first_name": d.first_name,
                "last_name": d.last_name,
                "fullName": full_name,
                "email": d.email,
                "specialization": getattr(d, "specialization", None),
                "active_patients": counts.get(d.id, 0),
                "is_online": is_online,
                "last_active": d.last_active
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

    normalised_email = payload["email"].strip().lower()
    existing_user = (
        db.query(models.User)
        .filter(func.lower(models.User.email) == normalised_email)
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
            email=normalised_email,
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
            "email": normalised_email,
            "phone": payload["phone"],
            "clinician_email": current_user_email,
            "created_by_nurse_id": nurse.id,
            "assigned_doctor_id": payload.get("assignedDoctor"),
            "status": "active",
            "user_id": new_user.id,  # link Patient record to the portal User
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
            elif latest.status == "submitted" or latest.risk_level == "Pending":
                patient_status = "Pending"
            else:
                patient_status = "Assessed"
        else:
            patient_status = "Registered"

        last_assessment_date = latest.created_at if latest else None
        last_assessment_label = "Assessment Logged" if latest else None

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

        is_online = False
        if p.user and p.user.last_active:
            last_active = p.user.last_active
            if last_active.tzinfo is None:
                last_active = last_active.replace(tzinfo=timezone.utc)

            is_online = (datetime.now(timezone.utc) - last_active).total_seconds() < 300

        results.append(
            {
                "id": p.id,
                "name": p.name,
                "email": p.email,
                "phone": p.phone,
                "age": p.age,
                "pregnancy_week": p.pregnancy_week,
                "status": patient_status,
                "assigned_doctor": doctor_name,
                "doctor_id": p.assigned_doctor_id,
                "last_assessment": last_assessment_label,
                "last_assessment_date": last_assessment_date,
                "is_online": is_online,
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
        "is_online": (datetime.now(timezone.utc) - patient.user.last_active.replace(tzinfo=timezone.utc)).total_seconds() < 300 if patient.user and patient.user.last_active else False,
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

    if payload.status == "submitted":
        required = [
            "age", "residence", "education_level", "marital_status", 
            "partner_education", "partner_income", "household_members",
            "relationship_inlaws", "relationship_husband", "support_during_pregnancy",
            "need_more_support", "trust_share_feelings", "family_type",
            "total_children_now", "pregnancy_number", "pregnancy_planned", 
            "regular_checkups", "medical_conditions_pregnancy", "occupation_before_surgery",
            "depression_before_pregnancy", "depression_during_pregnancy",
            "fear_pregnancy_childbirth", "major_life_changes_pregnancy", "abuse_during_pregnancy"
        ]
        required.extend([f"epds_{i}" for i in range(1, 11)])

        raw = payload.raw_data or {}
        missing = [f for f in required if raw.get(f) is None or str(raw.get(f)).strip() == ""]
        if missing:
            raise HTTPException(status_code=400, detail=f"Incomplete assessment submission. Missing required fields: {', '.join(missing[:5])}" + ("..." if len(missing) > 5 else ""))

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

    if payload.patient_id:
        patient = db.query(models.Patient).filter(models.Patient.id == payload.patient_id).first()
        if patient:
            patient.assigned_doctor_id = payload.assigned_doctor_id
            db.add(patient)
            db.commit()

    if new_assessment.assigned_doctor_id and new_assessment.status == "submitted":
        doctor = (
            db.query(models.User)
            .filter(models.User.id == new_assessment.assigned_doctor_id)
            .first()
        )

        if doctor and doctor.email:
            title = "New Assessment Submitted"
            patient_name = new_assessment.patient_name or f"Patient #{new_assessment.patient_id}"
            nurse_name = f"{nurse.first_name or ''} {nurse.last_name or ''}".strip() or nurse.email
            message = (
                f"A new postpartum assessment for {patient_name} has been submitted "
                f"by Nurse {nurse_name} and is awaiting your review."
            )

            notification = models.Notification(
                title=title,
                message=message,
                type="alert",
                priority="high",
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

    # Fetch all pending follow-ups that need scheduling. 
    # We show tasks that are 'pending' and are doctor-prescribed (linked to an assessment).
    pending_followups = (
        db.query(models.FollowUp, models.Assessment, models.Patient)
        .outerjoin(models.Assessment, models.Assessment.id == models.FollowUp.assessment_id)
        .outerjoin(models.Patient, models.Patient.id == models.FollowUp.patient_id)
        .filter(
            models.FollowUp.status == "pending",
            models.FollowUp.assessment_id.isnot(None)
        )
        .all()
    )

    items = []
    for fup, a, p in pending_followups:
        # Get the doctor who was assigned to the assessment
        doctor = db.query(models.User).filter(models.User.id == a.assigned_doctor_id).first()
        
        items.append({
            "instruction_id": a.id,
            "follow_up_id": fup.id,
            "patient_id": p.id,
            "patient_name": p.name,
            "doctor_id": doctor.id if doctor else None,
            "doctor_name": f"Dr. {doctor.first_name} {doctor.last_name}" if doctor else "Assigned Doctor",
            "urgency": fup.type,
            "instruction": fup.notes,
            "window": "To be scheduled",
        })
    return items


@router.delete("/scheduling-tasks/{follow_up_id}")
def dismiss_scheduling_task(
    follow_up_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    fup = db.query(models.FollowUp).filter(models.FollowUp.id == follow_up_id).first()
    if not fup:
        raise HTTPException(status_code=404, detail="Task not found")

    fup.status = "dismissed"
    db.commit()
    return {"message": "Task dismissed"}


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
        .filter(
            models.Appointment.created_by_nurse_id == nurse.id,
            models.Appointment.status.notin_(["Completed", "Cancelled"])
        )
        .order_by(models.Appointment.date.asc(), models.Appointment.time.asc())
        .all()
    )

    results = []
    for a in appts:
        doctor = db.query(models.User).filter(
            models.User.id == (a.assigned_doctor_id or a.doctor_id)
        ).first()
        patient = db.query(models.Patient).filter(models.Patient.id == a.patient_id).first()

        results.append({
            "id": a.id,
            "date": a.date.strftime("%Y-%m-%d") if a.date else None,
            "time": a.time.strftime("%H:%M") if a.time else None,
            "patientid": a.patient_id,
            "patientname": patient.name if patient else None,
            "doctorid": a.assigned_doctor_id or a.doctor_id,
            "doctorname": f"{doctor.first_name or ''} {doctor.last_name or ''}".strip() if doctor else None,
            "type": a.type,
            "notes": a.notes,
            "urgency": a.urgency,
            "department": a.department,
            "status": a.status,
        })

    return results


@router.post("/appointments")
def create_nurse_appointment(
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    try:
        appt_date = datetime.strptime(str(payload["date"]), "%Y-%m-%d").date()
        time_str = str(payload["time"])
        if len(time_str) == 5:
            appt_time = datetime.strptime(time_str, "%H:%M").time()
            time_str = f"{time_str}:00"
        else:
            appt_time = datetime.strptime(time_str, "%H:%M:%S").time()

        patient = db.query(models.Patient).filter(models.Patient.id == payload["patientid"]).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        doctor = db.query(models.User).filter(models.User.id == payload["doctorid"]).first()
        if not doctor or doctor.role != "doctor":
            raise HTTPException(status_code=404, detail="Doctor not found")

        appt = models.Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            assigned_doctor_id=doctor.id,
            patient_name=patient.name,
            date=appt_date,
            time=appt_time,
            type=payload.get("type", "Follow-up"),
            notes=payload.get("notes", ""),
            urgency=payload.get("urgency", "Routine"),
            department=payload.get("department", "General"),
            created_by_nurse_id=nurse.id,  # ← ADD THIS
        )
        db.add(appt)
        db.commit()
        db.refresh(appt)

        # Mark all pending instructions (FollowUp) for this assessment as scheduled
        instruction_id = payload.get("instruction_id")
        if instruction_id:
            # Mark ALL pending follow-ups for this assessment as scheduled to clear the queue
            db.query(models.FollowUp).filter(
                models.FollowUp.assessment_id == instruction_id,
                models.FollowUp.status == "pending"
            ).update({"status": "scheduled", "scheduled_date": datetime.fromisoformat(f"{payload['date']}T{time_str}")}, synchronize_session=False)
            
            # Also try by follow_up_id if that was passed
            db.query(models.FollowUp).filter(
                models.FollowUp.id == instruction_id,
                models.FollowUp.status == "pending"
            ).update({"status": "scheduled", "scheduled_date": datetime.fromisoformat(f"{payload['date']}T{time_str}")}, synchronize_session=False)

        # Create a new follow-up entry for the actual scheduled appointment
        # This one will be the one the doctor/nurse marks as 'completed' later
        scheduled_dt = datetime.fromisoformat(f"{payload['date']}T{time_str}")
        followup = models.FollowUp(
            patient_id=patient.id,
            patient_email=patient.email,
            assessment_id=None,
            scheduled_date=scheduled_dt,
            status="pending",
            type=payload.get("type", "check-in"),
            notes=payload.get("notes", ""),
            clinician_email=doctor.email,
        )
        db.add(followup)
        db.commit()
        db.refresh(followup)

        # ✅ SEND NOTIFICATION TO DOCTOR AFTER APPOINTMENT IS CREATED
        try:
            if doctor and doctor.email:
                nurse_name = f"{nurse.first_name or ''} {nurse.last_name or ''}".strip() or nurse.email

                notification = models.Notification(
                    title="New Appointment Scheduled",
                    message=(
                        f"An appointment has been scheduled for {patient.name} "
                        f"by Nurse {nurse_name} on {appt.date.strftime('%Y-%m-%d')} at {appt.time.strftime('%H:%M')}."
                    ),
                    type="info",
                    priority="medium",
                    clinician_email=doctor.email,
                )

                db.add(notification)
                db.commit()

        except Exception as notif_err:
            logger.error(f"Notification creation failed: {notif_err}")

        return {
            "appointment_id": appt.id,
            "patient_name": patient.name,
            "doctor_name": f"{doctor.first_name} {doctor.last_name or ''}".strip(),
            "date": appt.date,
            "time": appt.time,
            "status": appt.status,
        }

    except KeyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Missing field: {str(e)}")
    except ValueError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid date or time format")
    except Exception as e:
        db.rollback()
        logger.exception("Failed to create appointment")
        raise HTTPException(status_code=500, detail="Failed to create appointment")
    
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

    appt = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.created_by_nurse_id == nurse.id,  # ← VERIFY NURSE OWNS IT
    ).first()
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
        .filter(
            models.Appointment.id == appointment_id,
            models.Appointment.created_by_nurse_id == nurse.id,
        )
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
    nurse = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not nurse or nurse.role != "nurse":
        raise HTTPException(status_code=403, detail="Nurse role required")

    appt = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.created_by_nurse_id == nurse.id,  # ← VERIFY NURSE OWNS IT
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    db.delete(appt)
    db.commit()