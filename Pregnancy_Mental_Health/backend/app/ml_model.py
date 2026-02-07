# backend/app/ml_model.py
from pathlib import Path
from catboost import CatBoostClassifier
import joblib
import pandas as pd

BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "model_files"

MODEL_PATH = MODEL_DIR / "catboost_epds_model.cbm"
FEATURE_COLS_PATH = MODEL_DIR / "feature_columns.pkl"

model = CatBoostClassifier()
model.load_model(str(MODEL_PATH))

feature_columns = joblib.load(str(FEATURE_COLS_PATH))  # list of column names

def build_model_input_from_form(data) -> pd.DataFrame:
    row = {
        "Age": data.age or 25,
        "Residence": data.residence or "City",
        "Education Level": data.education_level or "University",
        "Marital status": data.marital_status or "Married",
        "Occupation before latest pregnancy": "Housewife",  # or map from a field
        "Husband's education level": data.partner_education or "University",
        "Husband's monthly income": {
            "5000-10000": "5000 to 10000",
            "10000-20000": "10000 to 20000",
            "20000-30000": "20000 to 30000",
            "30000+": "More than 30000",
            ">30000": "More than 30000",
        }.get(data.partner_income or ">30000", "More than 30000"),
        "Total children": data.total_children_now or "One",
        "Family type": data.family_type or "Nuclear",
        "Number of household members": data.household_members or "2 to 5",
        "Relationship with the in-laws": data.relationship_inlaws or "Neutral",
        "Relationship with husband": data.relationship_husband or "Good",
        "Recieved Support": data.support_during_pregnancy or "Medium",
        "Need for Support": data.need_more_support or "Medium",
        "Major changes or losses during pregnancy": data.major_changes_losses or "No",
        "Abuse": data.abuse_during_pregnancy or "No",
        "Trust and share feelings": data.trust_share_feelings or "Yes",
        "Number of the latest pregnancy": int(data.pregnancy_number or 1),
        "Pregnancy length": {
            "Less than 5m": "Less than 5 months",
            "6m": "6 months",
            "7m": "7 months",
            "8m": "8 months",
            "9m": "9 months",
            "10m": "10 months",
        }.get(data.pregnancy_length or "9m", "9 months"),
        "Pregnancy plan": data.pregnancy_planned or "Yes",
        "Regular checkups": data.regular_checkups or "Yes",
        "Fear of pregnancy": data.fear_pregnancy_childbirth or "No",
        "Diseases during pregnancy": {
            "Chronic": "Chronic Disease",
            "Non-Chronic": "Non-Chronic Disease",
            "None": "Non-Chronic Disease",
        }.get(data.medical_conditions_pregnancy or "Non-Chronic", "Non-Chronic Disease"),
        "Depression before pregnancy (PHQ2)": data.depression_before_pregnancy or "Negative",
        "Depression during pregnancy (PHQ2)": data.depression_during_pregnancy or "Negative",
    }

    df = pd.DataFrame([row])


    # Same cleaning as in training
    for col in ["Education Level", "Husband's education level"]:
        df[col] = df[col].replace({
            "High school": "High School",
            "Primary school": "Primary School",
        })

    df["Diseases during pregnancy"] = df["Diseases during pregnancy"].replace({
        "Non-chronic disease": "Non-Chronic Disease",
        "Chronic disease": "Chronic Disease",
    })

    df["Total children"] = df["Total children"].replace({
        "More than Two": "More than two",
    })

    # Pregnancy length mapping
    length_map = {
        "Less than 5 months": 1,
        "6 months": 2,
        "7 months": 3,
        "8 months": 4,
        "9 months": 5,
        "10 months": 6,
    }
    df["Pregnancy length"] = df["Pregnancy length"].map(length_map)

    return df
