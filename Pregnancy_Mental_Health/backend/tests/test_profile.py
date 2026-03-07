"""
Test Suite: Profile Management
Tests user profile operations (update, delete)
"""
import pytest


def test_update_profile_success(client):
    """Test successful profile update"""
    # Signup
    signup = client.post("/api/signup", json={
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    token = signup.json()["access_token"]
    
    # Update profile
    update_response = client.put("/api/me",
        json={
            "full_name": "John Smith",
            "role": "doctor"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["full_name"] == "John Smith"
    assert data["role"] == "doctor"
    
    # Verify update persisted
    profile_response = client.get("/api/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert profile_response.json()["full_name"] == "John Smith"


def test_update_profile_requires_auth(client):
    """Test that profile update requires authentication"""
    response = client.put("/api/me",
        json={"full_name": "Test User"}
    )
    
    assert response.status_code == 401


def test_delete_account_success(client):
    """Test successful account deletion"""
    # Signup
    signup = client.post("/api/signup", json={
        "first_name": "Delete",
        "last_name": "Me",
        "email": "delete@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    token = signup.json()["access_token"]
    
    # Delete account
    delete_response = client.delete("/api/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert delete_response.status_code == 204
    
    # Verify can't login anymore
    login_response = client.post("/api/login", json={
        "email": "delete@example.com",
        "password": "Pass1234"
    })
    assert login_response.status_code == 401


def test_delete_account_requires_auth(client):
    """Test that account deletion requires authentication"""
    response = client.delete("/api/me")
    
    assert response.status_code == 401
