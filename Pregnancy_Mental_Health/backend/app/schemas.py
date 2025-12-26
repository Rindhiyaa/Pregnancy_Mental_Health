from pydantic import BaseModel, EmailStr

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


class AssessmentCreate(BaseModel):
    patient_name: str
    age: int | None = None
    education_level: str | None = None
    employment_status: str | None = None
    delivery_type: str | None = None
    delivery_complications: str | None = None
    past_obstetric: str | None = None
    medical_conditions: str | None = None
    sleep_quality: str | None = None
    anxiety_level: str | None = None
    stress_level: str | None = None
    fatigue_level: str | None = None
    pain_level: str | None = None
    appetite: str | None = None
    energy_level: str | None = None
    history_depression: str | None = None
    history_anxiety: str | None = None
    previous_treatment: str | None = None
    family_support: str | None = None
    partner_support: str | None = None
    major_life_events: str | None = None
    financial_stress: str | None = None
    employment_status_current: str | None = None
    self_harm: str | None = None
    harm_baby: str | None = None
    safety_concern: str | None = None
    clinician_risk: str | None = None
    plan: str | None = None
    notes: str | None = None
    living_situation: str | None = None
    social_network: str | None = None
    additional_support: str | None = None
    relationship_stress: str | None = None
    caregiving_responsibilities: str | None = None
    # EPDS
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

class AssessmentResult(BaseModel):
    risk_level: str
    score: float

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
