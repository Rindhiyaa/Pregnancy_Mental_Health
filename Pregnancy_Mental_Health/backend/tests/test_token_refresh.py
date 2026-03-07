"""
Test Suite: Token Refresh & Security
Tests JWT token refresh mechanism and security features
"""
import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.jwt_handler import JWT_SECRET_KEY, JWT_REFRESH_SECRET, ALGORITHM


def test_refresh_token_success(client):
    """Test successful token refresh with valid refresh token"""
    # Signup to get tokens
    response = client.post("/api/signup", json={
        "first_name": "Test",
        "last_name": "User",
        "email": "refresh@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    
    # Extract refresh token from cookie
    assert "refresh_token" in response.cookies
    refresh_token = response.cookies["refresh_token"]
    
    # Call refresh endpoint with cookie
    refresh_response = client.post("/api/refresh",
        cookies={"refresh_token": refresh_token}
    )
    
    assert refresh_response.status_code == 200
    data = refresh_response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    # Verify new access token works
    profile_response = client.get("/api/me",
        headers={"Authorization": f"Bearer {data['access_token']}"}
    )
    assert profile_response.status_code == 200


def test_refresh_token_missing_cookie(client):
    """Test refresh fails without refresh token cookie"""
    response = client.post("/api/refresh")
    
    assert response.status_code == 401
    assert "refresh token not found" in response.json()["detail"].lower()


def test_refresh_token_invalid(client):
    """Test refresh fails with invalid refresh token"""
    # Create fake/invalid token
    fake_token = "invalid.token.here"
    
    response = client.post("/api/refresh",
        cookies={"refresh_token": fake_token}
    )
    
    assert response.status_code == 401


def test_refresh_token_expired(client):
    """Test refresh fails with expired refresh token"""
    # Create expired refresh token
    expired_payload = {
        "sub": "test@example.com",
        "exp": datetime.now(timezone.utc) - timedelta(days=1),  # Expired yesterday
        "type": "refresh"
    }
    expired_token = jwt.encode(expired_payload, JWT_REFRESH_SECRET, algorithm=ALGORITHM)
    
    response = client.post("/api/refresh",
        cookies={"refresh_token": expired_token}
    )
    
    assert response.status_code == 401


def test_refresh_token_wrong_type(client):
    """Test refresh fails when using access token instead of refresh token"""
    # Signup to get access token
    signup = client.post("/api/signup", json={
        "first_name": "Test",
        "last_name": "User",
        "email": "wrongtype@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    access_token = signup.json()["access_token"]
    
    # Try to use access token as refresh token
    response = client.post("/api/refresh",
        cookies={"refresh_token": access_token}
    )
    
    # Should fail because access token uses different secret
    assert response.status_code == 401
