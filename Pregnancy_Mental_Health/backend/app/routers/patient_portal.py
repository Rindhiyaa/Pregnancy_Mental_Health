from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from sqlalchemy import func

from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email, get_current_user

router = APIRouter(prefix="/api/patient", tags=["patient"])


@router.get("/dashboard")
def get_patient_dashboard(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    # Linked patient record (by email)
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.email == user.email)
        .first()
    )
    if not patient:
        return {
            "welcome_message": f"Welcome, {user.first_name}!",
            "pregnancy_week": "N/A",
            "due_date": "N/A",
            "doctor_info": None,
            "unread_messages": 0,
            "next_appointment": None,
            "risk_status": {"level": "N/A", "score": 0, "date": "N/A"},
            "risk_trend": [],
            "care_plan": {"plan": "No care plan available yet.", "date": "N/A"},
        }

    # Resolve clinician: prefer assigned_doctor_id, then clinician_email
    doctor = None
    if getattr(patient, "assigned_doctor_id", None):
        doctor = (
            db.query(models.User)
            .filter(models.User.id == patient.assigned_doctor_id)
            .first()
        )
    if not doctor and patient.clinician_email:
        doctor = (
            db.query(models.User)
            .filter(models.User.email == patient.clinician_email)
            .first()
        )

    # Build display name with Dr. prefix only for doctors
    if doctor:
        if doctor.role == "doctor":
            display_name = f"{doctor.first_name} {doctor.last_name or ''}".strip()
        else:
            display_name = f"{doctor.first_name} {doctor.last_name or ''}".strip()
        doctor_info = {
            "name": display_name,
            "department": getattr(doctor, "department", None),
            "hospital": getattr(doctor, "hospital", None),
            "phone": getattr(doctor, "phone_number", None),
        }
    else:
        doctor_info = None

    # Next appointment (by patient_id)
    now = datetime.now()
    next_app = (
        db.query(models.FollowUp)
        .filter(
            models.FollowUp.patient_id == patient.id,
            models.FollowUp.scheduled_date >= now,
            models.FollowUp.status == "pending",
        )
        .order_by(models.FollowUp.scheduled_date.asc())
        .first()
    )

    # Latest assessment
    latest_assessment = (
        db.query(models.Assessment)
        .filter(models.Assessment.patient_id == patient.id)
        .order_by(models.Assessment.created_at.desc())
        .first()
    )

    # Risk trend (all assessments)
    assessments = (
        db.query(models.Assessment)
        .filter(models.Assessment.patient_id == patient.id)
        .order_by(models.Assessment.created_at.asc())
        .all()
    )
    risk_trend = [
        {
            "date": a.created_at.strftime("%d %b"),
            "score": a.risk_score,
            "level": a.risk_level,
        }
        for a in assessments
    ]

    unread_messages = (
        db.query(models.Message)
        .filter(models.Message.receiver_id == user.id, models.Message.is_read == False)
        .count()
    )

    return {
        "welcome_message": f"Welcome, {user.first_name}!",
        "pregnancy_week": str(patient.pregnancy_week)
        if patient.pregnancy_week
        else "N/A",
        "due_date": patient.due_date.strftime("%d %b %Y")
        if patient.due_date
        else "N/A",
        "doctor_info": doctor_info,
        "unread_messages": unread_messages,
        "next_appointment": {
            "date": next_app.scheduled_date.strftime("%d %b %Y") if next_app else None,
            "time": next_app.scheduled_date.strftime("%I:%M %p") if next_app else None,
            "type": next_app.type if next_app else None,
        },
        "risk_status": {
            "level": latest_assessment.risk_level if latest_assessment else "N/A",
            "score": latest_assessment.risk_score if latest_assessment else 0,
            "date": latest_assessment.created_at.strftime("%d %b %Y")
            if latest_assessment
            else "N/A",
        },
        "risk_trend": risk_trend,
        "care_plan": {
            "plan": latest_assessment.plan
            if latest_assessment
            else "No active care plan.",
            "date": latest_assessment.created_at.strftime("%d %b %Y")
            if latest_assessment
            else "N/A",
        },
    }


