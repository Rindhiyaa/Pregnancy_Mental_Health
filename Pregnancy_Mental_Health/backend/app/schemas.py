from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime


class UserCreate(BaseModel):
    first_name: str
    last_name: str | None = None
    email: EmailStr
    phone_number: str | None = None
    password: str
    role: str # "doctor", "nurse", or "patient"


class UserProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    full_name: str
    email: EmailStr
    phone_number: str | None = None
    role: str | None = None
    member_since: str | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str | None = None
    email: EmailStr
    phone_number: str | None = None
    role: str | None = None
    first_login: bool = True


class LoginRequest(BaseModel):
    email: EmailStr | None = None
    phone_number: str | None = None
    password: str


class MoodEntryCreate(BaseModel):
    mood_score: int
    note: str | None = None


class MoodEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    mood_score: int
    note: str | None = None
    created_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


class ReferralRequest(BaseModel):
    assessment_id: int
    patient_name: str
    risk_level: str
    risk_score: float = 0.0
    clinician_name: str = "Clinician"
    clinician_notes: Optional[str] = None
    referral_department: str = "Psychiatry"
    top_risk_factors: List[str] = []


class AssessmentCreate(BaseModel):
    patient_name: str

    # Section 1 – Demographics
    age: int | None = None
    residence: str | None = None
    education_level: str | None = None
    marital_status: str | None = None
    partner_education: str | None = None
    partner_income: str | None = None
    household_members: str | None = None

    # Section 2 – Relationships & Support
    relationship_inlaws: str | None = None
    relationship_husband: str | None = None
    support_during_pregnancy: str | None = None
    need_more_support: str | None = None
    trust_share_feelings: str | None = None
    family_type: str | None = None

    # Section 3 – Pregnancy History
    total_children_now: str | None = None
    pregnancy_number: str | None = None
    pregnancy_planned: str | None = None
    regular_checkups: str | None = None
    medical_conditions_pregnancy: str | None = None
    occupation_before_surgery: str | None = None

    # Section 4 – Mental Health History
    depression_before_pregnancy: str | None = None
    depression_during_pregnancy: str | None = None
    fear_pregnancy_childbirth: str | None = None
    major_life_changes_pregnancy: str | None = None   # maps from majorlifechangespregnancy
    abuse_during_pregnancy: str | None = None
   

    # Section 6 – EPDS Assessment (kept for frontend, not used by model yet)
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

    # Clinician summary 
    clinician_risk: Optional[str] = None
    plan: Optional[str] = None
    notes: Optional[str] = None


class AssessmentResult(BaseModel):
    risk_level: str       # "Low Risk" | "Moderate Risk" | "High Risk"
    score: float


class AssessmentSave(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    patient_name: str
    patient_id: Optional[int] = None
    risk_level: str
    score: float
    clinician_risk: Optional[str] = None
    plan: Optional[str] = None
    notes: Optional[str] = None
    clinician_email: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
    
    # Nurse workflow fields
    nurse_id: Optional[int] = None
    doctor_id: Optional[int] = None
    status: str = "submitted" # draft, submitted, reviewed, complete
    timestamp: Optional[datetime] = None
    created_at: Optional[datetime] = None

class AssessmentReview(BaseModel):
    risk_level_final: str
    override_reason: Optional[str] = None
    plan: Optional[str] = None
    notes: Optional[str] = None
    status: str = "reviewed" # reviewed, complete


class PredictRequest(BaseModel):
    feature_1: float
    feature_2: float


class PredictResponse(BaseModel):
    prediction: float
    probability: float


class HistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    date: str
    risk: str


class PatientBase(BaseModel):
    name: str
    age: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    dob: Optional[datetime] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_relation: Optional[str] = None
    pregnancy_week: Optional[int] = None
    due_date: Optional[datetime] = None
    gravida: Optional[int] = None
    para: Optional[int] = None

class PatientCreate(PatientBase):
    pass

class PatientOut(PatientBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    clinician_email: Optional[str] = None
    created_at: Optional[datetime] = None
    created_by_nurse_id: Optional[int] = None
    assigned_doctor_id: Optional[int] = None
    status: str = "active"

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    dob: Optional[datetime] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_relation: Optional[str] = None
    pregnancy_week: Optional[int] = None
    due_date: Optional[datetime] = None
    gravida: Optional[int] = None
    para: Optional[int] = None
    assigned_doctor_id: Optional[int] = None
    status: Optional[str] = None
