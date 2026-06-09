"""
AI backend — Groq-powered WebSocket chat + REST endpoints.
Architecture:
  /ws/chat       → parallel agent analysis → Groq streaming synthesis
  /trade-signal  → fast Groq trade signal (< 1.5s)
  /backtest      → strategy code gen + subprocess execution
  /threads/*     → conversation persistence
  /health        → liveness probe
"""
import asyncio
import json
import logging
import os
import subprocess
import sys
import tempfile
from datetime import datetime
from typing import Dict, List, Optional

import httpx
from dotenv import load_dotenv, find_dotenv
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from groq import AsyncGroq
from pydantic import BaseModel, Field

from ..api.xample import EXAMPLE_STRATEGY_CODE1, EXAMPLE_STRATEGY_CODE2
from ..core.agents import build_agent_context, format_agent_sections, is_trade_query, run_agents
from ..core.cache import agent_cache, market_cache
from ..core.groq_client import FAST_MODEL, MAIN_MODEL, chat_complete, chat_stream, get_client
from ..services.persistence import (
    clear_thread_memory,
    get_thread_memory,
    get_user_threads,
    update_thread_memory,
)

load_dotenv(find_dotenv())
logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM = """You are the Decision Agent for HyperInj — an elite fund manager who synthesizes \
market, sentiment, and risk analysis into a final, authoritative verdict.

Your role: receive pre-analysis from three specialist agents and deliver the final call.

PERSONALITY:
- Authoritative, decisive, zero fluff
- Sounds expensive and trustworthy
- Makes users want to ask more

MANDATORY RESPONSE FORMAT for trade/analysis queries:
---
**Market Analysis:**
<one sharp insight from market agent — price action, momentum, structure>

**Sentiment:**
<one sharp insight from sentiment agent — crowd behavior, hype phase>

**Risk:**
<one sharp insight from risk agent — downside first, stop level>

---

**Verdict: BUY | WAIT | AVOID**
<1–2 lines. Decisive. Authoritative. Why now or why not.>

---

RULES:
- No long paragraphs. Short, punchy lines only.
- No phrases like "it depends", "I cannot", "as an AI"
- No generic disclaimers
- Use terms: momentum, structure, liquidity, breakout, positioning, confirmation
- For non-trade queries: answer directly, still sharp and minimal"""


# ---------------------------------------------------------------------------
# WebSocket chat — main endpoint
# ---------------------------------------------------------------------------

@router.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    client: AsyncGroq = get_client()

    try:
        while True:
            raw = await websocket.receive_text()
            if not raw or not raw.strip():
                continue
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            thread_id: str = msg.get("thread_id", "default")
            user_id: str = msg.get("user_id", "user")
            user_message: str = (msg.get("message") or "").strip()
            if not user_message:
                continue

            # ------------------------------------------------------------------
            # 1. Load conversation history (last 6 turns)
            # ------------------------------------------------------------------
            memory = get_thread_memory(user_id, thread_id)
            history: List[Dict] = []
            if memory:
                for entry in (memory.get("raw_conversation") or [])[-6:]:
                    if entry.get("user_query"):
                        history.append({"role": "user", "content": entry["user_query"]})
                    if entry.get("final_response"):
                        history.append({"role": "assistant", "content": entry["final_response"]})

            # ------------------------------------------------------------------
            # 2. Run agent analysis in parallel (only for trade queries)
            # ------------------------------------------------------------------
            agent_ctx = ""
            agent_prefix = ""
            if is_trade_query(user_message):
                try:
                    agents = await asyncio.wait_for(run_agents(user_message), timeout=3.5)
                    agent_ctx = build_agent_context(agents)
                    agent_prefix = format_agent_sections(agents)
                except asyncio.TimeoutError:
                    logger.warning("[chat] agent analysis timed out — skipping")
                except Exception as e:
                    logger.warning(f"[chat] agent error (non-fatal): {e}")

            # ------------------------------------------------------------------
            # 3. Build messages for Groq Decision Agent
            # ------------------------------------------------------------------
            system = _SYSTEM
            if agent_ctx:
                system += f"\n\nPre-analysis from specialist agents:\n{agent_ctx}"

            messages = history + [{"role": "user", "content": user_message}]

            # ------------------------------------------------------------------
            # 4. Stream: send agent sections first, then stream verdict
            # ------------------------------------------------------------------
            full_response = agent_prefix
            if agent_prefix:
                await websocket.send_json({
                    "type": "chunk",
                    "thread_id": thread_id,
                    "state": {"supervisor": {"final_output": full_response}},
                })

            try:
                async for token in chat_stream(
                    messages=[{"role": "system", "content": system}] + messages,
                    model=MAIN_MODEL,
                    max_tokens=512,
                    temperature=0.5,
                    timeout=8.0,
                ):
                    full_response += token
                    await websocket.send_json({
                        "type": "chunk",
                        "thread_id": thread_id,
                        "state": {"supervisor": {"final_output": full_response}},
                    })
                stream_ok = True

            except asyncio.TimeoutError:
                logger.error("[chat] stream timed out")
                fallback = (
                    "I'm having a bit of trouble reaching my reasoning engine right now. "
                    "Based on general trends: **INJ** has been showing strong DeFi activity. "
                    "Please try again in a moment for live analysis."
                )
                await websocket.send_json({
                    "type": "chunk",
                    "thread_id": thread_id,
                    "state": {"supervisor": {"final_output": fallback}},
                })
                full_response = fallback

            except Exception as e:
                logger.error(f"[chat] stream error: {e}")
                await websocket.send_json({
                    "type": "error",
                    "thread_id": thread_id,
                    "message": "AI service temporarily unavailable. Please retry.",
                })
                await websocket.send_json({"type": "final", "thread_id": thread_id})
                continue

            # ------------------------------------------------------------------
            # 5. Persist turn + send final
            # ------------------------------------------------------------------
            if full_response:
                update_thread_memory(
                    user_id=user_id,
                    thread_id=thread_id,
                    request_summary=user_message,
                    response_summary=full_response[:300],
                    conversation_entry={
                        "user_query": user_message,
                        "final_response": full_response,
                    },
                )

            await websocket.send_json({"type": "final", "thread_id": thread_id})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except asyncio.CancelledError:
        logger.info("WebSocket cancelled")
    except Exception as e:
        logger.error(f"WebSocket fatal: {e}")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@router.get("/health")
