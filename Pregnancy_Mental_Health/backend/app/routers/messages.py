# app/routers/messages.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email

router = APIRouter(prefix="/messages", tags=["messages"])


def get_current_user(db: Session, current_user_email: str):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# 1) Clinician → list messages they have sent (for ClinicianMessages.jsx)
@router.get("/clinician")
def list_clinician_messages(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    user = get_current_user(db, current_user_email)
    if user.role not in ["doctor", "nurse", "admin"]:
        raise HTTPException(status_code=403, detail="Clinician role required")

    msgs = (
        db.query(models.Message, models.Patient)
        .join(models.User, models.User.id == models.Message.receiver_id)
        .join(models.Patient, models.Patient.user_id == models.User.id)
        .filter(models.Message.sender_id == user.id)
        .order_by(models.Message.created_at.desc())
        .all()
    )

    return [
        {
            "id": m.id,
            "patient_id": p.id,
            "patient_name": p.name,
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at,
            # optional: include subject/type later if you add columns
        }
        for m, p in msgs
    ]


# 2) Clinician → send message to a patient (used by ClinicianMessages.jsx POST /messages)
@router.post("/")
def send_message(
    payload: dict,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    user = get_current_user(db, current_user_email)
    if user.role not in ["doctor", "nurse", "admin"]:
        raise HTTPException(status_code=403, detail="Clinician role required")

    patient_id = payload.get("patient_id")
    content = payload.get("content")
    if not patient_id or not content:
        raise HTTPException(status_code=400, detail="patient_id and content are required")

    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient or not patient.user_id:
        raise HTTPException(status_code=404, detail="Patient user not linked")

    msg = models.Message(
        sender_id=user.id,
        receiver_id=patient.user_id,
        content=content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id}


# 3) Clinician → delete a message they sent (DELETE /messages/{id})
@router.delete("/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    user = get_current_user(db, current_user_email)
    if user.role not in ["doctor", "nurse", "admin"]:
        raise HTTPException(status_code=403, detail="Clinician role required")

    msg = (
        db.query(models.Message)
        .filter(models.Message.id == message_id, models.Message.sender_id == user.id)
        .first()
    )
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    db.delete(msg)
    db.commit()
    return {"status": "deleted"}


# 4) Patient → list messages they have received (GET /messages/patient)
@router.get("/patient")
def list_patient_messages(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    user = get_current_user(db, current_user_email)
    if user.role != "patient":
        raise HTTPException(status_code=403, detail="Patient role required")

    msgs = (
        db.query(models.Message, models.User)
        .join(models.User, models.User.id == models.Message.sender_id)
        .filter(models.Message.receiver_id == user.id)
        .order_by(models.Message.created_at.desc())
        .all()
    )

    return [
        {
            "id": m.id,
            "from_name": sender.first_name + " " + (sender.last_name or ""),
            "from_role": sender.role.capitalize(),
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at,
        }
        for m, sender in msgs
    ]


# 5) Patient → mark message as read (POST /messages/{id}/read)
@router.post("/{message_id}/read")
def mark_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email),
):
    user = get_current_user(db, current_user_email)
    if user.role != "patient":
        raise HTTPException(status_code=403, detail="Patient role required")

    msg = (
        db.query(models.Message)
        .filter(models.Message.id == message_id, models.Message.receiver_id == user.id)
        .first()
    )
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    msg.is_read = True
    db.commit()
    return {"status": "ok"}