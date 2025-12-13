import datetime
from enum import Enum
from typing import Optional, Dict, Any

from sqlalchemy import Column, JSON
from sqlmodel import SQLModel, Field, Relationship


class Role(str, Enum):
    admin = "admin"
    clinician = "clinician"
    mental_health = "mental_health"
    patient = "patient"
    nurse = "nurse"
    researcher = "researcher"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role: Role
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    is_active: bool = True

    assessments: list["Assessment"] = Relationship(back_populates="user")


class Assessment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    patient_code: str
    features: Dict[str, Any] = Field(sa_column=Column(JSON))
    probability: float
    label: str
    model_version: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="assessments")
    tasks: list["Task"] = Relationship(back_populates="assessment")


class TaskStatus(str, Enum):
    open = "open"
    completed = "completed"


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    assessment_id: int = Field(foreign_key="assessment.id")
    assigned_to: int = Field(foreign_key="user.id")
    due_date: datetime.date
    status: TaskStatus = TaskStatus.open

    assessment: Optional[Assessment] = Relationship(back_populates="tasks")


class Setting(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str


class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    action: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    meta: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))


