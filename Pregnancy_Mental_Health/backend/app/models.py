from sqlalchemy import Column, Integer, Float, DateTime, func, String, Boolean, JSON, ForeignKey, BigInteger, Date, Time
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=True)
    first_login = Column(Boolean, default=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    member_since = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)

    # explicitly use Patient.user_id as the FK for this relationship
    patient_profile = relationship(
        "Patient",
        back_populates="user",
        uselist=False,
        foreign_keys="Patient.user_id",
    )


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
    epds_score = Column(Integer, nullable=True)
    

    # --- New Fields for Nurse Workflow ---
    nurse_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
   # doctor_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Status: draft, submitted, reviewed, complete
    status = Column(String, default="submitted") 
    
    # SHAP top risk factors — computed once at submission, read by doctor
    top_risk_factors = Column(JSON, nullable=True)

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

    # main link to portal user
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship(
        "User",
        back_populates="patient_profile",
        foreign_keys=[user_id],
    )

    # other user links (doctor/nurse) – keep as plain FKs, no back_populates here
    created_by_nurse_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    assigned_doctor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    doctor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    status = Column(String, default="active")
    previous_pregnancies = Column(Integer, nullable=True)
    hospital_name = Column(String, nullable=True)
    ward_bed = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assessments = relationship(
        "Assessment",
        back_populates="patient",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    follow_ups = relationship(
        "FollowUp",
        back_populates="patient",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


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

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    user_name = Column(String, nullable=False)      # or a FK to users
    action = Column(String, nullable=False)
    details = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    date = Column(Date, nullable=False)
    time = Column(Time, nullable=False)

    type = Column(String, default="Follow-up")      # e.g. "Follow-up", "Urgent Review"
    notes = Column(String, nullable=True)
    urgency = Column(String, default="Routine")     # "Routine", "Urgent", etc.
    department = Column(String, default="OBGYN")

    patient = relationship("Patient", backref="appointments")
    doctor = relationship("User", backref="appointments")


class RecoveryRequest(Base):
    __tablename__ = "recovery_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_email = Column(String, nullable=False, index=True)
    user_role = Column(String(20), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending", index=True)
    requested_from_ip = Column(String(64), nullable=True)
    requested_user_agent = Column(String, nullable=True)
    approved_by_admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    challenges = relationship("RecoveryChallenge", back_populates="request", cascade="all, delete-orphan")


class RecoveryChallenge(Base):
    __tablename__ = "recovery_challenges"

    id = Column(Integer, primary_key=True, index=True)
    recovery_request_id = Column(Integer, ForeignKey("recovery_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    used_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    attempt_count = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    device_id = Column(String, nullable=True)
    push_subscription_id = Column(String, nullable=True)
    created_by_admin_ip = Column(String(64), nullable=True)
    used_from_ip = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    request = relationship("RecoveryRequest", back_populates="challenges")


