# HyperInj Deployment Guide

## Prerequisites

- [Railway account](https://railway.app) and [Railway CLI](https://docs.railway.app/develop/cli): `npm install -g @railway/cli`
- [Vercel account](https://vercel.com) and [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`
- Git repository pushed to GitHub

---

## Step 1: Deploy Redis on Railway

1. In the Railway dashboard, create a new project.
2. Click **+ New** → **Database** → **Redis**.
3. Once provisioned, copy the `REDIS_URL` from the **Variables** tab — you'll need it in Step 4.

---

## Step 2: Deploy agentic-backend on Railway

1. In the same Railway project, click **+ New** → **GitHub Repo** → select this repo.
2. Set the **Root Directory** to `agentic-backend`.
3. Railway will use `agentic-backend/railway.toml` automatically.
4. Add the following environment variables in the Railway **Variables** tab:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `ANTHROPIC_BASE_URL` | Anthropic API base URL (e.g. `https://api.anthropic.com`) |
| `DATABASE_URL` | Your database connection string |

5. Note the public URL assigned to this service (e.g. `https://agentic-backend-xxxx.railway.app`).

---

## Step 3: Deploy execution-engine on Railway

1. Click **+ New** → **GitHub Repo** → same repo.
2. Set **Root Directory** to `execution-engine`.
3. Add environment variables:

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB connection string |
| `INJECTIVE_NETWORK` | `mainnet` |

---

## Step 4: Deploy algorithm-engine on Railway

1. Click **+ New** → **GitHub Repo** → same repo.
2. Set **Root Directory** to `algorithm-engine`.
3. Add environment variables:

| Variable | Value |
|---|---|
| `REDIS_URL` | The Redis URL from Step 1 |
| `AI_BASE_URL` | The agentic-backend URL from Step 2 |

---

## Step 5: Deploy frontend on Vercel

1. Run `vercel` from the `frontend/` directory, or connect the repo in the Vercel dashboard and set the **Root Directory** to `frontend`.
2. Add the following environment variables in Vercel project settings:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Your Privy app ID |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | Your Privy client ID |
| `NEXT_PUBLIC_API_BASE_URL` | agentic-backend URL from Step 2 (https://) |
| `NEXT_PUBLIC_AGENT_WS_URL` | agentic-backend URL from Step 2 (wss://) |

---

## Local Development

Copy `frontend/.env.production` to `frontend/.env.local` and fill in real values.
For backend services, create `.env` files in each service directory using the variables listed above.
