"""
Test Suite: Assessment Endpoints
Tests prediction, save, list, and delete assessment functionality
"""
import pytest
from app.schemas import AssessmentCreate


def create_sample_assessment(**overrides):
    """Helper to create sample assessment with overrides"""
    defaults = {
        "patient_name": "Test Patient",
        "age": 28,
        "residence": "Urban",
        "education_level": "Graduate",
        "marital_status": "Married",
        "partner_education": "Graduate",
        "partner_income": "10000-20000",
        "household_members": "4",
        "relationship_inlaws": "Good",
        "relationship_husband": "Good",
        "support_during_pregnancy": "Yes",
        "need_more_support": "No",
        "trust_share_feelings": "Yes",
        "family_type": "Nuclear",
        "total_children_now": "1",
        "pregnancy_number": "1",
        "pregnancy_planned": "Yes",
        "regular_checkups": "Yes",
        "medical_conditions_pregnancy": "None",
        "occupation_before_surgery": "Housewife",
        "depression_before_pregnancy": "No",
        "depression_during_pregnancy": "No",
        "fear_pregnancy_childbirth": "No",
        "major_life_changes_pregnancy": "No",
        "abuse_during_pregnancy": "No",
        "epds_1": 0,
        "epds_2": 0,
        "epds_3": 0,
        "epds_4": 0,
        "epds_5": 0,
        "epds_6": 0,
        "epds_7": 0,
        "epds_8": 0,
        "epds_9": 0,
        "epds_10": 0,
    }
    defaults.update(overrides)
    return defaults


def test_predict_assessment_success(client):
    """Test successful risk prediction"""
    assessment = create_sample_assessment()
    
    response = client.post("/api/assessments/predict", json=assessment)
    
    assert response.status_code == 200
    data = response.json()
    assert "risk_level" in data
    assert "score" in data
    assert data["risk_level"] in ["Low Risk", "Moderate Risk", "High Risk"]
    assert 0 <= data["score"] <= 100


def test_predict_assessment_high_risk(client):
    """Test high-risk prediction (EPDS scores all 3)"""
    # All EPDS scores at maximum (3) should indicate high risk
    assessment = create_sample_assessment(
        epds_1=3, epds_2=3, epds_3=3, epds_4=3, epds_5=3,
        epds_6=3, epds_7=3, epds_8=3, epds_9=3, epds_10=3
    )
    
    response = client.post("/api/assessments/predict", json=assessment)
    
    assert response.status_code == 200
    data = response.json()
    # With all EPDS = 3, score should be high
    assert data["score"] >= 66  # High risk threshold


def test_predict_assessment_low_risk(client):
    """Test low-risk prediction (EPDS scores all 0)"""
    # All EPDS scores at 0 should indicate low risk
    assessment = create_sample_assessment()  # defaults to all 0
    
    response = client.post("/api/assessments/predict", json=assessment)
    
    assert response.status_code == 200
    data = response.json()
    # With all EPDS = 0, score should be low
    assert data["score"] < 66  # Below high risk threshold


def test_predict_assessment_moderate_risk(client):
    """Test moderate-risk prediction (mixed EPDS scores)"""
    # Mixed EPDS scores should give moderate risk
    assessment = create_sample_assessment(
        epds_1=1, epds_2=1, epds_3=1, epds_4=1, epds_5=1,
        epds_6=1, epds_7=1, epds_8=1, epds_9=1, epds_10=1
    )
    
    response = client.post("/api/assessments/predict", json=assessment)
    
    assert response.status_code == 200
    data = response.json()
    # Score should be in moderate range
    assert 33 <= data["score"] < 66


def test_save_assessment_requires_auth(client):
    """Test that saving assessment requires authentication"""
    payload = {
        "patient_name": "Test Patient",
        "risk_level": "Low Risk",
        "score": 25.5,
        "clinician_email": "test@example.com"
    }
    
    # No Authorization header
    response = client.post("/api/assessments", json=payload)
    
    assert response.status_code == 401


