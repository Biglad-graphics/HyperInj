# HyperInj — Deployment Guide

## Architecture

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend (Next.js) | Vercel | Zero-config, global CDN |
| Agentic Backend (FastAPI) | Render | WebSocket + REST |
| Execution Engine (Express) | Render | REST API + Injective orders |
| Algorithm Engine (BullMQ) | Render | Background worker |
| Redis | Render | Managed Redis (free tier) |
| MongoDB | Atlas | Already configured |

---

## Step 1 — Deploy backends on Render

1. Go to [render.com](https://render.com) → **New → Blueprint**
2. Connect your GitHub account and select `Biglad-graphics/HyperInj`
3. Render will detect `render.yaml` at the repo root and create all 4 services automatically.
4. During setup, fill in the **secret env vars** in the Render dashboard:

   **hyperinj-agentic-backend:**
   ```
   ANTHROPIC_API_KEY=fe_oa_e0b50ea4f7ca5f63365cbdec0d402b3aab7fc066b38ea920
   ```

   **hyperinj-execution-engine:**
   ```
   MONGODB_URI=mongodb+srv://bigladgraphics_db_user:<password>@cluster0.hsb7dxe.mongodb.net/hyperinj?retryWrites=true&w=majority
   ```

5. Wait for all services to go **Live** (first deploy takes 3–5 min each).
6. Copy the agentic-backend public URL, e.g.:
   ```
   https://hyperinj-agentic-backend.onrender.com
   ```

> **Note:** Free-tier services spin down after 15 min of inactivity and wake on the next request (~30s cold start). Upgrade to Starter ($7/mo) to keep them always-on.

---

## Step 2 — Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project → Import Git Repository**
2. Select `Biglad-graphics/HyperInj`
3. Set **Root Directory** → `frontend`
4. Add these environment variables:

   ```
   NEXT_PUBLIC_PRIVY_APP_ID=cmq3vti8800an0cjo33gx0qmd
   NEXT_PUBLIC_PRIVY_CLIENT_ID=client-WY6aFJpwJr5cEXCt63DbDoauhWcDXs6Z7vvMygiSY2WHE
   NEXT_PUBLIC_API_BASE_URL=https://hyperinj-agentic-backend.onrender.com
   NEXT_PUBLIC_AGENT_WS_URL=wss://hyperinj-agentic-backend.onrender.com
   ```

5. Click **Deploy**.

---

## Local development

Each service reads from its own `.env` file (gitignored). Defaults:

```
# agentic-backend/.env
ANTHROPIC_API_KEY=...
ANTHROPIC_BASE_URL=https://cc.freemodel.dev

# execution-engine/.env
MONGODB_URI=...
PORT=4000
INJECTIVE_NETWORK=mainnet

# algorithm-engine/.env
REDIS_URL=redis://127.0.0.1:6379
AI_BASE_URL=ws://localhost:8000/ws/chat
INJECTIVE_NETWORK=mainnet

# frontend/.env.local
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_PRIVY_CLIENT_ID=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8000
```

Start Redis locally: `cd algorithm-engine && docker compose up -d`
