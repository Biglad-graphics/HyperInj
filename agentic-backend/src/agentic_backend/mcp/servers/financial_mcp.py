from mcp.server.fastmcp import FastMCP
import httpx
import os
import time
import json

# TAAPI_SECRET = os.getenv("TAAPI_SECRET")  # store securely in .env

from dotenv import load_dotenv , find_dotenv
load_dotenv(find_dotenv())
TAAPI_SECRET = os.getenv("TAAPI_KEY")
mcp = FastMCP("Financial MCP Server")

# Rate limiting: 17 second delay between API calls
RATE_LIMIT_DELAY = 17

# Load Indicator Metadata from JSON file
def load_indicator_metadata():
    """Load indicator metadata from indicators_full.json"""
    try:
        json_path = os.path.join(os.path.dirname(__file__), "indicators_full.json")
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: indicators_full.json not found at {json_path}")
        return {}
    except json.JSONDecodeError:
        print(f"Warning: Error decoding indicators_full.json")
        return {}
    except Exception as e:
        print(f"Warning: Error loading indicators_full.json: {e}")
        return {}

INDICATOR_METADATA = load_indicator_metadata()
@mcp.tool()
def get_indicator(
    endpoint: str,
    symbol: str = "BTC/USDT",
    interval: str = "1d",
    results: int = 10,
    exchange: str = "binance",
    backtrack: int = 0,
    chart: str = "candles",
    addResultTimestamp: bool = False,
    fromTimestamp: int | None = None,
    toTimestamp: int | None = None,
    gaps: bool = True,
    **kwargs
) -> dict:
    """
    Generic endpoint caller for TAAPI technical analysis indicators with metadata loaded from JSON.
    Fetches indicator values for past X candles with detailed meaning and interpretation.

    Parameters:
    ───────────
    endpoint: str (Required)
        TAAPI endpoint name (e.g., '2crows', 'rsi', 'macd', 'engulfing', 'morningstar')
    symbol: str
        Trading pair (e.g., 'BTC/USDT'). Default: 'BTC/USDT'
    interval: str
        Timeframe: 1m, 5m, 15m, 30m, 1h, 2h, 4h, 12h, 1d, 1w. Default: '1d'
    results: int
        Number of past candles to fetch. Default: 10
        Example: results=10 gets last 10 daily values for the indicator
    exchange: str
        Exchange name. Default: 'binance'
    backtrack: int
        Candles to look back. Default: 0
    chart: str
        'candles' or 'heikinashi'. Default: 'candles'
    addResultTimestamp: bool
        Include timestamp with results. Default: False
    fromTimestamp: int (Optional)
        Unix epoch start time for historical values
    toTimestamp: int (Optional)
        Unix epoch end time for historical values
    gaps: bool
        Fill gaps in thin markets. Default: True
    **kwargs: Additional endpoint-specific parameters

    Returns:
    ────────
    dict containing:
        - status: "success" or "error"
        - endpoint: str (requested endpoint)
        - symbol: str
        - interval: str
        - results_requested: int
        - metadata: dict (indicator details - category, meaning, inference, benefits)
        - data: list or dict (actual indicator values for past X candles)
        - interpretation: str (LLM-ready interpretation of the data)

    Examples:
    ─────────
    # Get last 10 daily RSI values with meaning
    get_indicator("rsi", symbol="BTC/USDT", interval="1d", results=10)

    # Get last 5 4-hour 2crows pattern values with inference
    get_indicator("2crows", symbol="BTC/USDT", interval="4h", results=5)

    # Get last 30 hourly MACD values
    get_indicator("macd", symbol="ETH/USDT", interval="1h", results=30)

    # Get morning star pattern for last 20 daily candles
    get_indicator("morningstar", symbol="BTC/USDT", interval="1d", results=20)
    """

    # Rate limiting: wait before API call
    time.sleep(RATE_LIMIT_DELAY)

    # Validate endpoint is not empty
    if not endpoint or not isinstance(endpoint, str):
        return {
            "status": "error",
            "message": "Endpoint parameter required and must be a string",
            "examples": ["2crows", "rsi", "macd", "engulfing", "morningstar", "doji", "hammer"]
        }

    # Convert endpoint to lowercase
    endpoint_lower = endpoint.lower().strip()

    # Get indicator metadata from loaded JSON
    metadata = INDICATOR_METADATA.get(endpoint_lower)
    if not metadata:
        return {
            "status": "error",
            "endpoint": endpoint_lower,
            "message": f"Indicator '{endpoint_lower}' not found in indicators_full.json",
            "note": "Check indicators_full.json for available endpoints.",
            "available_indicators_sample": list(INDICATOR_METADATA.keys())[:20]
        }

    # Base URL for TAAPI
    BASE_URL = f"https://api.taapi.io/{endpoint_lower}"

    # Build parameters
    params = {
        "secret": TAAPI_SECRET,
        "exchange": exchange,
        "symbol": symbol,
        "interval": interval,
        "results": results,
        "backtrack": backtrack,
        "chart": chart,
        "addResultTimestamp": str(addResultTimestamp).lower(),
        "gaps": str(gaps).lower(),
    }

    # Add optional timestamp parameters
    if fromTimestamp:
        params["fromTimestamp"] = fromTimestamp
    if toTimestamp:
        params["toTimestamp"] = toTimestamp

    # Add any additional endpoint-specific parameters
    for key, value in kwargs.items():
        if value is not None:
            params[key] = value

    try:
        with httpx.Client() as client:
            r = client.get(BASE_URL, params=params, timeout=30.0)
            r.raise_for_status()
            data = r.json()

        # Build interpretation string for LLM
        interpretation_parts = [
            f"Indicator: {metadata['name']} ({endpoint_lower})",
            f"Category: {metadata['category']}",
            f"Symbol: {symbol} | Interval: {interval} | Results: {results} candles",
            f"\nDescription: {metadata['description']}",
            f"\nSignal Meaning: {metadata['signal']}",
            f"\nBenefits: {', '.join(metadata['benefits'])}",
            f"\nTimeframe Reliability: {metadata['timeframe']}",
            f"Risk Level: {metadata['risk_level']}",
            f"Use Case: {metadata['use_case']}",
            f"\nValue Inference Guide:\n" + "\n".join([f"  • {k}: {v}" for k, v in metadata['inference'].items()])
        ]

        interpretation = "\n".join(interpretation_parts)

        return {
            "data": data,
            
        }

    except httpx.HTTPStatusError as e:
        return {
            "status": "error",
            "endpoint": endpoint_lower,
            "error_code": e.response.status_code,
            "error_message": str(e),
            "message": f"API call failed for endpoint '{endpoint_lower}'. Check endpoint name and parameters.",
            "metadata": metadata
        }
    except Exception as e:
        return {
            "status": "error",
            "endpoint": endpoint_lower,
            "error": str(e),
            "message": "Error calling TAAPI endpoint",
            "metadata": metadata
        }


if __name__ == "__main__":
    print("[SERVER] Starting Financial MCP...", flush=True)
    mcp.run()
