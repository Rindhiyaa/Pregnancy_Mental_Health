"""
Test Suite: Password Reset Flow
Tests password reset validation and security
"""
import pytest


def test_reset_password_success(client):
    """Test successful password reset"""
    # Signup
    client.post("/api/signup", json={
        "first_name": "Test",
        "last_name": "User",
        "email": "reset@example.com",
        "password": "OldPass123",
        "role": "clinician"
    })
    
    # Reset password
    reset_response = client.post("/api/reset-password", json={
        "email": "reset@example.com",
        "new_password": "NewPass456"
    })
    
    assert reset_response.status_code == 200
    assert "successful" in reset_response.json()["message"].lower()
    
    # Verify can login with new password
    login_response = client.post("/api/login", json={
        "email": "reset@example.com",
        "password": "NewPass456"
    })
    assert login_response.status_code == 200
    
    # Verify can't login with old password
    old_login = client.post("/api/login", json={
        "email": "reset@example.com",
        "password": "OldPass123"
    })
    assert old_login.status_code == 401


def test_reset_password_validates_length(client):
    """Test password reset validates minimum length"""
    # Signup
    client.post("/api/signup", json={
        "first_name": "Test",
        "last_name": "User",
        "email": "short@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    
    # Try to reset with short password
    response = client.post("/api/reset-password", json={
        "email": "short@example.com",
        "new_password": "Pass12"  # Only 6 characters
    })
    
    assert response.status_code == 400
    assert "8 characters" in response.json()["detail"].lower()


def test_forgot_password_same_response(client):
    """Test forgot password returns same response for existing/non-existing emails"""
    # Create a user
    client.post("/api/signup", json={
        "first_name": "Test",
        "last_name": "User",
        "email": "exists@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    
    # Test with existing email
    response_exists = client.post("/api/forgot-password", json={
        "email": "exists@example.com"
    })
    
    # Test with non-existing email
    response_not_exists = client.post("/api/forgot-password", json={
        "email": "notexists@example.com"
    })
    
    # Both should return same status and similar message
    assert response_exists.status_code == response_not_exists.status_code == 200
    assert "if an account exists" in response_exists.json()["message"].lower()
    assert "if an account exists" in response_not_exists.json()["message"].lower()
