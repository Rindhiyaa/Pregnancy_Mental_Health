from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime


class AuditLogCreate(BaseModel):
    action: str
    details: str
    ip_address: Optional[str] = None

class AuditLog(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_name: str
    action: str
    details: str
    ip_address: Optional[str] = None
    timestamp: datetime

class UserCreate(BaseModel):
    first_name: str
    last_name: str | None = None
    email: str
    phone_number: str | None = None
    password: str
    role: str # "doctor", "nurse", or "patient"
    hospital_name: str | None = None
    department: str | None = None
    designation: str | None = None
    specialization: str | None = None
    ward: Optional[str] = None
    years_of_experience: Optional[int] = None

    @field_validator('email')
    def validate_and_normalize_email(cls, v):
        if not isinstance(v, str):
            return v
        cleaned = v.strip().lower()
        if '@' not in cleaned or '.' not in cleaned.split('@')[-1]:
            raise ValueError('Invalid email format: part after @-sign must contain a period.')
        return cleaned


class UserProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    full_name: str
    email: str
    phone_number: str | None = None
    role: str | None = None
    hospital_name: str | None = None
    department: str | None = None
    designation: str | None = None
    specialization: str | None = None
    member_since: str | None = None
    ward: Optional[str] = None
    years_of_experience: Optional[int] = None
    last_active: Optional[datetime] = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    role: str | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    first_name: str
    last_name: str | None = None
    email: str
    phone_number: str | None = None
    role: str | None = None
    first_login: bool = True
    is_active: bool 
    specialization: Optional[str] = None
    hospital_name: str | None = None
    department: str | None = None
    designation: str | None = None
    specialization: str | None = None
    ward: Optional[str] = None
    years_of_experience: Optional[int] = None
    member_since: Optional[datetime] = None  # <-- add this line
    last_active: Optional[datetime] = None
    is_online: Optional[bool] = False


class LoginRequest(BaseModel):
    email: str | None = None
    phone_number: str | None = None
    password: str

    @field_validator('email')
    def validate_and_normalize_email(cls, v):
        if v is None:
            return v
        cleaned = v.strip().lower()
        if '@' not in cleaned or '.' not in cleaned.split('@')[-1]:
            raise ValueError('Invalid email format: part after @-sign must contain a period.')
        return cleaned


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
    email: str

    @field_validator('email')
    def validate_and_normalize_email(cls, v):
        cleaned = v.strip().lower()
        if '@' not in cleaned or '.' not in cleaned.split('@')[-1]:
            raise ValueError('Invalid email format: part after @-sign must contain a period.')
        return cleaned

class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str

    @field_validator('email')
    def validate_and_normalize_email(cls, v):
        cleaned = v.strip().lower()
        if '@' not in cleaned or '.' not in cleaned.split('@')[-1]:
            raise ValueError('Invalid email format: part after @-sign must contain a period.')
        return cleaned

class ChangePasswordRequest(BaseModel):
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

class NurseAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: Optional[int] = None
    patient_name: str
    created_at: Optional[datetime] = None
    status: str
    risk_level: str
    risk_score: float

    #doctor_id: Optional[int] = None
    assigned_doctor_id: Optional[int] = None

class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    date: str
    time: str
    type: str
    notes: Optional[str]
    urgency: str


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
    model_config = ConfigDict(from_attributes=True)  # Keep this
    
    id: Optional[int] = None
    patient_name: str
    patient_id: Optional[int] = None
    patient_email: Optional[str] = None
    
    risk_level: str
    risk_score: Optional[float] = None
    clinician_risk: Optional[str] = None
    plan: Optional[str] = None
    notes: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None
    clinician_email: Optional[str] = None
    
    nurse_id: Optional[int] = None
    doctor_id: Optional[int] = None
    assigned_doctor_id: Optional[int] = None
    
    status: str = "submitted"
    risk_level_final: Optional[str] = None
    overridden_by: Optional[int] = None
    override_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    
    created_at: Optional[datetime] = None
    
    # DELETE THIS ENTIRE BLOCK:
    # class Config:
    #     from_attributes = True

class AssessmentReview(BaseModel):
    risk_level_final: str
    override_reason: Optional[str] = None
    plan: Optional[str] = None
    notes: Optional[str] = None
    status: str = "reviewed" # reviewed, complete


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    priority: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


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


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = None
    hospital_name: str | None = None
    department: str | None = None
    designation: str | None = None
    specialization: str | None = None
    ward: Optional[str] = None
    years_of_experience: Optional[int] = None

class RecoveryRequestCreate(BaseModel):
    email: EmailStr

class RecoveryRequestOut(BaseModel):
    id: int
    user_email: EmailStr
    user_role: str
    status: str
    requested_from_ip: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class RecoveryVerifyIn(BaseModel):
    email: EmailStr
    code: str
    new_password: str
    device_id: Optional[str] = None

class ApproveRecoveryResponse(BaseModel):
    message: str
    request_id: int
    expires_at: datetime

class GenericMessage(BaseModel):
    message: str
    auto_approved: Optional[bool] = None
    code: Optional[str] = None