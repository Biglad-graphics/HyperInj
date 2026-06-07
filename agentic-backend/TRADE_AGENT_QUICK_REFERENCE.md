# Trade Agent Quick Reference

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Query                                  │
│           "Buy 1 BTC for my portfolio" / "Check portfolio"          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   Supervisor    │ (orchestrator.py)
                    │  Agent (GPT-4o) │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │ Analyze Context │
                    │ Route to Agent  │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┬──────────┐
                │            │            │          │
                ▼            ▼            ▼          ▼
          ┌─────────┐  ┌──────────┐ ┌─────────┐ ┌──────────┐
          │ Finance │  │   Web    │ │ Sentiment│ │ TRADE    │◀── NEW
          │ Agent   │  │ Search   │ │ Analysis │ │ AGENT    │
          └────┬────┘  └────┬─────┘ └────┬────┘ └────┬─────┘
               │             │            │          │
               │ (Crypto     │            │          │ (Trade
               │  Prices)    │            │          │  Execution)
               │             │            │          │
               └────────────┬┴─────────────┴──────────┘
                            │
                    ┌───────▼─────────┐
                    │  All Agents     │
                    │ Return Results  │
                    └───────┬─────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │   Supervisor    │
                    │   Synthesizes   │
                    │   Final Response│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  User Response  │
                    │   (Formatted)   │
                    └─────────────────┘
```

---

## Trade Execution Flow

```
Trade Agent Task Received
    │
    ├─► Validate User Profile
    │   ├─ Risk Appetite: High/Medium/Low
    │   ├─ Trading Experience: Beginner/Intermediate/Advanced
    │   ├─ Max Position Size: 5-15% of portfolio
    │   └─ Daily Trade Limit: 3-10 trades
    │
    ├─► Parse Trade Request
    │   ├─ Extract: symbol, quantity, side (BUY/SELL)
    │   └─ Validate: Positive quantity, valid symbol
    │
    ├─► Pre-Trade Checks
    │   ├─ Symbol Validation: BTC, ETH, SOL, ADA, etc.
    │   ├─ Balance Check (for SELL)
    │   ├─ Position Size Check: % of portfolio
    │   ├─ Daily Limit Check: remaining trades today
    │   └─ Risk Assessment: compare to appetite
    │
    ├─► Call MCP Trade Tool
    │   ├─ buy_crypto()  OR  sell_crypto()
    │   ├─ Parameters: symbol, quantity, user_id, limit_price
    │   └─ Returns: trade_id, status, price, total_value
    │
    ├─► Handle Response
    │   ├─ Success: Record trade in state.trade_executions
    │   └─ Failure: Report error with reason
    │
    └─► Track in State
        ├─ Append TradeExecution to state.trade_executions
        ├─ Update state.context with results
        └─ Return control to Supervisor
```

---

## MCP Trade Server Tools

### Tool 1: `buy_crypto()`
```python
Input:
  symbol: str           # "BTC", "ETH", "SOL", etc.
  quantity: float       # 1.5, 10.0, 100.0, etc.
  user_id: str         # "1", "2", "3", etc.
  limit_price: float   # Optional: $50000 (default: market price)

Output:
  {
    "status": "success" | "failed",
    "message": "Buy order placed: 1.5 BTC at $43,500",
    "trade_id": "BUY_BTC_1697801234",
    "symbol": "BTC",
    "quantity": 1.5,
    "execution_price": 43500.00,
    "total_value": 65250.00,
    "portfolio_impact": {
      "asset_added": "1.5 BTC",
      "cost": "$65,250.00"
    }
  }

Validations:
  ✓ Symbol exists in valid list
  ✓ Quantity > 0
  ✓ Returns helpful error messages
```

### Tool 2: `sell_crypto()`
```python
Input:
  symbol: str           # "BTC", "ETH", "SOL", etc.
  quantity: float
  user_id: str
  limit_price: float   # Optional

Output:
  {
    "status": "success" | "failed",
    "message": "Sell order executed: 0.5 BTC at $43,500",
    "trade_id": "SELL_BTC_1697801240",
    "symbol": "BTC",
    "quantity": 0.5,
    "execution_price": 43500.00,
    "total_value": 21750.00,
    "portfolio_impact": {
      "asset_removed": "0.5 BTC",
      "proceeds": "$21,750.00"
    }
  }

