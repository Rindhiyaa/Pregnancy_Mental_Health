from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas import UserCreate, UserOut, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from ..security import hash_password, verify_password
from ..schemas import UserProfileOut, UserProfileUpdate
from ..jwt_handler import (
    create_access_token, 
    create_refresh_token,
    decode_refresh_token,
    get_current_user_email
)
from ..config import ALLOWED_ORIGINS, IS_PRODUCTION

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, response: Response, db: Session = Depends(get_db)):
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
    
    # Create JWT tokens for auto-login after signup
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    # Store refresh token in httpOnly cookie (secure, not accessible to JavaScript)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,      # Cannot be accessed by JavaScript (XSS protection)
        secure=IS_PRODUCTION,  # HTTPS only in production
        samesite="lax",     # Better for SPA + API pattern, allows navigation
        max_age=7 * 24 * 3600  # 7 days
    )
    
    # Return user data with access token only (refresh token in cookie)
    return {
        **UserOut.model_validate(user).model_dump(),
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login")
def login(credentials: LoginRequest, response: Response, db: Session = Depends(get_db)):
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

    # Create JWT tokens
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    
    # Store refresh token in httpOnly cookie (secure, not accessible to JavaScript)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,      # Cannot be accessed by JavaScript (XSS protection)
        secure=IS_PRODUCTION,  # HTTPS only in production
        samesite="lax",     # Better for SPA + API pattern, allows navigation
        max_age=7 * 24 * 3600  # 7 days
    )

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


@router.post("/refresh")
def refresh_access_token(request: Request, refresh_token: str = Cookie(None)):
    """
    Get a new access token using refresh token from httpOnly cookie
    Includes CSRF protection by validating origin
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    # CSRF Protection: Validate request origin
    origin = request.headers.get("origin")
    if IS_PRODUCTION and origin not in ALLOWED_ORIGINS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF check failed - invalid origin"
        )
    
    try:
        payload = decode_refresh_token(refresh_token)
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new access token
        new_access_token = create_access_token(data={"sub": email})
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not refresh token"
        )



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
    response: Response,
    current_user_email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == current_user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()
    
    # Clear refresh token cookie - attributes MUST match set_cookie exactly
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax"
    )
    
    return


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Check if user exists with this email.
    Returns same response regardless of whether email exists (prevents user enumeration).
    In production, this would send a reset email if the account exists.
    """
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    # Security: Always return same message to prevent user enumeration
    # Don't reveal whether the email exists in the database
    if user:
        # TODO: In production, send actual password reset email here
        # Example: send_password_reset_email(user.email, generate_reset_token(user))
        pass
    
    # Return same response whether user exists or not
    return {
        "message": "If an account exists with this email, a password reset link has been sent.",
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
    Returns same error for non-existent users to prevent enumeration.
    """
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    # Security: Don't reveal whether user exists
    if not user:
        # Return same error as invalid password to prevent user enumeration
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset request."
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






