from sqlalchemy import Column, Integer, Float, DateTime, func, String, Boolean, JSON, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=True) # For patient login
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=True) # "doctor", "nurse", "patient"
    first_login = Column(Boolean, default=True) # Force password change for patients
    member_since = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    mood_score = Column(Integer, nullable=False) # 1 to 5
    note = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


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
    patient_email = Column(String, nullable=True) # For patient portal filtering
    
    raw_data = Column(JSON, nullable=False)           # full formData as JSON
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    clinician_risk = Column(String, nullable=True)    # "Low" | "Medium" | "High"
    plan = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    clinician_email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # --- New Fields for Nurse Workflow ---
    nurse_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    doctor_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    
    # Status: draft, submitted, reviewed, complete
    status = Column(String, default="submitted") 
    
    # Final decision (if overridden)
    risk_level_final = Column(String, nullable=True)
    overridden_by = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    override_reason = Column(String, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship to Patient
    patient = relationship("Patient", back_populates="assessments")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    dob = Column(DateTime(timezone=True), nullable=True)
    blood_group = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    
    emergency_name = Column(String, nullable=True)
    emergency_phone = Column(String, nullable=True)
    emergency_relation = Column(String, nullable=True)
    
    pregnancy_week = Column(Integer, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    gravida = Column(Integer, nullable=True)
    para = Column(Integer, nullable=True)
    
    clinician_email = Column(String, nullable=True)
    
    # --- New Fields for Nurse Workflow ---
    created_by_nurse_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    assigned_doctor_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    status = Column(String, default="active") # active, inactive
    
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
    patient_email = Column(String, nullable=True) # For patient portal filtering
    assessment_id = Column(Integer, ForeignKey('assessments.id', ondelete='CASCADE'), nullable=True)
    
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="pending") # pending, completed, missed
    type = Column(String, default="check-in") # first, second, discharge
    notes = Column(String, nullable=True)
    
    clinician_email = Column(String, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to Patient
    patient = relationship("Patient", back_populates="follow_ups")


