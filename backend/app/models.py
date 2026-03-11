from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str # 'patient' or 'dermatologist'

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str = Field(alias="_id")

class AnalysisResult(BaseModel):
    disease_name: str
    confidence: float
    description: str
    severity: str
    recommendation: str

class Review(BaseModel):
    doctor_id: str
    doctor_name: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Report(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    patient_id: str
    patient_name: str
    image_data: str # base64
    analysis: AnalysisResult
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    reviews: List[Review] = []

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