def test_save_assessment_success(client):
    """Test successful assessment save"""
    # First signup to get token
    signup = client.post("/api/signup", json={
        "first_name": "Test",
        "last_name": "Clinician",
        "email": "clinician@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    token = signup.json()["access_token"]
    
    # Save assessment
    payload = {
        "patient_name": "Jane Doe",
        "risk_level": "Moderate Risk",
        "score": 45.5,
        "clinician_email": "clinician@example.com"
    }
    
    response = client.post("/api/assessments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["patient_name"] == "Jane Doe"
    assert data["risk_level"] == "Moderate Risk"
    assert data["score"] == 45.5
    assert "id" in data
    assert "date" in data


def test_save_assessment_with_clinician_notes(client):
    """Test saving assessment with clinician notes and plan"""
    # Signup
    signup = client.post("/api/signup", json={
        "first_name": "Dr",
        "last_name": "Smith",
        "email": "dr.smith@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    token = signup.json()["access_token"]
    
    # Save assessment with notes
    payload = {
        "patient_name": "Mary Johnson",
        "risk_level": "High Risk",
        "score": 75.0,
        "clinician_risk": "High",
        "plan": "Weekly therapy sessions, medication review",
        "notes": "Patient shows signs of severe anxiety",
        "clinician_email": "dr.smith@example.com"
    }
    
    response = client.post("/api/assessments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["clinician_risk"] == "High"
    assert data["plan"] == "Weekly therapy sessions, medication review"
    assert data["notes"] == "Patient shows signs of severe anxiety"


def test_list_assessments_requires_auth(client):
    """Test that listing assessments requires authentication"""
    response = client.get("/api/assessments")
    
    assert response.status_code == 401


def test_list_assessments_filters_by_clinician(client):
    """Test that clinicians only see their own assessments"""
    # Create two clinicians
    signup1 = client.post("/api/signup", json={
        "first_name": "Clinician",
        "last_name": "One",
        "email": "clinician1@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    token1 = signup1.json()["access_token"]
    
    signup2 = client.post("/api/signup", json={
        "first_name": "Clinician",
        "last_name": "Two",
        "email": "clinician2@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    token2 = signup2.json()["access_token"]
    
    # Clinician 1 saves an assessment
    client.post("/api/assessments",
        json={
            "patient_name": "Patient A",
            "risk_level": "Low Risk",
            "score": 20.0,
            "clinician_email": "clinician1@example.com"
        },
        headers={"Authorization": f"Bearer {token1}"}
    )
    
    # Clinician 2 saves an assessment
    client.post("/api/assessments",
        json={
            "patient_name": "Patient B",
            "risk_level": "High Risk",
            "score": 80.0,
            "clinician_email": "clinician2@example.com"
        },
        headers={"Authorization": f"Bearer {token2}"}
    )
    
    # Clinician 1 lists assessments - should only see their own
    response1 = client.get("/api/assessments",
        headers={"Authorization": f"Bearer {token1}"}
    )
    data1 = response1.json()
    assert len(data1) == 1
    assert data1[0]["patient_name"] == "Patient A"
    
    # Clinician 2 lists assessments - should only see their own
    response2 = client.get("/api/assessments",
        headers={"Authorization": f"Bearer {token2}"}
    )
    data2 = response2.json()
    assert len(data2) == 1
    assert data2[0]["patient_name"] == "Patient B"


def test_delete_assessment_success(client):
    """Test successful assessment deletion"""
    # Signup
    signup = client.post("/api/signup", json={
        "first_name": "Test",
        "last_name": "User",
        "email": "delete@example.com",
        "password": "Pass1234",
        "role": "clinician"
    })
    token = signup.json()["access_token"]
    
    # Save assessment
    save_response = client.post("/api/assessments",
        json={
            "patient_name": "To Delete",
            "risk_level": "Low Risk",
            "score": 15.0,
            "clinician_email": "delete@example.com"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assessment_id = save_response.json()["id"]
    
    # Delete assessment
    delete_response = client.delete(f"/api/assessments/{assessment_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert delete_response.status_code == 204
    
    # Verify it's deleted - list should be empty
    list_response = client.get("/api/assessments",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert len(list_response.json()) == 0
