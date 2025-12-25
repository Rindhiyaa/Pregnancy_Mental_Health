from pydantic import BaseModel

from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    first_name: str
    last_name: str | None = None
    email: EmailStr
    password: str
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