async def health():
    return {"status": "ok", "engine": "groq"}


# ---------------------------------------------------------------------------
# Thread management
# ---------------------------------------------------------------------------

@router.get("/threads/{user_id}")
async def list_threads(user_id: str):
    thread_ids = get_user_threads(user_id)
    threads = []
    for tid in thread_ids:
        mem = get_thread_memory(user_id, tid)
        threads.append({
            "thread_id": tid,
            "request_summary": (mem or {}).get("request_summary", ""),
            "last_updated": (mem or {}).get("last_updated", ""),
        })
    threads.sort(key=lambda x: x["last_updated"], reverse=True)
    return {"user_id": user_id, "threads": threads}


@router.get("/threads/{user_id}/{thread_id}")
async def get_thread(user_id: str, thread_id: str):
    memory = get_thread_memory(user_id, thread_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"user_id": user_id, "thread_id": thread_id, "memory": memory}


@router.delete("/threads/{user_id}/{thread_id}")
async def delete_thread(user_id: str, thread_id: str):
    clear_thread_memory(user_id, thread_id)
    return {"status": "deleted", "user_id": user_id, "thread_id": thread_id}


@router.get("/threads/{user_id}/{thread_id}/report")
async def thread_report(user_id: str, thread_id: str):
    memory = get_thread_memory(user_id, thread_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Thread not found")

    history = memory.get("raw_conversation") or []
    if not history:
        raise HTTPException(status_code=404, detail="No conversation history")

    convo = "\n".join(
        f"### Turn {i+1}\n**User:** {e.get('user_query','')}\n\n**AI:** {e.get('final_response','')}"
        for i, e in enumerate(history)
    )

    report = await chat_complete(
        messages=[{
            "role": "user",
            "content": (
                f"Generate a professional markdown trading report for thread {thread_id}.\n\n"
                f"Conversation:\n{convo}\n\n"
                "Include: Executive Summary, Key Insights, Recommendations, Risk Notes, Action Items.\n"
                "Return plain markdown only — no code fences."
            ),
        }],
        model=MAIN_MODEL,
        max_tokens=2000,
        temperature=0.3,
        timeout=15.0,
    )
    return {"user_id": user_id, "thread_id": thread_id, "report": report.strip(), "format": "markdown"}


# ---------------------------------------------------------------------------
# Trade signal (fast, < 1.5s — called by frontend /api/ai route)
# ---------------------------------------------------------------------------

COINGECKO_IDS = {
    "BTC": "bitcoin", "ETH": "ethereum", "INJ": "injective-protocol",
    "SOL": "solana", "BNB": "binancecoin", "ATOM": "cosmos",
    "AVAX": "avalanche-2", "MATIC": "matic-network",
    "ARB": "arbitrum", "OP": "optimism",
}


class TradeSignalRequest(BaseModel):
    prompt: str
    asset: str = "INJ"


@router.post("/trade-signal")
async def trade_signal(req: TradeSignalRequest):
    asset = req.asset.upper()
    cg_id = COINGECKO_IDS.get(asset, "injective-protocol")

    # Fetch market data with cache
    cache_key = f"market:{asset}"
    price_data = market_cache.get(cache_key, 20.0)
    if price_data is None:
        try:
            async with httpx.AsyncClient(timeout=3.0) as http:
                r = await http.get(
                    "https://api.coingecko.com/api/v3/simple/price",
                    params={"ids": cg_id, "vs_currencies": "usd", "include_24hr_change": "true"},
                )
            raw = r.json()
            coin = raw.get(cg_id, {})
            price_data = {
                "price": coin.get("usd", 0.0),
                "change24h": coin.get("usd_24h_change", 0.0),
            }
            market_cache.set(cache_key, price_data)
        except Exception as e:
            logger.warning(f"CoinGecko error: {e}")
            price_data = {"price": 0.0, "change24h": 0.0}

    price = price_data["price"]
    change = price_data["change24h"]

    # If CoinGecko failed, try to extract price from the prompt (frontend passes it)
    if price == 0.0:
        import re
        m = re.search(r'\$([0-9]+(?:\.[0-9]+)?)', req.prompt)
        if m:
            price = float(m.group(1))

    prompt = (
        f"Asset: {asset}, Price: ${price:.4f}, 24h change: {change:+.2f}%\n"
        f"User query: {req.prompt}\n\n"
        "Return ONLY valid JSON:\n"
        '{"trend":"bullish|bearish|neutral","asset":"SYMBOL","explanation":"1 sharp sentence — hedge fund style, no fluff",'
        '"risk":"Low|Medium|High","action":"Buy|Wait|Sell"}'
    )

    try:
        raw = await chat_complete(
            messages=[
                {"role": "system", "content": "You are an elite crypto trade signal engine. Output only valid JSON. Be sharp and confident."},
                {"role": "user", "content": prompt},
            ],
            model=FAST_MODEL,
            max_tokens=150,
            temperature=0.1,
            json_mode=True,
            timeout=4.0,
            retries=1,
        )
        result = json.loads(raw) if raw.strip() else {}
    except Exception as e:
        logger.warning(f"trade-signal LLM error: {e}")
        result = {}

    # Rule-based fallback
    if not result.get("action"):
        if change > 2:
            result = {"trend": "bullish", "action": "Buy", "risk": "Medium",
                      "explanation": f"{asset} momentum is building — structure holds above key support."}
        elif change < -2:
            result = {"trend": "bearish", "action": "Sell", "risk": "Medium",
                      "explanation": f"{asset} losing structure — downside risk elevated until support reclaims."}
        else:
            result = {"trend": "neutral", "action": "Wait", "risk": "Low",
                      "explanation": f"{asset} consolidating in range — wait for breakout confirmation."}

    result.setdefault("asset", asset)
    if not result.get("explanation") or "$0.0000" in result.get("explanation", ""):
        result["explanation"] = f"{asset} momentum {'building' if change > 0 else 'fading'} — {abs(change):.2f}% move in 24h."
    result["price"] = price
    result["change24h"] = change
    return result


# ---------------------------------------------------------------------------
# Backtest — code gen + subprocess execution
# ---------------------------------------------------------------------------

class BacktestRequest(BaseModel):
    strategy_description: str = Field(..., description="Natural language strategy description")
    ticker: str = Field(default="ETH-USD")
    days: int = Field(default=365, ge=1, le=3650)


class BacktestResponse(BaseModel):
    status: str
    strategy_description: str
    ticker: str
    days: int
    backtest_results: Optional[dict] = None
    generated_code: Optional[str] = None
    error: Optional[str] = None
    execution_time: Optional[float] = None


async def _generate_strategy_code(desc: str, ticker: str, days: int) -> str:
    prompt = (
        f"Generate production-ready Backtrader Python backtesting code.\n"
        f"Ticker: {ticker} | Days: {days} | Interval: 1d\n\n"
        "Requirements:\n"
        "1. Use EXACT structure from reference examples.\n"
        "2. Output ONLY the complete Python script — no explanations, no markdown.\n"
        "3. All indicators configurable via strategy params.\n"
        "4. Use cerebro.broker.setcommission(commission=0.001) and cash=10000.\n"
        "5. Add analyzers: TradeAnalyzer, SharpeRatio, DrawDown, Returns, SQN.\n"
        "6. Output JSON report between __JSON_REPORT_START__ and __JSON_REPORT_END__.\n"
        "7. ASCII only in print statements.\n\n"
        f"Reference example 1:\n{EXAMPLE_STRATEGY_CODE1}\n\n"
        f"Reference example 2:\n{EXAMPLE_STRATEGY_CODE2}\n\n"
        f"Strategy: {desc}\n\nGenerate code now:"
    )
    code = await chat_complete(
        messages=[
            {"role": "system", "content": "You are a Python quant developer. Output only valid Python code."},
            {"role": "user", "content": prompt},
        ],
        model=MAIN_MODEL,
        max_tokens=4000,
        temperature=0.2,
        timeout=30.0,
        retries=1,
    )
    # Strip markdown fences if present
    code = code.strip()
    if code.startswith("```"):
        lines = code.split("\n")
        code = "\n".join(lines[1:])
    if code.endswith("```"):
        code = "\n".join(code.split("\n")[:-1])
    return code.strip()


def _run_backtest_subprocess(code: str) -> dict:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp = f.name
    try:
        result = subprocess.run(
            [sys.executable, tmp],
            capture_output=True, text=True, timeout=300,
        )
        report = None
        err_msg = None
        if "__JSON_REPORT_START__" in result.stdout and "__JSON_REPORT_END__" in result.stdout:
            try:
                js = result.stdout.split("__JSON_REPORT_START__")[1].split("__JSON_REPORT_END__")[0].strip()
                report = json.loads(js)
            except json.JSONDecodeError as e:
                err_msg = f"JSON parse error: {e}"
        if result.returncode != 0 and result.stderr:
            err_msg = result.stderr.strip()
        return {
            "status": "success" if result.returncode == 0 and report else "error",
            "backtest_results": report,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode,
            "error": err_msg,
        }
    except subprocess.TimeoutExpired:
        return {"status": "timeout", "error": "Execution timed out", "return_code": -1}
    except Exception as e:
        return {"status": "error", "error": str(e), "return_code": -1}
    finally:
        try:
            os.unlink(tmp)
        except OSError:
            pass


@router.get("/")
async def root():
    return {"message": "HyperInj AI Backend", "engine": "groq"}


@router.post("/backtest", response_model=BacktestResponse)
async def backtest_strategy(req: BacktestRequest):
    start = datetime.now()
    try:
        code = await _generate_strategy_code(req.strategy_description, req.ticker, req.days)
        result = _run_backtest_subprocess(code)
        elapsed = (datetime.now() - start).total_seconds()
        err = result.get("error") or (
            f"Execution error: {result.get('stderr','')[:500]}"
            if result["status"] == "error" else None
        )
        return BacktestResponse(
            status=result["status"],
            strategy_description=req.strategy_description,
            ticker=req.ticker,
            days=req.days,
            backtest_results=result.get("backtest_results"),
            generated_code=code,
            error=err,
            execution_time=elapsed,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/backtest")
async def websocket_backtest(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        desc = data.get("strategy_description")
        ticker = data.get("ticker", "ETH-USD")
        days = data.get("days", 365)

        if not desc:
            await websocket.send_json({"type": "error", "message": "strategy_description is required"})
            await websocket.close()
            return

        await websocket.send_json({"type": "status", "message": "Generating strategy code...", "progress": 10})

        try:
            code = await _generate_strategy_code(desc, ticker, days)
            await websocket.send_json({
                "type": "code_generated", "message": "Code generated", "progress": 40,
                "data": {"generated_code": code, "code_length": len(code)},
            })
        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"Code generation failed: {e}"})
            await websocket.close()
            return

        await websocket.send_json({"type": "status", "message": "Running backtest...", "progress": 60})

        try:
            result = _run_backtest_subprocess(code)
            msg = "Backtest completed" if result["status"] == "success" else f"Backtest failed: {result.get('error','')}"
            await websocket.send_json({
                "type": "backtest_complete", "message": msg, "progress": 100,
                "data": {
                    "status": result["status"], "strategy_description": desc,
                    "ticker": ticker, "days": days,
                    "backtest_results": result.get("backtest_results"),
                    "error": result.get("error"),
                    "return_code": result.get("return_code"),
                },
            })
        except Exception as e:
            await websocket.send_json({"type": "error", "message": f"Backtest failed: {e}"})

        await asyncio.sleep(1)
        await websocket.close()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
            await websocket.close()
        except Exception:
            pass