Validations:
  ✓ Symbol exists
  ✓ User has sufficient balance
  ✓ Quantity > 0
  ✓ Balance check: current_balance >= sell_quantity
```

### Tool 3: `get_portfolio_info()`
```python
Input:
  user_id: str         # "1", "2", "3"

Output:
  {
    "status": "success",
    "user_id": "1",
    "total_portfolio_value": 150000.00,
    "holdings": {
      "BTC": {
        "amount": 2.5,
        "avg_buy_price": 45000.00,
        "current_price": 43500.00,
        "current_value": 108750.00,
        "pnl": -3750.00,          # (43500 - 45000) * 2.5
        "pnl_percentage": -8.33
      },
      "ETH": {
        "amount": 15.0,
        "avg_buy_price": 3000.00,
        "current_price": 2300.00,
        "current_value": 34500.00,
        "pnl": -10500.00,
        "pnl_percentage": -23.33
      },
      "USDT": {
        "amount": 30000,
        "current_value": 30000.00,
        "pnl": 0,
        "pnl_percentage": 0
      }
    }
  }
```

### Tool 4: `get_trade_history()`
```python
Input:
  user_id: str         # "1"
  limit: int          # 10 (default)

Output:
  {
    "status": "success",
    "user_id": "1",
    "total_trades": 15,
    "recent_trades": [
      {
        "trade_id": "SELL_BTC_1697801240",
        "type": "SELL",
        "symbol": "BTC",
        "quantity": 0.5,
        "execution_price": 43500.00,
        "total_value": 21750.00,
        "timestamp": "2025-10-19T14:30:45.123456"
      },
      {
        "trade_id": "BUY_ETH_1697800100",
        "type": "BUY",
        "symbol": "ETH",
        "quantity": 5.0,
        "execution_price": 2300.00,
        "total_value": 11500.00,
        "timestamp": "2025-10-19T13:15:22.654321"
      }
    ]
  }
```

---

## State Models

### TradeExecution Model
```python
class TradeExecution(BaseModel):
    trade_id: Optional[str]           # "TRADE_BTC_1697801234"
    symbol: str                       # "BTC"
    trade_type: TradeType             # BUY or SELL
    quantity: float                   # 1.5
    timestamp: datetime               # 2025-10-19T14:30:45
    status: str                       # "proposed" | "executed" | "failed"
    reason: str                       # "User requested buy"
    execution_price: Optional[float]  # 43500.00
    total_value: Optional[float]      # 65250.00
    portfolio_impact: Dict            # {"asset_added": "1.5 BTC", ...}
```

### SupervisorState Enhancement
```python
class SupervisorState(BaseModel):
    # ... existing fields ...
    trade_executions: List[TradeExecution]  # ← NEW
```

---

## User Model - Crypto Version

### User Schema
```json
{
  "id": "1",
  "name": "Alice Johnson",
  "age": 32,

  "crypto_preference": ["Bitcoin", "Ethereum"],
  "risk_appetite": "High",                    // High/Medium/Low
  "portfolio_value_usd": 150000,
  "trading_experience": "Intermediate",       // Beginner/Intermediate/Advanced

  "crypto_portfolio": {
    "BTC": {
      "amount": 2.5,
      "avg_buy_price": 45000
    },
    "ETH": {
      "amount": 15.0,
      "avg_buy_price": 3000
    },
    "USDT": {
      "amount": 30000,
      "avg_buy_price": 1
    }
  },

  "max_trade_size_percentage": 10,     // Max 10% of portfolio per trade
  "daily_trade_limit": 5,              // Max 5 trades per day
  "country": "UK"
}
```

### Risk Appetite Settings by Profile
```
HIGH Risk:
  - max_trade_size_percentage: 10-15%
  - daily_trade_limit: 5-10 trades
  - Leverage allowed: Yes
  - Margin trading: Yes

MEDIUM Risk:
  - max_trade_size_percentage: 5-10%
  - daily_trade_limit: 3-5 trades
  - Leverage allowed: 2x
  - Margin trading: No

