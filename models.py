from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class UserType(enum.Enum):
    INDIVIDUAL = "individual"
    COMPANY = "company"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String(20), unique=True, index=True)
    user_type = Column(Enum(UserType))
    
    # Common fields
    phone_number = Column(String(20))
    initial_balance = Column(Float)
    current_balance = Column(Float)
    city = Column(String(100))
    
    # Individual specific fields
    first_name = Column(String(100))
    last_name = Column(String(100))
    personal_id = Column(String(9))
    jmbg = Column(String(13))
    
    # Company specific fields
    company_number = Column(String(20))
    representative_first_name = Column(String(100))
    representative_last_name = Column(String(100))
    
    # Relationships
    sent_transactions = relationship("Transaction", foreign_keys="Transaction.payer_id", back_populates="payer")
    received_transactions = relationship("Transaction", foreign_keys="Transaction.recipient_id", back_populates="recipient")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    payer_id = Column(Integer, ForeignKey("users.id"))
    recipient_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    payment_reference = Column(String(50))
    city = Column(String(100))
    date = Column(DateTime, default=datetime.utcnow)
    payment_purpose = Column(String(200))
    
    # Relationships
    payer = relationship("User", foreign_keys=[payer_id], back_populates="sent_transactions")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_transactions") 