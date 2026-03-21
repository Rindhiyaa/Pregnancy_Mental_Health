from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email
from sqlalchemy import func
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = db.query(models.User).count()
    total_clinicians = db.query(models.User).filter(models.User.role.in_(["doctor", "nurse"])).count()
    total_patients = db.query(models.User).filter(models.User.role == "patient").count()
    total_assessments = db.query(models.Assessment).count()
    
    # Get recent users
    recent_users_list = db.query(models.User).order_by(models.User.member_since.desc()).limit(5).all()
    
    formatted_users = []
    for u in recent_users_list:
        joined_ago = "Recently" # Simple placeholder logic
        if u.member_since:
            diff = datetime.now() - u.member_since
            if diff.days == 0:
                joined_ago = "Today"
            else:
                joined_ago = f"{diff.days} days ago"
                
        formatted_users.append({
            "id": u.id,
            "name": f"{u.first_name} {u.last_name or ''}".strip(),
            "email": u.email,
            "role": u.role.capitalize(),
            "status": "Active", # Simplified
            "joined": joined_ago
        })

    return {
        "totalUsers": total_users,
        "totalClinicians": total_clinicians,
        "totalPatients": total_patients,
        "totalAssessments": total_assessments,
        "recentUsers": formatted_users
    }

@router.get("/clinicians", response_model=List[schemas.UserOut])
def get_clinicians(
    db: Session = Depends(get_db),
    current_user_email: str = Depends(get_current_user_email)
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return db.query(models.User).filter(models.User.role.in_(["doctor", "nurse"])).all()
