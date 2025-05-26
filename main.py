from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List
import random
import string

from database import get_db, init_db
import models
import schemas

app = FastAPI(title="Bank Transfer Simulation API")

# Create tables at startup
@app.on_event("startup")
def on_startup():
    init_db()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_account_number():
    """Generate a unique account number"""
    return ''.join(random.choices(string.digits, k=16))

@app.post("/users/individual", response_model=schemas.UserResponse)
def create_individual_user(user: schemas.IndividualUserCreate, db: Session = Depends(get_db)):
    db_user = models.User(
        account_number=generate_account_number(),
        user_type=models.UserType.INDIVIDUAL,
        phone_number=user.phone_number,
        initial_balance=user.initial_balance,
        current_balance=user.initial_balance,
        city=user.city,
        first_name=user.first_name,
        last_name=user.last_name,
        personal_id=user.personal_id,
        jmbg=user.jmbg
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/users/company", response_model=schemas.UserResponse)
def create_company_user(user: schemas.CompanyUserCreate, db: Session = Depends(get_db)):
    db_user = models.User(
        account_number=generate_account_number(),
        user_type=models.UserType.COMPANY,
        phone_number=user.phone_number,
        initial_balance=user.initial_balance,
        current_balance=user.initial_balance,
        city=user.city,
        company_number=user.company_number,
        representative_first_name=user.representative_first_name,
        representative_last_name=user.representative_last_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/transactions", response_model=schemas.TransactionResponse)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    payer = db.query(models.User).filter(models.User.id == transaction.payer_id).first()
    recipient = db.query(models.User).filter(models.User.id == transaction.recipient_id).first()
    
    if not payer or not recipient:
        raise HTTPException(status_code=404, detail="Payer or recipient not found")
    
    if payer.current_balance < transaction.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    db_transaction = models.Transaction(
        payer_id=transaction.payer_id,
        recipient_id=transaction.recipient_id,
        amount=transaction.amount,
        payment_reference=transaction.payment_reference,
        city=transaction.city,
        payment_purpose=transaction.payment_purpose
    )
    
    payer.current_balance -= transaction.amount
    recipient.current_balance += transaction.amount
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.get("/transactions/user/{user_id}", response_model=List[schemas.TransactionResponse])
def get_user_transactions(user_id: int, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).options(
        joinedload(models.Transaction.payer),
        joinedload(models.Transaction.recipient)
    ).filter(
        (models.Transaction.payer_id == user_id) | 
        (models.Transaction.recipient_id == user_id)
    ).all()
    return transactions

@app.get("/users/search/{query}")
def search_users(query: str, db: Session = Depends(get_db)):
    users = db.query(models.User).filter(
        (models.User.first_name.ilike(f"%{query}%")) |
        (models.User.last_name.ilike(f"%{query}%")) |
        (models.User.company_number.ilike(f"%{query}%")) |
        (models.User.account_number.ilike(f"%{query}%"))
    ).all()
    return users

@app.delete("/users/{user_id}", response_model=schemas.UserResponse)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    transactions = db.query(models.Transaction).filter(
        (models.Transaction.payer_id == user_id) | 
        (models.Transaction.recipient_id == user_id)
    ).first()
    
    if transactions:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete user with existing transactions"
        )
    
    db.delete(user)
    db.commit()
    return user
