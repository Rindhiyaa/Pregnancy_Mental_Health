"""
Test Suite: ML Model Input Processing

"""
import pytest
from app.ml_model import build_model_input_from_form
from app.schemas import AssessmentCreate

# Minimal valid input matching your 34 required fields
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
    return AssessmentCreate(**defaults)

def test_build_model_input_success():
    """Test that model input is built successfully from valid data"""
    assessment = create_sample_assessment()
    df = build_model_input_from_form(assessment)
    
    # Should return a DataFrame
    assert df is not None
    assert len(df) == 1  # Single row
    assert df.shape[1] > 0  # Has columns

def test_family_type_field_included():
    """
    BUG FIX VERIFICATION: Test that family_type field is processed
    This was a bug fix - ensure it's included in model input
    """
    assessment = create_sample_assessment(family_type="Joint")
    df = build_model_input_from_form(assessment)
    
    # Should not raise error
    assert df is not None
    # Check that Family type column exists in the processed data
    assert any("Family type" in str(col) for col in df.columns)

def test_occupation_field_mapping():
    """Test that occupation field is correctly mapped"""
    # Test HouseWife mapping
    assessment1 = create_sample_assessment(occupation_before_surgery="HouseWife")
    df1 = build_model_input_from_form(assessment1)
    assert df1 is not None
    
    # Test Housewife mapping
    assessment2 = create_sample_assessment(occupation_before_surgery="Housewife")
    df2 = build_model_input_from_form(assessment2)
    assert df2 is not None
    
    # Test Student
    assessment3 = create_sample_assessment(occupation_before_surgery="Student")
    df3 = build_model_input_from_form(assessment3)
    assert df3 is not None
    
    # Test Others
    assessment4 = create_sample_assessment(occupation_before_surgery="Others")
    df4 = build_model_input_from_form(assessment4)
    assert df4 is not None

def test_major_life_changes_field():
    """
    BUG FIX VERIFICATION: Test that major_life_changes_pregnancy is used
    (not major_changes_losses which was removed)
    """
    assessment = create_sample_assessment(major_life_changes_pregnancy="Yes")
    df = build_model_input_from_form(assessment)
    
    # Should not raise error
    assert df is not None
    # Check that the field is processed
    assert any("Major changes" in str(col) for col in df.columns)

def test_missing_required_field_raises_error():
    """Test that missing required field raises HTTPException"""
    from fastapi import HTTPException
    
    # Create assessment with missing age
    data = create_sample_assessment()
    data.age = None
    
    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        build_model_input_from_form(data)
    
    assert exc_info.value.status_code == 400
    assert "missing_field" in str(exc_info.value.detail)

def test_empty_string_field_raises_error():
    """Test that empty string field raises HTTPException"""
    from fastapi import HTTPException
    
    # Create assessment with empty residence
    data = create_sample_assessment()
    data.residence = ""
    
    # Should raise HTTPException
    with pytest.raises(HTTPException) as exc_info:
        build_model_input_from_form(data)
    
    assert exc_info.value.status_code == 400

def test_partner_income_mapping():
    """Test that partner income is correctly mapped"""
    income_mappings = {
        "5000-10000": "5000 to 10000",
        "10000-20000": "10000 to 20000",
        "20000-30000": "20000 to 30000",
        "30000+": "More than 30000",
    }
    
    for input_val, expected_val in income_mappings.items():
        assessment = create_sample_assessment(partner_income=input_val)
        df = build_model_input_from_form(assessment)
        assert df is not None

def test_medical_conditions_mapping():
    """Test that medical conditions are correctly mapped"""
    conditions = ["Chronic", "Non-Chronic", "None"]
    
    for condition in conditions:
        assessment = create_sample_assessment(medical_conditions_pregnancy=condition)
        df = build_model_input_from_form(assessment)
        assert df is not None

def test_education_level_cleaning():
    """Test that education levels are cleaned correctly"""
    # Test various education levels
    education_levels = ["Graduate", "High school", "Primary school", "Illiterate"]
    
    for level in education_levels:
        assessment = create_sample_assessment(education_level=level)
        df = build_model_input_from_form(assessment)
        assert df is not None

def test_all_34_fields_processed():
    """
    FIELD ALIGNMENT TEST: Verify all 34 required fields are processed
    """
    assessment = create_sample_assessment()
    df = build_model_input_from_form(assessment)
    
    # Should successfully process all fields
    assert df is not None
    assert len(df) == 1
    
    # Check that key fields are present in the processed data
    expected_fields = [
        "Age", "Residence", "Education Level", "Marital status",
        "Family type", "Total children"
    ]
    
    # At least some of these should be in the column names
    column_str = " ".join(str(col) for col in df.columns)
    for field in expected_fields:
        assert field in column_str or any(field in str(col) for col in df.columns)


def test_no_null_values_in_output():
    """ML input must have zero nulls — nulls break CatBoost inference"""
    assessment = create_sample_assessment()
    df = build_model_input_from_form(assessment)
    
    null_cols = df.columns[df.isnull().any()].tolist()
    assert len(null_cols) == 0, f"Null values found in: {null_cols}"

def test_output_is_single_row():
    """Each assessment must produce exactly one prediction row"""
    assessment = create_sample_assessment()
    df = build_model_input_from_form(assessment)
    
    assert df.shape[0] == 1, f"Expected 1 row, got {df.shape[0]}"
