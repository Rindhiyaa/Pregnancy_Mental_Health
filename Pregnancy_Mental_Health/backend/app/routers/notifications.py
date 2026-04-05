from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email

# FIXED: Remove prefix → main.py adds /notifications
router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[schemas.NotificationOut])
def get_notifications(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
    limit: int = 10
):
    return db.query(models.Notification).filter(
        models.Notification.clinician_email == current_user_email
    ).order_by(models.Notification.created_at.desc()).limit(limit).all()

@router.get("/unread-count")
def get_unread_count(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    count = db.query(models.Notification).filter(
        models.Notification.clinician_email == current_user_email,
        models.Notification.is_read == False
    ).count()
    return {"count": count}

@router.post("/read-all")
def mark_all_as_read(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    db.query(models.Notification).filter(
        models.Notification.clinician_email == current_user_email,
        models.Notification.is_read == False
    ).update({models.Notification.is_read: True})
    db.commit()
    return {"message": "All notifications marked as read"}

@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.clinician_email == current_user_email
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}