import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, EmailStr

from .models import Role, TaskStatus


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[Role] = None


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Role
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime.datetime


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class FeatureImportance(BaseModel):
    feature: str
    direction: str  # "positive" or "negative"
    magnitude: float
    label: str


class PredictRequest(BaseModel):
    # consolidated schema from the wizard and patient form
    age: Optional[int]
    parity: Optional[int]
    marital_status: Optional[str]
    education_level: Optional[str]
    pregnancy_complications: Optional[str]
    mental_health_history: Optional[str]
    medication: Optional[str]
    obstetric_history: Optional[str]
    social_support_score: Optional[float]
    relationship_satisfaction: Optional[float]
    screening_score: Optional[float]
    sleep_issues: Optional[str]
    stress_level: Optional[str]
    basic_symptoms: Optional[str] = None
    mood: Optional[str] = None
    patient_code: Optional[str] = None


class PredictResponse(BaseModel):
    id: int
    probability: float
    label: str
    model_version: str
    top_features: List[FeatureImportance]
    created_at: datetime.datetime


class AssessmentRead(BaseModel):
    id: int
    patient_code: str
    probability: float
    label: str
    model_version: str
    created_at: datetime.datetime


class TaskCreate(BaseModel):
    assessment_id: int
    assigned_to: int
    due_date: datetime.date
    status: TaskStatus = TaskStatus.open


class TaskRead(BaseModel):
    id: int
    assessment_id: int
    assigned_to: int
    due_date: datetime.date
    status: TaskStatus


class SettingUpdate(BaseModel):
    branding_name: Optional[str] = None
    logo_url: Optional[str] = None
    threshold_high: Optional[float] = None
    threshold_moderate: Optional[float] = None
    helplines: Optional[Dict[str, str]] = None


class AnalyticsSummary(BaseModel):
    risk_distribution: Dict[str, int]
    average_screening_score: float
    feature_importance: List[FeatureImportance]


