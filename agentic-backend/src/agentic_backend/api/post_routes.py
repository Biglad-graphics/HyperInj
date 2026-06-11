from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from datetime import datetime, timezone

from ..models.db_models import Post, CreatorProfile, get_db

router = APIRouter(prefix="/api/v1/creator", tags=["creator"])


# ── Posts ──────────────────────────────────────────────────────────────────

class CreatePostRequest(BaseModel):
    creatorId: str
    title: str
    content: str
    preview: Optional[str] = None
    imageUrl: Optional[str] = None

class PostResponse(BaseModel):
    id: str
    creatorId: str
    title: str
    content: str
    preview: str
    imageUrl: Optional[str]
    createdAt: str

def post_to_response(p: Post) -> dict:
    return {
        "id": p.id,
        "creatorId": p.creator_id,
        "title": p.title,
        "content": p.content,
        "preview": p.preview or p.content[:100] + "…",
        "imageUrl": p.image_url,
        "createdAt": p.created_at.strftime("%Y-%m-%d") if p.created_at else "",
    }

@router.post("/posts")
def create_post(payload: CreatePostRequest, db: Session = Depends(get_db)):
    post = Post(
        id=str(uuid.uuid4()),
        creator_id=payload.creatorId,
        title=payload.title,
        content=payload.content,
        preview=payload.preview or payload.content[:100] + "…",
        image_url=payload.imageUrl,
        created_at=datetime.now(timezone.utc),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post_to_response(post)

@router.get("/posts")
def list_posts(creatorId: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Post)
    if creatorId:
        q = q.filter(Post.creator_id == creatorId)
    posts = q.order_by(Post.created_at.desc()).all()
    return [post_to_response(p) for p in posts]

@router.delete("/posts/{post_id}")
def delete_post(post_id: str, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"ok": True}


# ── Creator Profile ────────────────────────────────────────────────────────

class UpsertCreatorRequest(BaseModel):
    walletAddress: str
    displayName: Optional[str] = None
    bio: Optional[str] = None
    requiredInj: Optional[str] = "5"
    category: Optional[str] = "Creator"

@router.post("/profile")
def upsert_creator(payload: UpsertCreatorRequest, db: Session = Depends(get_db)):
    profile = db.query(CreatorProfile).filter(
        CreatorProfile.wallet_address == payload.walletAddress
    ).first()
    if profile:
        profile.display_name = payload.displayName
        profile.bio = payload.bio
        profile.required_inj = payload.requiredInj
        profile.category = payload.category
        profile.updated_at = datetime.now(timezone.utc)
    else:
        profile = CreatorProfile(
            wallet_address=payload.walletAddress,
            display_name=payload.displayName,
            bio=payload.bio,
            required_inj=payload.requiredInj,
            category=payload.category,
        )
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return {"ok": True, "walletAddress": profile.wallet_address}

@router.get("/profile/{wallet_address}")
def get_creator(wallet_address: str, db: Session = Depends(get_db)):
    profile = db.query(CreatorProfile).filter(
        CreatorProfile.wallet_address == wallet_address
    ).first()
    if not profile:
        return None
    return {
        "walletAddress": profile.wallet_address,
        "displayName": profile.display_name,
        "bio": profile.bio,
        "requiredInj": profile.required_inj,
        "category": profile.category,
    }
