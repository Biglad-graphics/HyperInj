import os
import asyncio
import logging
from typing import Optional, AsyncIterator
from groq import AsyncGroq

logger = logging.getLogger(__name__)

MAIN_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
FAST_MODEL = os.getenv("GROQ_FAST_MODEL", "llama3-8b-8192")

_client: Optional[AsyncGroq] = None


def get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY", ""))
    return _client


async def chat_complete(
    messages: list,
    model: str = MAIN_MODEL,
    max_tokens: int = 1024,
    temperature: float = 0.4,
    json_mode: bool = False,
    timeout: float = 8.0,
    retries: int = 2,
) -> str:
    kwargs = dict(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    client = get_client()
    last_err = None
    for attempt in range(retries + 1):
        try:
            resp = await asyncio.wait_for(
                client.chat.completions.create(**kwargs),
                timeout=timeout,
            )
            if resp.choices:
                return resp.choices[0].message.content or ""
            return ""
        except asyncio.TimeoutError:
            last_err = "timeout"
            logger.warning(f"Groq timeout (attempt {attempt + 1})")
        except Exception as e:
            last_err = str(e)
            logger.warning(f"Groq error (attempt {attempt + 1}): {e}")
            if attempt < retries:
                await asyncio.sleep(0.3 * (attempt + 1))
    raise RuntimeError(f"Groq failed after {retries + 1} attempts: {last_err}")


async def chat_stream(
    messages: list,
    model: str = MAIN_MODEL,
    max_tokens: int = 1024,
    temperature: float = 0.5,
    timeout: float = 8.0,
) -> AsyncIterator[str]:
    client = get_client()
    try:
        stream = await asyncio.wait_for(
            client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
            ),
            timeout=timeout,
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except asyncio.TimeoutError:
        logger.error("Groq stream timed out")
        raise
    except Exception as e:
        logger.error(f"Groq stream error: {e}")
        raise
