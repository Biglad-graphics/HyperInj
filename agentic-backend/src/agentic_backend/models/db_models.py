from sqlalchemy import Column, String, DateTime, JSON, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime, timezone
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hyperinj.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    unique_wallet_id = Column(String, unique=True, index=True, nullable=False)
    wallet_address = Column(String, unique=True, index=True, nullable=False)
    api_wallet = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Post(Base):
    __tablename__ = "posts"
    id = Column(String, primary_key=True)
    creator_id = Column(String, index=True, nullable=False)  # wallet address
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    preview = Column(String, nullable=True)
    image_url = Column(String, nullable=True)  # base64 data URL
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class CreatorProfile(Base):
    __tablename__ = "creator_profiles"
    wallet_address = Column(String, primary_key=True)
    display_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    required_inj = Column(String, default="5")  # store as string to avoid float issues
    category = Column(String, default="Creator")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
