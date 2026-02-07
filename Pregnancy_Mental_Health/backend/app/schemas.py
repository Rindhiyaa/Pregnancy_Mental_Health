from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class UserCreate(BaseModel):
    first_name: str
    last_name: str | None = None
    email: EmailStr
    password: str
    role: str | None = None

class UserProfileOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str | None = None
    member_since: str | None = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None

class UserOut(BaseModel):
    id: int
    first_name: str
    last_name: str | None = None
    email: EmailStr
    role: str | None = None

    class Config:
        from_attributes = True  # instead of orm_mode = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


class AssessmentCreate(BaseModel):
    patient_name: str
    
    # Section 1: Demographics (7 questions)
    age: int | None = None
    residence: str | None = None
    education_level: str | None = None
    marital_status: str | None = None
    partner_education: str | None = None
    partner_income: str | None = None
    household_members: str | None = None
    
    # Section 2: Relationships & Support (6 questions)
    relationship_inlaws: str | None = None
    relationship_husband: str | None = None
    support_during_pregnancy: str | None = None
    need_more_support: str | None = None
    major_changes_losses: str | None = None
    trust_share_feelings: str | None = None
    
    # Section 3: Pregnancy History (6 questions)
    total_children_now: str | None = None
    pregnancy_number: str | None = None
    pregnancy_length: str | None = None
    pregnancy_planned: str | None = None
    regular_checkups: str | None = None
    medical_conditions_pregnancy: str | None = None
    
    # Section 4: Mental Health History (6 questions)
    depression_before_pregnancy: str | None = None
    depression_during_pregnancy: str | None = None
    fear_pregnancy_childbirth: str | None = None
    major_life_changes_pregnancy: str | None = None
    abuse_during_pregnancy: str | None = None
    family_type: str | None = None
    
    # Section 5: Current Mental State (6 questions)
    feeling_about_motherhood: str | None = None
    angry_irritable_since_pregnancy: str | None = None
    feeling_daily_activities: str | None = None
    sleep_quality_since_pregnancy: str | None = None
    anxiety_level_now: str | None = None
    stress_level_now: str | None = None
    
    # Section 6: EPDS-10 Assessment (10 questions)
    epds_1: int | None = None
    epds_2: int | None = None
    epds_3: int | None = None
    epds_4: int | None = None
    epds_5: int | None = None
    epds_6: int | None = None
    epds_7: int | None = None
    epds_8: int | None = None
    epds_9: int | None = None
    epds_10: int | None = None
    
    # Clinician fields
    clinician_risk: str | None = None
    plan: str | None = None
    notes: str | None = None

class AssessmentResult(BaseModel):
    risk_level: str
    score: float

class AssessmentSave(BaseModel):
    patient_name: str
    risk_level: str          # "Low Risk" | "Moderate Risk" | "High Risk"
    score: float
    clinician_risk: Optional[str] = None
    plan: Optional[str] = None
    notes: Optional[str] = None
    clinician_email: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None


class PredictRequest(BaseModel):
    feature_1: float
    feature_2: float

class PredictResponse(BaseModel):
    prediction: float
    probability: float

class HistoryItem(BaseModel):
    id: int
    name: str
    date: str
    risk: str

    class Config:
        from_attributes = True  
