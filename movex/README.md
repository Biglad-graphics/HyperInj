# MoveX — AI-Powered Perpetual DEX on Movement Network

The first perpetual futures DEX on Movement Network, with an AI multi-agent trading layer.
Trade BTC, ETH, and MOVE perps with up to 20x leverage — manually or via AI agents powered
by technical, sentiment, and on-chain signal consensus.

## Architecture

```
movex/
├── contracts/          Move smart contracts (vault, market, funding, liquidation)
├── frontend/           Next.js 14 trading UI
├── agent-engine/       TypeScript multi-agent AI (Groq LLM + technical + on-chain)
├── execution-engine/   Express REST API + Movement SDK integration
└── liquidation-bot/    Background service — monitors and liquidates positions
```

## Quick Start

### 1. Install dependencies

```bash
cd movex/frontend && npm install
cd movex/agent-engine && npm install
cd movex/execution-engine && npm install
cd movex/liquidation-bot && npm install
```

### 2. Configure env

```bash
cp movex/.env.example movex/.env
# Fill in MOVEX_ADDR, GROQ_API_KEY, wallet private keys
```

### 3. Deploy contracts (requires Movement CLI)

```bash
# Install: https://docs.movementnetwork.xyz/devs/getting-started
cd movex/contracts
movement move init --name movex
movement move compile
movement move test
movement move publish --network testnet
```

### 4. Run services

```bash
# Terminal 1 — frontend
cd movex/frontend && npm run dev

# Terminal 2 — execution engine
cd movex/execution-engine && npm run dev

# Terminal 3 — agent engine (needs REDIS_URL + GROQ_API_KEY)
cd movex/agent-engine && npm run dev

# Terminal 4 — liquidation bot
cd movex/liquidation-bot && npm run dev
```

## Smart Contracts

| Module | Description |
|---|---|
| `vault.move` | Deposit/withdraw USDCx collateral, lock/unlock margin |
| `market.move` | Open/close long & short positions, mark price via Pyth |
| `funding.move` | Hourly funding rate settlement between longs and shorts |
| `events.move` | Shared event type definitions for the indexer |

## AI Agent Engine

Three agents vote every hour per market:
1. **Technical** — RSI, MACD, SMA crossovers
2. **Sentiment** — Groq LLM analyses crypto news and social signals
3. **On-chain** — OI imbalance, funding rate divergence

A weighted consensus (45/30/25) produces a final `LONG | SHORT | NEUTRAL` signal with confidence score.
Trades only execute when ≥ 2 agents agree AND confidence ≥ 0.62.

## Supported Markets

| Market | Max Leverage | Collateral |
|---|---|---|
| BTC/USD-PERP | 20x | USDCx |
| ETH/USD-PERP | 20x | USDCx |
| MOVE/USD-PERP | 10x | USDCx |

## Deployment

All services are configured for [Render](https://render.com) via `movex/render.yaml`.
Set secret env vars in the Render dashboard before deploying.
