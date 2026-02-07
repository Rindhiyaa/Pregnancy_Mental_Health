from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas import UserCreate, UserOut, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from ..security import hash_password, verify_password
from ..schemas import UserProfileOut, UserProfileUpdate
from ..jwt_handler import create_access_token, get_current_user_email

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
    
    # Create JWT token for auto-login after signup
    access_token = create_access_token(data={"sub": user.email})
    
    # Return user data with token
    return {
        **UserOut.model_validate(user).model_dump(),
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Mark as logged in
    if not user.is_active:
        user.is_active = True
        db.add(user)
        db.commit()
        db.refresh(user)

    full_name = f"{user.first_name} {user.last_name or ''}".strip()
    member_since = user.member_since.strftime("%b %d, %Y") if user.member_since else None

    # Create JWT token
    access_token = create_access_token(data={"sub": user.email})

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "full_name": full_name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": user.role,
        "member_since": member_since,
    }



def get_user_or_404(user_id: int, db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/me", response_model=UserProfileOut)
def get_profile(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
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
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
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


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return


@router.post("/logout-status", status_code=status.HTTP_204_NO_CONTENT)
def set_logout_inactive(
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()
    return


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Check if user exists with this email.
    Returns error if email not found.
    """
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address. Please check your email or sign up."
        )
    
    # Email exists - in production you would send reset link via email
    return {
        "message": "Email verified. You can now reset your password.",
        "email": request.email
    }


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Reset user password.
    In production, you would verify a reset token first.
    """
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate new password
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    # Update password
    user.hashed_password = hash_password(request.new_password)
    db.commit()
    
    return {
        "message": "Password reset successful. You can now login with your new password."
    }






