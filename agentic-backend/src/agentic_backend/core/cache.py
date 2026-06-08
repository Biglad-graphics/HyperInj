import time
import hashlib
from typing import Any, Dict, Optional, Tuple


class TTLCache:
    def __init__(self):
        self._store: Dict[str, Tuple[Any, float]] = {}

    def _key(self, raw: str) -> str:
        return hashlib.md5(raw.encode()).hexdigest()

    def get(self, raw_key: str, ttl: float) -> Optional[Any]:
        key = self._key(raw_key)
        entry = self._store.get(key)
        if entry is None:
            return None
        value, ts = entry
        if time.monotonic() - ts > ttl:
            del self._store[key]
            return None
        return value

    def set(self, raw_key: str, value: Any) -> None:
        key = self._key(raw_key)
        self._store[key] = (value, time.monotonic())

    def evict_expired(self, ttl: float) -> None:
        now = time.monotonic()
        dead = [k for k, (_, ts) in self._store.items() if now - ts > ttl]
        for k in dead:
            del self._store[k]


# Singletons
agent_cache = TTLCache()   # 30s TTL — agent analysis results
market_cache = TTLCache()  # 20s TTL — market data
