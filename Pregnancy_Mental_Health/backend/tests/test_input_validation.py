"""
Test Suite: Input Validation
Tests input validation for email format and required fields
"""
import pytest


def test_email_format_validation(client):
    """Test email format validation on signup"""
    # Invalid email formats
    invalid_emails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
        "double@@domain.com",
    ]
    
    for invalid_email in invalid_emails:
        response = client.post("/api/signup", json={
            "first_name": "Test",
            "last_name": "User",
            "email": invalid_email,
            "password": "Pass1234",
            "role": "clinician"
        })
        
        # Should return 422 Unprocessable Entity (Pydantic validation)
        assert response.status_code == 422, f"Email '{invalid_email}' should be rejected"


def test_required_fields_validation(client):
    """Test that all required fields are validated"""
    # Missing required fields
    test_cases = [
        {"first_name": "Test", "email": "test@example.com", "password": "Pass1234"},  # Missing last_name is OK
        {"last_name": "User", "email": "test@example.com", "password": "Pass1234"},   # Missing first_name
        {"first_name": "Test", "last_name": "User", "password": "Pass1234"},          # Missing email
        {"first_name": "Test", "last_name": "User", "email": "test@example.com"},     # Missing password
    ]
    
    for i, incomplete_data in enumerate(test_cases):
        response = client.post("/api/signup", json=incomplete_data)
        
        # Should return 422 for missing required fields
        if "email" not in incomplete_data or "password" not in incomplete_data or "first_name" not in incomplete_data:
            assert response.status_code == 422, f"Test case {i} should reject missing required field"