LOW Risk:
  - max_trade_size_percentage: 3-5%
  - daily_trade_limit: 1-3 trades
  - Leverage allowed: No
  - Margin trading: No
```

---

## Supervisor Routing Logic

### Decision Matrix

| User Request | Route To | Reasoning |
|---|---|---|
| "What's BTC price?" | crypto_price_agent | Price inquiry |
| "Buy 1 BTC" | trade_agent | Trade execution |
| "Sell my ETH" | trade_agent | Trade execution |
| "Show portfolio" | trade_agent (get_portfolio_info) | Portfolio check |
| "What's happening in crypto?" | websearch_agent | News/events |
| "Is Bitcoin sentiment good?" | news_sentiment_agent | Sentiment analysis |
| "Rebalance my portfolio" | trade_agent | Portfolio rebalancing |
| "How much profit on BTC?" | trade_agent (get_portfolio_info) | P&L check |

---

## Prompts Summary

### Supervisor Prompt (Updated)
- Crypto trading context
- 4 agents available (added trade_agent)
- Routes based on user intent
- Considers user profile for trade requests
- Validates risk constraints before approving trades

### Trade Agent Prompt
- User profile awareness (risk, experience, limits)
- Portfolio constraints enforcement
- Trade validation rules
- Communication guidelines for rejections
- Portfolio impact reporting

### Finance Agent Prompt (Updated)
- Crypto market analysis context
- Cryptocurrency terminology
- Price/volume/market cap focus
- Whale activity detection

---

## Example Scenarios

### Scenario 1: Simple Buy
```
User: "Buy 0.5 BTC"

Supervisor Route: trade_agent
Task: "Execute buy 0.5 BTC"

Trade Agent Checks:
✓ User: Alice (High risk, $150k portfolio)
✓ Symbol: BTC valid
✓ Amount: 0.5 > 0 ✓
✓ Position: 0.5 × $43.5k = $21.75k (14.5% of portfolio)
✓ Limit: 10% allowed, 14.5% exceeds → WARNING

Action: Execute with warning

Response: "Buy executed: 0.5 BTC @ $43,500
⚠️ Your position is now 14.5% of portfolio (exceeds 10% recommendation)"
```

### Scenario 2: Insufficient Balance
```
User: "Sell 10 BTC"

Trade Agent Checks:
✗ User has only 2.5 BTC
✗ Trying to sell 10 BTC → INSUFFICIENT BALANCE

Response: "Cannot execute: You have 2.5 BTC but trying to sell 10.
Available to sell: 2.5 BTC maximum"
```

### Scenario 3: Invalid Symbol
```
User: "Buy 100 SHIB"

Trade Agent Checks:
✗ SHIB not in preferred list: ["BTC", "ETH"]
✗ User can only trade approved cryptos

Response: "Cannot execute: SHIB not in your approved list.
Approved: BTC, ETH
Contact support to add more cryptocurrencies."
```

---

## Integration Checklist

- [x] Trade Agent created (`agents/trade.py`)
- [x] Trade MCP Server created (`mcp/servers/trade_mcp.py`)
- [x] MCP client updated with trade tools
- [x] State models enhanced with TradeExecution
- [x] Supervisor routing updated
- [x] Orchestrator graph updated
- [x] User models converted to crypto
- [x] System prompts updated
- [ ] Real exchange API integration
- [ ] Real market price API integration
- [ ] Database persistence
- [ ] Production security hardening

---

## Files Reference

| File | Purpose | Modified |
|---|---|---|
| `agents/trade.py` | Trade Agent | ✅ NEW |
| `mcp/servers/trade_mcp.py` | Trade Tools | ✅ NEW |
| `mcp/clients.py` | Trade Tool Registration | ✅ Updated |
| `models/state_models.py` | TradeExecution Model | ✅ Updated |
| `agents/supervisor.py` | Routing + Prompts | ✅ Updated |
| `agents/finance.py` | Crypto Context | ✅ Updated |
| `services/orchestrator.py` | Graph + Routing | ✅ Updated |
| `api/users.py` | Crypto Portfolio | ✅ Updated |

---

*Quick Reference v1.0 - Updated: 2025-10-19*
