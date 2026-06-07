from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from ..models.db_models import User, get_db

router = APIRouter(prefix="/api/v1/user", tags=["users"])


class ApiWallet(BaseModel):
    address: str
    privateKey: str


class RegisterUserRequest(BaseModel):
    uniqueWalletId: str
    walletAddress: str
    apiWallet: Optional[ApiWallet] = None


class UserResponse(BaseModel):
    _id: str
    uniqueWalletId: str
    walletAddress: str
    apiWallet: Optional[dict] = None

    class Config:
        from_attributes = True


@router.post("/register")
def register_user(payload: RegisterUserRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        User.unique_wallet_id == payload.uniqueWalletId
    ).first()

    if existing:
        return {
            "exists": True,
            "data": {
                "_id": existing.id,
                "uniqueWalletId": existing.unique_wallet_id,
                "walletAddress": existing.wallet_address,
                "apiWallet": existing.api_wallet,
            },
        }

    user = User(
        id=str(uuid.uuid4()),
        unique_wallet_id=payload.uniqueWalletId,
        wallet_address=payload.walletAddress,
        api_wallet=payload.apiWallet.model_dump() if payload.apiWallet else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "exists": False,
        "data": {
            "_id": user.id,
            "uniqueWalletId": user.unique_wallet_id,
            "walletAddress": user.wallet_address,
            "apiWallet": user.api_wallet,
        },
    }


@router.get("/{wallet_id}/walletId")
def get_user_by_wallet_id(wallet_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.unique_wallet_id == wallet_id).first()

    if not user:
        return {"exists": False, "data": None}

    return {
        "exists": True,
        "data": {
            "_id": user.id,
            "uniqueWalletId": user.unique_wallet_id,
            "walletAddress": user.wallet_address,
            "apiWallet": user.api_wallet,
        },
    }
