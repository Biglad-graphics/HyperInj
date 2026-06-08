"""
Modular async agent system — elite personalities.
"""
import asyncio
import json
import logging
from typing import Any, Dict

from .cache import agent_cache
from .groq_client import FAST_MODEL, chat_complete

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


async def _agent(name: str, system: str, user_msg: str, fallback: Dict, timeout: float = AGENT_TIMEOUT) -> Dict:
    try:
        raw = await asyncio.wait_for(
            chat_complete(
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_msg},
                ],
                model=FAST_MODEL,
                max_tokens=200,
                temperature=0.3,
                json_mode=True,
                timeout=timeout,
            ),
            timeout=timeout + 0.5,
        )
        parsed = json.loads(raw) if raw.strip() else None
        if parsed and isinstance(parsed, dict):
            return parsed
    except (asyncio.TimeoutError, json.JSONDecodeError) as e:
        logger.warning(f"[{name}] {type(e).__name__}")
    except Exception as e:
        logger.warning(f"[{name}] error: {e}")
    return fallback


async def market_agent(query: str) -> Dict[str, Any]:
    return await _agent(
        "market",
        """You are a hedge fund market analyst — calm, precise, data-driven. No hype, no emotion.
Analyze the query and return ONLY valid JSON:
{
  "trend": "bullish|bearish|neutral",
  "signal": "BUY|SELL|HOLD",
  "confidence": <0-100>,
  "momentum": "strong|moderate|weak",
  "structure": "<one sharp sentence on price structure — use: momentum, liquidity, breakout, range, structure>"
}
'structure' must be under 20 words. Sound like a hedge fund analyst.""",
        query,
        fallback={
            "trend": "neutral",
            "signal": "HOLD",
            "confidence": 50,
            "momentum": "moderate",
            "structure": "Price action is consolidating. No clear directional bias yet.",
        },
    )


async def sentiment_agent(query: str) -> Dict[str, Any]:
    return await _agent(
        "sentiment",
        """You are a Crypto Twitter analyst hybrid — fast, reactive, plugged into crowd behavior.
Analyze the query and return ONLY valid JSON:
{
  "sentiment": "positive|negative|neutral",
  "score": <0-100>,
  "phase": "early hype|overheated|fearful|recovering|neutral",
  "crowd": "<one sharp sentence on crowd positioning — mention hype, fear, or positioning>"
}
'crowd' must be under 20 words. Energetic but controlled.""",
        query,
        fallback={
            "sentiment": "neutral",
            "score": 50,
            "phase": "neutral",
            "crowd": "No strong crowd signal. Market positioning is mixed.",
        },
    )


async def risk_agent(query: str) -> Dict[str, Any]:
    return await _agent(
        "risk",
        """You are a strict risk manager — disciplined, slightly pessimistic, capital protection first.
Analyze the query and return ONLY valid JSON:
{
  "risk_level": "low|medium|high",
  "downside": "<one sharp sentence on main downside — be direct, slightly harsh>",
  "stop_loss": "<stop level or percentage>",
  "probability_note": "<one sentence using probability language>"
}
Each field under 20 words. Lead with the downside.""",
        query,
        fallback={
            "risk_level": "medium",
            "downside": "Momentum stall here exposes a sharp pullback. Don't ignore it.",
            "stop_loss": "2-5% below entry",
            "probability_note": "Odds favor range continuation until a clear catalyst emerges.",
        },
    )


async def run_agents(query: str) -> Dict[str, Any]:
    cache_key = f"agents:{query[:120]}"
    cached = agent_cache.get(cache_key, CACHE_TTL)
    if cached:
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
    """Compact context string injected into the Decision Agent's system prompt."""
    m = agents.get("market", {})
    s = agents.get("sentiment", {})
    r = agents.get("risk", {})
    return (
        f"MARKET: trend={m.get('trend')} signal={m.get('signal')} "
        f"confidence={m.get('confidence')}% momentum={m.get('momentum')} — {m.get('structure','')}\n"
        f"SENTIMENT: {s.get('sentiment')} score={s.get('score')} "
        f"phase={s.get('phase')} — {s.get('crowd','')}\n"
        f"RISK: level={r.get('risk_level')} stop={r.get('stop_loss')} — "
        f"{r.get('downside','')} {r.get('probability_note','')}"
    )


def format_agent_sections(agents: Dict[str, Any]) -> str:
    """Pre-formatted agent output blocks to prepend to the streamed response."""
    m = agents.get("market", {})
    s = agents.get("sentiment", {})
    r = agents.get("risk", {})
    return (
        f"**Market Analysis:**\n{m.get('structure','')}\n\n"
        f"**Sentiment:**\n{s.get('crowd','')}\n\n"
        f"**Risk:**\n{r.get('downside','')} — Stop: {r.get('stop_loss','')}\n\n"
        "---\n\n"
    )
