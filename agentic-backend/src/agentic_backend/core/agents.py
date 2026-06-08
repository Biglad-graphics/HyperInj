"""
Modular async agent system.
Each agent runs independently with a timeout and structured JSON output.
All agents run in parallel via run_agents_parallel().
"""
import asyncio
import json
import logging
from typing import Dict, Any, Optional

from .groq_client import chat_complete, FAST_MODEL
from .cache import agent_cache

logger = logging.getLogger(__name__)

AGENT_TIMEOUT = 3.0
CACHE_TTL = 30.0

TRADE_KEYWORDS = {
    "buy", "sell", "trade", "signal", "bullish", "bearish", "price",
    "analysis", "invest", "hold", "market", "trend", "inj", "btc",
    "eth", "sol", "crypto", "pump", "dump", "long", "short", "dex",
    "chart", "rsi", "ema", "support", "resistance", "breakout",
}


def is_trade_query(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in TRADE_KEYWORDS)


async def _agent(
    name: str,
    system: str,
    user_msg: str,
    fallback: Dict,
    timeout: float = AGENT_TIMEOUT,
) -> Dict:
    try:
        raw = await asyncio.wait_for(
            chat_complete(
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_msg},
                ],
                model=FAST_MODEL,
                max_tokens=200,
                temperature=0.2,
                json_mode=True,
                timeout=timeout,
            ),
            timeout=timeout + 0.5,
        )
        parsed = json.loads(raw) if raw.strip() else None
        if parsed and isinstance(parsed, dict):
            logger.debug(f"[{name}] OK: {parsed}")
            return parsed
    except (asyncio.TimeoutError, json.JSONDecodeError) as e:
        logger.warning(f"[{name}] {type(e).__name__}")
    except Exception as e:
        logger.warning(f"[{name}] error: {e}")
    return fallback


async def market_agent(query: str) -> Dict[str, Any]:
    return await _agent(
        "market",
        """You are a crypto market analyst. Analyze the user query and return ONLY valid JSON:
{
  "trend": "bullish|bearish|neutral",
  "confidence": <0-100>,
  "momentum": "strong|moderate|weak",
  "key_level": "<brief support/resistance note>",
  "signal": "BUY|SELL|HOLD",
  "reasoning": "<one sentence>"
}""",
        query,
        fallback={
            "trend": "neutral",
            "confidence": 50,
            "momentum": "moderate",
            "key_level": "Data unavailable",
            "signal": "HOLD",
            "reasoning": "Insufficient real-time data for market analysis.",
        },
    )


async def sentiment_agent(query: str) -> Dict[str, Any]:
    return await _agent(
        "sentiment",
        """You are a crypto sentiment analyst. Analyze the user query and return ONLY valid JSON:
{
  "sentiment": "positive|negative|neutral",
  "score": <0-100>,
  "social_mood": "fearful|greedy|neutral",
  "news_tone": "positive|negative|mixed",
  "summary": "<one sentence>"
}""",
        query,
        fallback={
            "sentiment": "neutral",
            "score": 50,
            "social_mood": "neutral",
            "news_tone": "mixed",
            "summary": "Sentiment data unavailable.",
        },
    )


async def risk_agent(query: str) -> Dict[str, Any]:
    return await _agent(
        "risk",
        """You are a crypto risk manager. Analyze the user query and return ONLY valid JSON:
{
  "risk_level": "low|medium|high",
  "volatility": "low|medium|high",
  "primary_risk": "<main risk in 10 words>",
  "stop_loss_hint": "<percentage or level>",
  "position_size_hint": "<brief suggestion>"
}""",
        query,
        fallback={
            "risk_level": "medium",
            "volatility": "medium",
            "primary_risk": "Market volatility and liquidity risks apply.",
            "stop_loss_hint": "2-5% below entry",
            "position_size_hint": "Risk no more than 1-2% of portfolio.",
        },
    )


async def run_agents(query: str) -> Dict[str, Any]:
    """Run all agents in parallel. Results cached for CACHE_TTL seconds."""
    cache_key = f"agents:{query[:120]}"
    cached = agent_cache.get(cache_key, CACHE_TTL)
    if cached:
        logger.debug("Agent cache hit")
        return cached

    market, sentiment, risk = await asyncio.gather(
        market_agent(query),
        sentiment_agent(query),
        risk_agent(query),
    )

    result = {"market": market, "sentiment": sentiment, "risk": risk}
    agent_cache.set(cache_key, result)
    return result


def build_agent_context(agents: Dict[str, Any]) -> str:
    m = agents.get("market", {})
    s = agents.get("sentiment", {})
    r = agents.get("risk", {})
    return (
        f"[Market] trend={m.get('trend','?')} signal={m.get('signal','?')} "
        f"confidence={m.get('confidence','?')}% momentum={m.get('momentum','?')} | "
        f"[Sentiment] {s.get('sentiment','?')} score={s.get('score','?')} "
        f"mood={s.get('social_mood','?')} | "
        f"[Risk] level={r.get('risk_level','?')} volatility={r.get('volatility','?')} "
        f"stop={r.get('stop_loss_hint','?')}"
    )
