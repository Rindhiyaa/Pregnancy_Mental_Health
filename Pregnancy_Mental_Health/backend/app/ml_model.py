# backend/app/ml_model.py
from pathlib import Path
from typing import Any, Dict

from catboost import CatBoostClassifier
import joblib
import pandas as pd
from fastapi import HTTPException

BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "model_files"

MODEL_PATH = MODEL_DIR / "catboost_epds_model.cbm"
FEATURE_COLS_PATH = MODEL_DIR / "feature_columns.pkl"

model = CatBoostClassifier()
model.load_model(str(MODEL_PATH))

# list of column names in training order
feature_columns = joblib.load(str(FEATURE_COLS_PATH))  # [file:14]


def _require(value: Any, field_name: str) -> Any:
    """Strictly require a value from Pydantic model; no defaults."""
    if value is None or value == "" or value == "Select":
        raise HTTPException(
            status_code=400,
            detail={
                "error": "missing_field",
                "field": field_name,
                "message": f"{field_name} is required.",
            },
        )
    return value


def build_model_input_from_form(data) -> pd.DataFrame:
    """
    Build a 1-row DataFrame from the FastAPI schema instance `data`,
    performing only the same cleaning/mapping as in training.
    No automatic defaults are applied.
    """

    # Map raw Pydantic fields → training column names, but without defaults
    row: Dict[str, Any] = {
        "Age": _require(data.age, "age"),
        "Residence": _require(data.residence, "residence"),
        "Education Level": _require(data.education_level, "education_level"),
        "Marital status": _require(data.marital_status, "marital_status"),
        "Husband's education level": _require(
            data.partner_education, "partner_education"
        ),
        "Husband's monthly income": {
            "5000-10000": "5000 to 10000",
            "10000-20000": "10000 to 20000",
            "20000-30000": "20000 to 30000",
            "30000+": "More than 30000",
            ">30000": "More than 30000",
        }.get(
            _require(data.partner_income, "partner_income"),
            "More than 30000",  # only mapping fallback, not empty/default
        ),
        "Total children": _require(data.total_children_now, "total_children_now"),
        "Family type": _require(data.family_type, "family_type"),
        "Number of household members": _require(
            data.household_members, "household_members"
        ),
        "Relationship with the in-laws": _require(
            data.relationship_inlaws, "relationship_inlaws"
        ),
        "Relationship with husband": _require(
            data.relationship_husband, "relationship_husband"
        ),
        "Recieved Support": _require(
            data.support_during_pregnancy, "support_during_pregnancy"
        ),
        "Need for Support": _require(
            data.need_more_support, "need_more_support"
        ),
        "Major changes or losses during pregnancy": _require(
            data.major_changes_losses, "major_changes_losses"
        ),
        "Abuse": _require(data.abuse_during_pregnancy, "abuse_during_pregnancy"),
        "Trust and share feelings": _require(
            data.trust_share_feelings, "trust_share_feelings"
        ),
        "Number of the latest pregnancy": int(
            _require(data.pregnancy_number, "pregnancy_number")
        ),
        "Pregnancy length": {
            "Less than 5m": "Less than 5 months",
            "6m": "6 months",
            "7m": "7 months",
            "8m": "8 months",
            "9m": "9 months",
            "10m": "10 months",
        }.get(
            _require(data.pregnancy_length, "pregnancy_length"),
            "9 months",  # mapping fallback only
        ),
        "Pregnancy plan": _require(
            data.pregnancy_planned, "pregnancy_planned"
        ),
        "Regular checkups": _require(
            data.regular_checkups, "regular_checkups"
        ),
        "Fear of pregnancy": _require(
            data.fear_pregnancy_childbirth, "fear_pregnancy_childbirth"
        ),
        "Diseases during pregnancy": {
            "Chronic": "Chronic Disease",
            "Non-Chronic": "Non-Chronic Disease",
            "None": "Non-Chronic Disease",
        }.get(
            _require(
                data.medical_conditions_pregnancy,
                "medical_conditions_pregnancy",
            ),
            "Non-Chronic Disease",
        ),
        "Depression before pregnancy (PHQ2)": _require(
            data.depression_before_pregnancy, "depression_before_pregnancy"
        ),
        "Depression during pregnancy (PHQ2)": _require(
            data.depression_during_pregnancy, "depression_during_pregnancy"
        ),
    }

    df = pd.DataFrame([row])

    # Same cleaning as training notebook [file:14]
    for col in ["Education Level", "Husband's education level"]:
        if col in df.columns:
            df[col] = df[col].replace(
                {
                    "High school": "High School",
                    "Primary school": "Primary School",
                }
            )

    if "Diseases during pregnancy" in df.columns:
        df["Diseases during pregnancy"] = df["Diseases during pregnancy"].replace(
            {
                "Non-chronic disease": "Non-Chronic Disease",
                "Chronic disease": "Chronic Disease",
            }
        )

    if "Total children" in df.columns:
        df["Total children"] = df["Total children"].replace(
            {
                "More than Two": "More than two",
            }
        )

    # Pregnancy length mapping (string → numeric) [file:14]
    length_map = {
        "Less than 5 months": 1,
        "6 months": 2,
        "7 months": 3,
        "8 months": 4,
        "9 months": 5,
        "10 months": 6,
    }
    df["Pregnancy length"] = df["Pregnancy length"].map(length_map)

    # One-hot encode + align to training columns, if you use that pattern [file:14]
    X_encoded = pd.get_dummies(df, drop_first=False)
    for col in feature_columns:
        if col not in X_encoded.columns:
            X_encoded[col] = 0
    extra_cols = [c for c in X_encoded.columns if c not in feature_columns]
    if extra_cols:
        X_encoded = X_encoded.drop(columns=extra_cols)
    X_encoded = X_encoded[feature_columns]

    return X_encoded