@router.get("/assessments")
def get_patient_assessments(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    # Find patient linked to this portal user
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.email == current_user_email)
        .first()
    )
    if not patient:
        return []

    assessments = (
        db.query(models.Assessment)
        .filter(models.Assessment.patient_id == patient.id)
        .order_by(models.Assessment.created_at.desc())
        .all()
    )

    results = []
    for a in assessments:
        # --- resolve doctor like in dashboard ---
        doctor = None
        if a.assigned_doctor_id:
            doctor = (
                db.query(models.User)
                .filter(models.User.id == a.assigned_doctor_id)
                .first()
            )
        if not doctor and a.clinician_email:
            doctor = (
                db.query(models.User)
                .filter(models.User.email == a.clinician_email)
                .first()
            )

        if doctor and doctor.role == "doctor":
            doctor_name = f"{doctor.first_name} {doctor.last_name or ''}".strip()
        elif doctor:
            # nurse / other
            doctor_name = f"{doctor.first_name} {doctor.last_name or ''}".strip()
        else:
            doctor_name = None

        # --- build response dict ---
        a_dict = {
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": a.patient_name,
            "patient_email": a.patient_email,
            "raw_data": a.raw_data,
            "risk_score": a.risk_score,
            "risk_level": a.risk_level,
            "clinician_risk": a.clinician_risk,
            "plan": a.plan,
            "notes": a.notes,
            "clinician_email": a.clinician_email,
            "created_at": a.created_at,
            "status": a.status,
            "risk_level_final": a.risk_level_final,
            "reviewed_at": a.reviewed_at,
            # nurse / doctor ids
            "nurse_id": a.nurse_id,
            "assigned_doctor_id": a.assigned_doctor_id,
            # computed field used by frontend
            "doctor_name": doctor_name,
        }

        results.append(a_dict)

    return results


@router.get("/profile", response_model=schemas.PatientOut)
def get_patient_profile(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.email == current_user_email)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    return patient


@router.put("/profile", response_model=schemas.PatientOut)
def update_patient_profile(
    profile_in: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.email == current_user_email)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    if profile_in.name:
        user = (
            db.query(models.User)
            .filter(models.User.email == current_user_email)
            .first()
        )
        if user:
            parts = profile_in.name.split(" ", 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else None
            db.add(user)

    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/appointments")
def get_patient_appointments(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.email == current_user_email)
        .first()
    )
    if not patient:
        return []

    appointments = (
        db.query(models.FollowUp)
        .filter(models.FollowUp.patient_id == patient.id)
        .order_by(models.FollowUp.scheduled_date.desc())
        .all()
    )

    results = []
    for app in appointments:
        doctor = (
            db.query(models.User)
            .filter(models.User.email == app.clinician_email)
            .first()
        )
        results.append(
            {
                "id": app.id,
                "scheduled_date": app.scheduled_date,
                "status": app.status,
                "type": app.type,
                "notes": app.notes,
                "clinician_name": f"{doctor.first_name} {doctor.last_name or ''}".strip()
                if doctor
                else "Assigned Clinician",
            }
        )
    return results


@router.post("/mood", response_model=schemas.MoodEntryOut)
def log_mood(
    mood_in: schemas.MoodEntryCreate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    today = datetime.now().date()
    existing = (
        db.query(models.MoodEntry)
        .filter(
            models.MoodEntry.user_id == user.id,
            func.date(models.MoodEntry.created_at) == today,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="You have already logged your mood today!"
        )

    new_entry = models.MoodEntry(
        user_id=user.id,
        mood_score=mood_in.mood_score,
        note=mood_in.note,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.get("/mood/history")
def get_mood_history(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    mood_entries = (
        db.query(models.MoodEntry)
        .filter(models.MoodEntry.user_id == user.id)
        .order_by(models.MoodEntry.created_at.asc())
        .all()
    )

    return [
        {
            "date": m.created_at.strftime("%d %b"),
            "score": m.mood_score,
            "note": m.note,
        }
        for m in mood_entries
    ]



@router.get("/mood/history/{patient_email}")
def get_patient_mood_history(
    patient_email: str,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    clinician = (
        db.query(models.User)
        .filter(models.User.email == current_user_email)
        .first()
    )
    if not clinician or clinician.role not in ["doctor", "nurse"]:
        raise HTTPException(
            status_code=403,
            detail="Only clinicians can view patient mood history",
        )

    patient_user = (
        db.query(models.User)
        .filter(models.User.email == patient_email)
        .first()
    )
    if not patient_user:
        raise HTTPException(status_code=404, detail="Patient user not found")

    mood_entries = (
        db.query(models.MoodEntry)
        .filter(models.MoodEntry.user_id == patient_user.id)
        .order_by(models.MoodEntry.created_at.asc())
        .all()
    )

    return [
        {
            "date": m.created_at.strftime("%d %b"),
            "score": m.mood_score,
            "note": m.note,
        }
        for m in mood_entries
    ]

