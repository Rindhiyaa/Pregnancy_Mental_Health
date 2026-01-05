from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas import UserCreate, UserOut, LoginRequest
from ..security import hash_password, verify_password
from ..schemas import UserProfileOut, UserProfileUpdate

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    user = models.User(
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    full_name = f"{user.first_name} {user.last_name or ''}".strip()

    return {
        "message": "Login successful",
        "user_id": user.id,
        "full_name": full_name,
        "email": user.email,
        "role": user.role,
    }


def get_user_or_404(user_id: int, db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/me", response_model=UserProfileOut)
def get_profile(
    email: str,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    full_name = f"{user.first_name} {user.last_name or ''}".strip()
    member_since = user.member_since.strftime("%b %d, %Y") if user.member_since else None

    return UserProfileOut(
        id=user.id,
        full_name=full_name,
        email=user.email,
        role=user.role,
        member_since=member_since,
    )


@router.put("/me", response_model=UserProfileOut)
def update_profile(
    payload: UserProfileUpdate,
    email: str,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.full_name:
        parts = payload.full_name.split(" ", 1)
        user.first_name = parts[0]
        user.last_name = parts[1] if len(parts) > 1 else None

    if payload.role is not None:
        user.role = payload.role

    db.add(user)
    db.commit()
    db.refresh(user)

    full_name = f"{user.first_name} {user.last_name or ''}".strip()
    member_since = user.member_since.strftime("%b %d, %Y") if user.member_since else None

    return UserProfileOut(
        id=user.id,
        full_name=full_name,
        email=user.email,
        role=user.role,
        member_since=member_since,
    )   

