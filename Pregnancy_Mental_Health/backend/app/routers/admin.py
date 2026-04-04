from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..jwt_handler import get_current_user_email, get_current_user
from ..config import DEFAULT_USER_PASSWORD
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta, timezone
from ..security import hash_password, pwd_context
import secrets
import string
from fastapi.responses import StreamingResponse
import csv
import io
import json
from ..utils.websocket_manager import manager
# from app.schemas.audit import AuditLogCreate, AuditLogRead

router = APIRouter(prefix="/admin", tags=["admin"])

def require_admin(
    admin=Depends(get_current_user),
):
    if admin.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return admin

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
    admin=Depends(require_admin)
):
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
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    # Broadcast update to all connected clients
    await manager.broadcast(json.dumps({"type": "user_deleted", "userId": user_id}))

    return



@router.get("/dashboard-analytics")
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    # 1) Monthly accuracy trend for last 6 months
    # accuracy_rows = (
    #     db.query(
    #         func.to_char(models.Assessment.created_at, "Mon YYYY").label("month"),
    #         func.avg(models.Assessment.model_accuracy).label("accuracy"),
    #     )
    #     .group_by(func.to_char(models.Assessment.created_at, "Mon YYYY"))
    #     .order_by(func.min(models.Assessment.created_at))  # chronological
    #     .all()
    # )

    # accuracy_data = [
    #     {"month": row.month, "accuracy": round(row.accuracy, 1)}
    #     for row in accuracy_rows
    # ]
    accuracy_data = [
        {"month": "Jan", "accuracy": 91.2},
        {"month": "Feb", "accuracy": 92.1},
    ]

    # 2) Daily usage (assessments per day for last 14 days)
    two_weeks_ago = datetime.now(timezone.utc) - timedelta(days=13)

    usage_rows = (
        db.query(
            cast(models.Assessment.created_at, Date).label("day"),
            func.count(models.Assessment.id).label("assessments"),
        )
        .filter(models.Assessment.created_at >= two_weeks_ago)
        .group_by(cast(models.Assessment.created_at, Date))
        .order_by(cast(models.Assessment.created_at, Date))
        .all()
    )

    usage_stats = [
        {"day": row.day.isoformat(), "assessments": row.assessments}
        for row in usage_rows
    ]

    return {
        "accuracyData": accuracy_data,
        "usageStats": usage_stats,
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


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fixed temporary password for account initialization
    new_password = DEFAULT_USER_PASSWORD
    
    user.hashed_password = pwd_context.hash(new_password)
    user.first_login = True  # Reset first_login flag on password reset
    db.commit()
    db.refresh(user)

    # (optional) audit log here

    return {"detail": "Password reset successfully"}

@router.get("/audit-logs", response_model=List[schemas.AuditLog])
def get_audit_logs(
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).all()

@router.post("/audit-logs", status_code=status.HTTP_201_CREATED)
def create_audit_log(
    log_in: schemas.AuditLogCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Use IP from frontend if provided, otherwise extract from request
    ip = log_in.ip_address
    if not ip:
        forwarded = request.headers.get("X-Forwarded-For")
        ip = forwarded.split(",")[0].strip() if forwarded else request.client.host

    log_entry = models.AuditLog(
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name or ''}".strip(),
        action=log_in.action,
        details=log_in.details,
        ip_address=ip,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return {"status": "success"}

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

@router.get("/assessments/count")
def get_assessments_count(db: Session = Depends(get_db)):
    try:
        total_assessments = db.query(models.Assessment).count()
        return {"total_assessments": total_assessments}
    except Exception as e:
        print("Error counting assessments:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch assessments count")