from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from models import UserType

class UserBase(BaseModel):
    phone_number: str
    initial_balance: float
    city: str

class IndividualUserCreate(UserBase):
    first_name: str
    last_name: str
    personal_id: str = Field(..., min_length=9, max_length=9)
    jmbg: str = Field(..., min_length=13, max_length=13)

    @validator('jmbg')
    def validate_jmbg(cls, v):
        if not v.isdigit():
            raise ValueError('JMBG must contain only digits')
        return v

    @validator('personal_id')
    def validate_personal_id(cls, v):
        if not v.isalnum():
            raise ValueError('Personal ID must be alphanumeric')
        return v

class CompanyUserCreate(UserBase):
    company_number: str
    representative_first_name: str
    representative_last_name: str

class UserResponse(BaseModel):
    id: int
    account_number: str
    user_type: UserType
    phone_number: str
    current_balance: float
    city: str
    
    # Individual fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    personal_id: Optional[str] = None
    jmbg: Optional[str] = None
    
    # Company fields
    company_number: Optional[str] = None
    representative_first_name: Optional[str] = None
    representative_last_name: Optional[str] = None

    class Config:
        from_attributes = True

class TransactionCreate(BaseModel):
    payer_id: int
    recipient_id: int
    amount: float = Field(..., gt=0)
    payment_reference: str
    city: str
    payment_purpose: str

class TransactionResponse(BaseModel):
    id: int
    payer_id: int
    recipient_id: int
    amount: float
    payment_reference: str
    city: str
    date: datetime
    payment_purpose: str
    payer: UserResponse
    recipient: UserResponse

    class Config:
        from_attributes = True 