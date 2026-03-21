from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email
from sqlalchemy import func
from datetime import datetime

router = APIRouter(prefix="/api/patient", tags=["patient"])

@router.get("/dashboard")
def get_patient_dashboard(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find linked patient record
    patient = db.query(models.Patient).filter(models.Patient.email == current_user_email).first()
    if not patient:
        return {
            "welcome_message": f"Welcome, {user.first_name}!",
            "pregnancy_week": "N/A",
            "due_date": "N/A",
            "doctor_info": None,
            "next_appointment": None,
            "risk_status": {"level": "N/A", "score": 0, "date": "N/A"},
            "risk_trend": [],
            "care_plan": {"plan": "No care plan available yet.", "date": "N/A"}
        }
    
    # Get doctor (clinician) info
    doctor = db.query(models.User).filter(models.User.email == patient.clinician_email).first()
    doctor_info = {
        "name": f"Dr. {doctor.first_name} {doctor.last_name or ''}".strip() if doctor else "Assigned Clinician",
        "department": "OB/GYN",
        "hospital": "City Hospital",
        "phone": "044-XXXXXX"
    }

    # Get next appointment
    next_app = db.query(models.FollowUp).filter(
        models.FollowUp.patient_id == patient.id,
        models.FollowUp.scheduled_date >= datetime.now(),
        models.FollowUp.status == "pending"
    ).order_by(models.FollowUp.scheduled_date.asc()).first()

    # Get latest assessment for risk and care plan
    latest_assessment = db.query(models.Assessment).filter(
        models.Assessment.patient_id == patient.id
    ).order_by(models.Assessment.created_at.desc()).first()

    # Get risk trend
    assessments = db.query(models.Assessment).filter(
        models.Assessment.patient_id == patient.id
    ).order_by(models.Assessment.created_at.asc()).all()
    
    risk_trend = [
        {
            "date": a.created_at.strftime("%d %b"),
            "score": a.risk_score,
            "level": a.risk_level
        } for a in assessments
    ]

    return {
        "welcome_message": f"Welcome, {user.first_name}!",
        "pregnancy_week": str(patient.pregnancy_week) if patient.pregnancy_week else "N/A",
        "due_date": patient.due_date.strftime("%d %b %Y") if patient.due_date else "N/A",
        "doctor_info": doctor_info,
        "unread_messages": db.query(models.Message).filter(models.Message.receiver_id == user.id, models.Message.is_read == False).count(),
        "next_appointment": {
            "date": next_app.scheduled_date.strftime("%d %b %Y") if next_app else None,
            "time": next_app.scheduled_date.strftime("%I:%M %p") if next_app else None,
            "type": next_app.type if next_app else None
        },
        "risk_status": {
            "level": latest_assessment.risk_level if latest_assessment else "N/A",
            "score": latest_assessment.risk_score if latest_assessment else 0,
            "date": latest_assessment.created_at.strftime("%d %b %Y") if latest_assessment else "N/A"
        },
        "risk_trend": risk_trend,
        "care_plan": {
            "plan": latest_assessment.plan if latest_assessment else "No active care plan.",
            "date": latest_assessment.created_at.strftime("%d %b %Y") if latest_assessment else "N/A"
        }
    }

@router.get("/assessments")
def get_patient_assessments(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    assessments = db.query(models.Assessment).filter(
        models.Assessment.patient_email == current_user_email
    ).order_by(models.Assessment.created_at.desc()).all()
    return assessments

@router.get("/profile", response_model=schemas.PatientOut)
def get_patient_profile(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    patient = db.query(models.Patient).filter(models.Patient.email == current_user_email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    return patient

@router.put("/profile", response_model=schemas.PatientOut)
def update_patient_profile(
    profile_in: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    patient = db.query(models.Patient).filter(models.Patient.email == current_user_email).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    
    # Update fields
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    # If name changed, update the user record too
    if profile_in.name:
        user = db.query(models.User).filter(models.User.email == current_user_email).first()
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
    current_user_email: str = Depends(get_current_user_email)
):
    appointments = db.query(models.FollowUp).filter(
        models.FollowUp.patient_email == current_user_email
    ).order_by(models.FollowUp.scheduled_date.desc()).all()
    
    # Also fetch doctor name for each appointment
    results = []
    for app in appointments:
        doctor = db.query(models.User).filter(models.User.email == app.clinician_email).first()
        app_dict = {
            "id": app.id,
            "scheduled_date": app.scheduled_date,
            "status": app.status,
            "type": app.type,
            "notes": app.notes,
            "clinician_name": f"{doctor.first_name} {doctor.last_name or ''}".strip() if doctor else "Assigned Clinician"
        }
        results.append(app_dict)
    return results

@router.post("/mood", response_model=schemas.MoodEntryOut)
def log_mood(
    mood_in: schemas.MoodEntryCreate,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    
    # Check if already logged today
    today = datetime.now().date()
    existing = db.query(models.MoodEntry).filter(
        models.MoodEntry.user_id == user.id,
        func.date(models.MoodEntry.created_at) == today
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already logged your mood today!")

    new_entry = models.MoodEntry(
        user_id=user.id,
        mood_score=mood_in.mood_score,
        note=mood_in.note
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.get("/mood/history")
def get_mood_history(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    mood_entries = db.query(models.MoodEntry).filter(
        models.MoodEntry.user_id == user.id
    ).order_by(models.MoodEntry.created_at.desc()).all()
    return mood_entries

@router.get("/messages")
def get_patient_messages(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    messages = db.query(models.Message).filter(
        models.Message.receiver_id == user.id
    ).order_by(models.Message.created_at.desc()).all()
    
    results = []
    for m in messages:
        sender = db.query(models.User).filter(models.User.id == m.sender_id).first()
        results.append({
            "id": m.id,
            "sender_name": f"{sender.first_name} {sender.last_name or ''}".strip() if sender else "Care Team",
            "sender_role": sender.role.capitalize() if sender else "Clinician",
            "subject": m.subject,
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at,
            "type": m.type
        })
    return results

@router.post("/messages")
def send_message_to_patient(
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    sender = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not sender or sender.role not in ["doctor", "nurse", "admin"]:
        raise HTTPException(status_code=403, detail="Only clinicians can send messages to patients")
    
    new_message = models.Message(
        sender_id=sender.id,
        receiver_id=payload['patient_id'],
        subject=payload['subject'],
        content=payload['content'],
        type=payload.get('type', 'general'),
        is_read=False
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

@router.post("/messages/{id}/read")
def mark_message_read(
    id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    message = db.query(models.Message).filter(
        models.Message.id == id,
        models.Message.receiver_id == user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
        
    message.is_read = True
    db.add(message)
    db.commit()
    return {"ok": True}


@router.get("/mood/history/{patient_email}")
def get_patient_mood_history(
    patient_email: str,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    # Check if current user is clinician
    clinician = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not clinician or clinician.role not in ["doctor", "nurse"]:
        raise HTTPException(status_code=403, detail="Only clinicians can view patient mood history")
    
    # Get patient's user record
    patient_user = db.query(models.User).filter(models.User.email == patient_email).first()
    if not patient_user:
        raise HTTPException(status_code=404, detail="Patient user not found")
        
    mood_entries = db.query(models.MoodEntry).filter(
        models.MoodEntry.user_id == patient_user.id
    ).order_by(models.MoodEntry.created_at.asc()).all()
    
    return [
        {
            "date": m.created_at.strftime("%d %b"),
            "score": m.mood_score,
            "note": m.note
        } for m in mood_entries
    ]

@router.get("/messages", response_model=List[schemas.MessageOut])
def get_messages(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    messages = db.query(models.Message).filter(
        models.Message.receiver_id == user.id
    ).order_by(models.Message.created_at.desc()).all()
    return messages
