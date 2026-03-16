from sqlalchemy import Column, Integer, Float, DateTime, func, String, Boolean, JSON, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
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
    patient_id = Column(BigInteger, ForeignKey('patients.id', ondelete='CASCADE'), nullable=True)
    
    raw_data = Column(JSON, nullable=False)           # full formData as JSON
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    clinician_risk = Column(String, nullable=True)    # "Low" | "Medium" | "High"
    plan = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    clinician_email = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to Patient
    patient = relationship("Patient", back_populates="assessments")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    clinician_email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to Assessments
    assessments = relationship("Assessment", back_populates="patient", cascade="all, delete-orphan", passive_deletes=True)
    follow_ups = relationship("FollowUp", back_populates="patient", cascade="all, delete-orphan", passive_deletes=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info") # alert, success, info
    priority = Column(String, default="medium") # high, medium, low
    is_read = Column(Boolean, default=False)
    clinician_email = Column(String, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(BigInteger, ForeignKey('patients.id', ondelete='CASCADE'), nullable=False)
    assessment_id = Column(Integer, ForeignKey('assessments.id', ondelete='CASCADE'), nullable=True)
    
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="pending") # pending, completed, missed
    type = Column(String, default="check-in") # first, second, discharge
    notes = Column(String, nullable=True)
    
    clinician_email = Column(String, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to Patient
    patient = relationship("Patient", back_populates="follow_ups")


