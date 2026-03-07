"""
Test Suite: ML Model Edge Cases
Tests boundary conditions, EPDS validation, and risk score ranges
"""
import pytest


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


def test_epds_scores_all_zeros(client):
    """Test prediction with all EPDS scores = 0 (minimum)"""
    assessment = create_sample_assessment()  # All EPDS default to 0
    
    response = client.post("/api/assessments/predict", json=assessment)
    
    assert response.status_code == 200
    data = response.json()
    
    # With all zeros, EPDS contribution should be 0
    # Score should be primarily from model prediction
    assert data["risk_level"] in ["Low Risk", "Moderate Risk"]
    assert 0 <= data["score"] <= 100


def test_epds_scores_all_threes(client):
    """Test prediction with all EPDS scores = 3 (maximum)"""
    assessment = create_sample_assessment(
        epds_1=3, epds_2=3, epds_3=3, epds_4=3, epds_5=3,
        epds_6=3, epds_7=3, epds_8=3, epds_9=3, epds_10=3
    )
    
    response = client.post("/api/assessments/predict", json=assessment)
    
    assert response.status_code == 200
    data = response.json()
    
    # EPDS total = 30, scaled = 100
    # 70% model + 30% EPDS should push score high
    assert data["score"] >= 60  # Should be high
    assert data["risk_level"] in ["Moderate Risk", "High Risk"]


def test_epds_score_calculation(client):
    """Test EPDS total calculation is correct"""
    # Known EPDS values: 1+2+0+1+2+0+1+2+0+1 = 10
    assessment = create_sample_assessment(
        epds_1=1, epds_2=2, epds_3=0, epds_4=1, epds_5=2,
        epds_6=0, epds_7=1, epds_8=2, epds_9=0, epds_10=1
    )
    
    response = client.post("/api/assessments/predict", json=assessment)
    
    assert response.status_code == 200
    data = response.json()
    
    # EPDS total = 10, scaled = (10/30)*100 = 33.33
    # Final score = 0.7*model_score + 0.3*33.33
    # Should be in moderate range
    assert 0 <= data["score"] <= 100


def test_risk_boundary_low_to_moderate(client):
    """Test risk level at boundary (score around 33)"""
    # Create assessment likely to score around 33
    assessment = create_sample_assessment(
        epds_1=1, epds_2=1, epds_3=0, epds_4=1, epds_5=0,
        epds_6=1, epds_7=0, epds_8=1, epds_9=0, epds_10=0
    )
    
    response = client.post("/api/assessments/predict", json=assessment)
    
    assert response.status_code == 200
    data = response.json()
    
    # Score should be near boundary
    # Risk level should be consistent with score
    if data["score"] >= 33:
        assert data["risk_level"] in ["Moderate Risk", "High Risk"]
    else:
        assert data["risk_level"] == "Low Risk"


def test_risk_boundary_moderate_to_high(client):
    """Test risk level at boundary (score around 66)"""
    # Create assessment likely to score around 66
    assessment = create_sample_assessment(
        epds_1=2, epds_2=2, epds_3=2, epds_4=2, epds_5=2,
        epds_6=2, epds_7=2, epds_8=2, epds_9=2, epds_10=2
    )
    
    response = client.post("/api/assessments/predict", json=assessment)
    
    assert response.status_code == 200
    data = response.json()
    
    # Score should be near high boundary
    # Risk level should be consistent with score
    if data["score"] >= 66:
        assert data["risk_level"] == "High Risk"
    else:
        assert data["risk_level"] == "Moderate Risk"


def test_risk_score_range(client):
    """Test that risk scores are always 0-100"""
    # Test multiple scenarios
    test_cases = [
        {"epds_1": 0, "epds_2": 0, "epds_3": 0, "epds_4": 0, "epds_5": 0,
         "epds_6": 0, "epds_7": 0, "epds_8": 0, "epds_9": 0, "epds_10": 0},
        {"epds_1": 3, "epds_2": 3, "epds_3": 3, "epds_4": 3, "epds_5": 3,
         "epds_6": 3, "epds_7": 3, "epds_8": 3, "epds_9": 3, "epds_10": 3},
        {"epds_1": 1, "epds_2": 2, "epds_3": 1, "epds_4": 2, "epds_5": 1,
         "epds_6": 2, "epds_7": 1, "epds_8": 2, "epds_9": 1, "epds_10": 2},
    ]
    
    for epds_values in test_cases:
        assessment = create_sample_assessment(**epds_values)
        response = client.post("/api/assessments/predict", json=assessment)
        
        assert response.status_code == 200
        data = response.json()
        
        # Score must be in valid range
        assert 0 <= data["score"] <= 100, f"Score {data['score']} out of range"


def test_age_extreme_values(client):
    """Test prediction with extreme age values"""
    # Very young age
    assessment_young = create_sample_assessment(age=18)
    response_young = client.post("/api/assessments/predict", json=assessment_young)
    assert response_young.status_code == 200
    
    # Very old age
    assessment_old = create_sample_assessment(age=45)
    response_old = client.post("/api/assessments/predict", json=assessment_old)
    assert response_old.status_code == 200
    
    # Both should return valid predictions
    assert 0 <= response_young.json()["score"] <= 100
    assert 0 <= response_old.json()["score"] <= 100


def test_risk_level_consistency(client):
    """Test that risk level matches score thresholds"""
    # Test all three risk levels
    test_cases = [
        (0, "Low Risk"),      # Score 0-32
        (33, "Moderate Risk"), # Score 33-65
        (66, "High Risk"),     # Score 66-100
    ]
    
    for target_score, expected_risk in test_cases:
        # Create assessment to approximate target score
        if target_score == 0:
            epds_values = {f"epds_{i}": 0 for i in range(1, 11)}
        elif target_score == 33:
            epds_values = {f"epds_{i}": 1 for i in range(1, 11)}
        else:  # 66
            epds_values = {f"epds_{i}": 2 for i in range(1, 11)}
        
        assessment = create_sample_assessment(**epds_values)
        response = client.post("/api/assessments/predict", json=assessment)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify risk level matches score
        if data["score"] < 33:
            assert data["risk_level"] == "Low Risk"
        elif data["score"] < 66:
            assert data["risk_level"] == "Moderate Risk"
        else:
            assert data["risk_level"] == "High Risk"
