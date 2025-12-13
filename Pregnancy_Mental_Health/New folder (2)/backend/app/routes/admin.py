from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..auth import get_current_user, require_roles, get_password_hash
from ..models import User, Role, Setting, AuditLog
from ..schemas import UserCreate, UserRead, SettingUpdate
from ..database import get_session

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_roles(Role.admin))])


@router.get("/users", response_model=List[UserRead])
def list_users(session: Session = Depends(get_session)):
    return session.exec(select(User)).all()


@router.post("/users", response_model=UserRead)
def create_user(body: UserCreate, session: Session = Depends(get_session)):
    exists = session.exec(select(User).where(User.email == body.email)).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email exists")
    user = User(
        name=body.name,
        email=body.email,
        role=body.role,
        hashed_password=get_password_hash(body.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, body: UserCreate, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = body.name or user.name
    user.role = body.role or user.role
    if body.password:
        user.hashed_password = get_password_hash(body.password)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/settings")
def get_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(Setting)).all()
    return {s.key: s.value for s in settings}


@router.patch("/settings")
def update_settings(body: SettingUpdate, session: Session = Depends(get_session)):
    payload = body.model_dump(exclude_none=True)
    for key, value in payload.items():
        setting = session.get(Setting, key)
        if not setting:
            setting = Setting(key=key, value=str(value))
        else:
            setting.value = str(value)
        session.add(setting)
    session.commit()
    return {"updated": list(payload.keys())}


@router.get("/audit")
def audit_logs(session: Session = Depends(get_session)):
    logs = session.exec(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(200)).all()
    return logs


