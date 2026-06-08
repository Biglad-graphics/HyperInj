# src/agentic_backend/config.py
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "HyperInj AI Backend"

    # Groq (primary AI engine)
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_FAST_MODEL: str = "llama3-8b-8192"

    # Legacy Anthropic (backtest code gen only)
    ANTHROPIC_API_KEY: str | None = None
    ANTHROPIC_BASE_URL: str = "https://api.anthropic.com"

    # Persistence
    RUN_SAVE_DIR: Path = Path("runs")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

