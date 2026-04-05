from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends, Response, Cookie, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import secrets

# Import from centralized config
from .config import JWT_SECRET_KEY, JWT_REFRESH_SECRET, IS_PRODUCTION
from .database import get_db
from . import models

# Validate secrets on startup
if not JWT_SECRET_KEY:
    JWT_SECRET_KEY = secrets.token_urlsafe(32)
    if IS_PRODUCTION:
        print("⚠️  CRITICAL SECURITY WARNING: JWT_SECRET_KEY is NOT set in production!")
        print("⚠️  Using a temporary auto-generated key. All sessions will be invalidated on server restart.")
        print("⚠️  Please set the JWT_SECRET_KEY environment variable in Render for security.")
    else:
        print("⚠️  WARNING: Using auto-generated JWT_SECRET_KEY for development")

if not JWT_REFRESH_SECRET:
    JWT_REFRESH_SECRET = secrets.token_urlsafe(32)
    if IS_PRODUCTION:
        print("⚠️  CRITICAL SECURITY WARNING: JWT_REFRESH_SECRET is NOT set in production!")
        print("⚠️  Using a temporary auto-generated key.")
        print("⚠️  Please set the JWT_REFRESH_SECRET environment variable in Render.")
    else:
        print("⚠️  WARNING: Using auto-generated JWT_REFRESH_SECRET for development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080  # 7 days - NO MORE EXPIRY!
REFRESH_TOKEN_EXPIRE_DAYS = 30

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create a JWT refresh token with longer expiry
    Uses separate secret key for additional security
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and verify JWT token
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type", "access")
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def decode_refresh_token(token: str) -> dict:
    """
    Decode and verify refresh token using separate secret
    """
    try:
        payload = jwt.decode(token, JWT_REFRESH_SECRET, algorithms=[ALGORITHM])
        token_type = payload.get("type", "access")
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type - refresh token required",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )


def get_current_user_email(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependency to get current user email from JWT token
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    email: str = payload.get("sub")
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return email


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    email: str = Depends(get_current_user_email),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> models.User:
    """
    Dependency to get current user object from DB
    Enforces password reset for first-time users except on the change-password endpoint
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    payload = decode_access_token(credentials.credentials)
    iat_timestamp = payload.get("iat")
    if iat_timestamp and getattr(user, "password_changed_at", None):
        iat_datetime = datetime.fromtimestamp(iat_timestamp, tz=timezone.utc)
        pwd_changed = user.password_changed_at
        if pwd_changed.tzinfo is None:
            pwd_changed = pwd_changed.replace(tzinfo=timezone.utc)
        if iat_datetime < pwd_changed:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired due to password change. Please log in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Enforce password reset for first-time users (not admin, not on change-password endpoint)
    if user.first_login and user.role != "admin" and not request.url.path.endswith("/change-password"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="First-time login: Password reset required",
            headers={"X-Action-Required": "PasswordReset"}
        )
        
    return user


# Optional: For endpoints that don't require auth but can use it if present
def get_optional_current_user_email(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[str]:
    """
    Dependency to optionally get current user email from JWT token
    Returns None if no token provided
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        email: str = payload.get("sub")
        return email
    except HTTPException:
        return None
