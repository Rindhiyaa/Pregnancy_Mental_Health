from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email,get_db, get_current_user  
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from ..security import hash_password 
from passlib.context import CryptContext
import secrets
import string
from fastapi.responses import StreamingResponse
import csv
import io
# from app.schemas.audit import AuditLogCreate, AuditLogRead

router = APIRouter(prefix="/api/admin", tags=["admin"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def require_admin(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/users", response_model=List[schemas.UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return db.query(models.User).all()

@router.post("/users", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    if len(user_in.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )

    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    if user_in.phone_number:
        existing_phone = (
            db.query(models.User)
            .filter(models.User.phone_number == user_in.phone_number)
            .first()
        )
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this phone number already exists.",
            )

    user = models.User(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email,
        phone_number=user_in.phone_number,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,      # "doctor", "nurse", or "patient"
        first_login=True,       # force password change at first login
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

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
            now = datetime.now(timezone.utc)
            diff = now - u.member_since
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

@router.patch("/users/{user_id}/status", response_model=schemas.UserOut)
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    print("BEFORE", user.id, user.is_active)  # debug
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    print("AFTER", user.id, user.is_active)   # debug
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()
    return [
        {
            "id": log.id,
            "user": log.user_name,       # or join to User
            "action": log.action,
            "details": log.details,
            "ip": log.ip_address,
            "timestamp": log.timestamp.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
        }
        for log in logs
    ]


@router.post("/audit-logs", response_model=schemas.AuditLogRead)
def create_audit_log(
    audit: schemas.AuditLogCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_name = f"{current_user.first_name} {current_user.last_name or ''}".strip()

    log = models.AuditLog(
        action=audit.action,
        details=audit.details,
        user_id=current_user.id,
        user_name=user_name,
        ip_address=audit.ip_address,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/dashboard-analytics")
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    # TODO: replace with real aggregates
    return {
        "accuracyData": [
            {"month": "Jan", "accuracy": 91.2},
            {"month": "Feb", "accuracy": 92.1},
        ],
        "usageStats": [
            {"day": "Mon", "assessments": 10},
            {"day": "Tue", "assessments": 14},
        ],
    }

@router.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,  # create this Pydantic model
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Apply allowed fields
    if user_in.first_name is not None:
        user.first_name = user_in.first_name
    if user_in.last_name is not None:
        user.last_name = user_in.last_name
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.phone_number is not None:
        user.phone_number = user_in.phone_number

    db.commit()
    db.refresh(user)
    return user


def generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))

@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Short password << 72 bytes
    new_password = generate_temp_password(12)  # e.g. "Ab3kP9xY0mZ2"
    if len(new_password) > 72:
        new_password = new_password[:72]

    user.hashed_password = pwd_context.hash(new_password)
    db.commit()
    db.refresh(user)

    # (optional) audit log here

    return {"detail": "Password reset", "temp_password": new_password}

@router.get("/audit-logs/export", response_class=StreamingResponse)
def export_audit_logs_csv(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "timestamp", "user_name", "action", "details", "ip_address"])

    for log in logs:
        writer.writerow([
            log.id,
            log.timestamp.isoformat() if log.timestamp else "",
            log.user_name or "",
            log.action or "",
            log.details or "",
            log.ip_address or "",
        ])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs.csv"},
    )