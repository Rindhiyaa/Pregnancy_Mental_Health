# backend/app/models.py
from sqlalchemy import Column, Integer, Float, DateTime, func, String, Boolean, JSON
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=True)
    member_since = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    feature_1 = Column(Float, nullable=False)
    feature_2 = Column(Float, nullable=False)
    prediction = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, nullable=False)
    raw_data = Column(JSON, nullable=False)           # full formData as JSON
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    clinician_risk = Column(String, nullable=True)    # "Low" | "Medium" | "High"
    plan = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    clinician_email = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


