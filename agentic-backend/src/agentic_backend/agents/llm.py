"""Shared LLM factory — returns ChatAnthropic pointed at FreeModel (or standard Anthropic)."""
import os
from langchain_anthropic import ChatAnthropic


def get_llm(temperature: float = 0.0) -> ChatAnthropic:
    """Main model for reasoning-heavy tasks (Claude Sonnet)."""
    return ChatAnthropic(
        model="claude-sonnet-4-6",
        temperature=temperature,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        anthropic_api_url=os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com"),
    )


def get_fast_llm(temperature: float = 0.3) -> ChatAnthropic:
    """Faster/cheaper model for summarisation and simple tasks (Claude Haiku)."""
    return ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        temperature=temperature,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        anthropic_api_url=os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com"),
    )
