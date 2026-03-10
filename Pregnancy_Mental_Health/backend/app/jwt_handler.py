from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends, Response, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets

# Import from centralized config
from .config import JWT_SECRET_KEY, JWT_REFRESH_SECRET, IS_PRODUCTION

# Validate secrets on startup
if not JWT_SECRET_KEY:
    if IS_PRODUCTION:
        raise ValueError(
            "JWT_SECRET_KEY environment variable must be set in production! "
            "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    else:
        JWT_SECRET_KEY = secrets.token_urlsafe(32)
        print("⚠️  WARNING: Using auto-generated JWT_SECRET_KEY for development")
        print("⚠️  Set JWT_SECRET_KEY environment variable for production")

if not JWT_REFRESH_SECRET:
    if IS_PRODUCTION:
        raise ValueError(
            "JWT_REFRESH_SECRET environment variable must be set in production! "
            "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    else:
        JWT_REFRESH_SECRET = secrets.token_urlsafe(32)
        print("⚠️  WARNING: Using auto-generated JWT_REFRESH_SECRET for development")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours (1440 minutes)
REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7 days

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
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    Create a JWT refresh token with longer expiry
    Uses separate secret key for additional security
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
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
