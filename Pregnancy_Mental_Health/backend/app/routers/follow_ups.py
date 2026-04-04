from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timedelta
import logging

from ..database import get_db
from .. import models, config
from ..jwt_handler import get_current_user_email

router = APIRouter(prefix="/follow-ups", tags=["follow-ups"])
logger = logging.getLogger(__name__)

@router.get("/")
def get_follow_ups(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Get all upcoming follow-ups for the clinician"""
    try:
        from .. import models
        current_user = db.query(models.User).filter(models.User.email == current_user_email).first()
        
        if current_user and current_user.role == "nurse":
            # Nurses see follow-ups for patients they created
            return db.query(models.FollowUp).options(
                joinedload(models.FollowUp.patient)
            ).join(models.Patient).filter(
                models.Patient.created_by_nurse_id == current_user.id,
                models.FollowUp.status == "pending"
            ).order_by(models.FollowUp.scheduled_date.asc()).all()
        else:
            # Doctors see their own follow-ups
            return db.query(models.FollowUp).options(
                joinedload(models.FollowUp.patient)
            ).filter(
                models.FollowUp.clinician_email == current_user_email,
                models.FollowUp.status == "pending"
            ).order_by(models.FollowUp.scheduled_date.asc()).all()
    except Exception as e:
        logger.error(f"Error fetching follow-ups: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/today")
def get_today_follow_ups(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Get follow-ups scheduled for today or overdue"""
    # Define "today" as everything up to the end of today
    now = datetime.now()
    end_of_today = now + timedelta(days=1)
    
    return db.query(models.FollowUp).options(
        joinedload(models.FollowUp.patient)
    ).filter(
        models.FollowUp.clinician_email == current_user_email,
        models.FollowUp.status == "pending",
        models.FollowUp.scheduled_date <= end_of_today
    ).order_by(models.FollowUp.scheduled_date.asc()).all()

@router.post("/{follow_up_id}/status")
def update_follow_up_status(
    follow_up_id: int,
    status: str,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Update follow-up status (completed, missed)"""
    fup = db.query(models.FollowUp).filter(
        models.FollowUp.id == follow_up_id,
        models.FollowUp.clinician_email == current_user_email
    ).first()
    
    if not fup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
        
    fup.status = status
    db.commit()
    return {"message": f"Follow-up marked as {status}"}

@router.post("/")
async def create_manual_follow_up(
    fup_data: dict,
    background_tasks: BackgroundTasks,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Manually schedule a follow-up"""
    try:
        # Fetch patient details for email
        patient = db.query(models.Patient).filter(models.Patient.id == fup_data["patient_id"]).first()
        
        scheduled_date = datetime.fromisoformat(fup_data["scheduled_date"])
        new_fup = models.FollowUp(
            patient_id=fup_data["patient_id"],
            scheduled_date=scheduled_date,
            type=fup_data.get("type", "check-in"),
            notes=fup_data.get("notes", ""),
            status="pending",
            clinician_email=current_user_email
        )
        db.add(new_fup)
        
        if patient:
            # Create a persistent notification for the clinician
            email_notif = models.Notification(
                title="📋 Follow-up Scheduled",
                message=f"A follow-up check-in for {patient.name} has been scheduled. (Note: Email notification is disabled).",
                type="info",
                priority="low",
                clinician_email=current_user_email,
                is_read=False
            )
            db.add(email_notif)
            
        db.commit()
        db.refresh(new_fup)
        return new_fup
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/patient/{patient_id}")
def get_patient_follow_ups(
    patient_id: int,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    """Get all follow-ups for a specific patient"""
    return db.query(models.FollowUp).filter(
        models.FollowUp.patient_id == patient_id,
        models.FollowUp.clinician_email == current_user_email
    ).order_by(models.FollowUp.scheduled_date.asc()).all()
