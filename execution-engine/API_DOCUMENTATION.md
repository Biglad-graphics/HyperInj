# API Documentation

This document describes all the available API endpoints for the execution engine.

## Authentication

All API endpoints (except health check) require authentication using Privy tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_privy_token>
```

## Base URL

```
http://localhost:3000
```

## 1. Agent APIs

### POST /api/agents
Create a new base agent (admin only)

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Sentiment Agent",
  "type": "sentiment",
  "weightage": 0.5,
  "prompt": "Analyze crypto sentiment from news and social sources."
}
```

**Response:**
```json
{
  "message": "Agent created successfully",
  "agent": {
    "_id": "...",
    "name": "Sentiment Agent",
    "type": "sentiment",
    "weightage": 0.5,
    "prompt": "Analyze crypto sentiment from news and social sources.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/agents
List all base agents

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "_id": "...",
    "name": "Sentiment Agent",
    "type": "sentiment",
    "weightage": 0.5,
    "prompt": "Analyze crypto sentiment from news and social sources.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/agents/:id
Get agent by ID

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "_id": "...",
  "name": "Sentiment Agent",
  "type": "sentiment",
  "weightage": 0.5,
  "prompt": "Analyze crypto sentiment from news and social sources.",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/agents/:id
Update agent (admin only)

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "Updated Sentiment Agent",
  "type": "sentiment",
  "weightage": 0.7,
  "prompt": "Updated prompt for sentiment analysis."
}
```

**Response:**
```json
{
  "message": "Agent updated successfully",
  "agent": {
    "_id": "...",
    "name": "Updated Sentiment Agent",
    "type": "sentiment",
    "weightage": 0.7,
    "prompt": "Updated prompt for sentiment analysis.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE /api/agents/:id
Delete agent (admin only)

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Agent deleted successfully"
}
```

## 2. Strategy APIs

### POST /api/strategies
Create a new strategy for a user (with agent configs)

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "BTC EMA Crossover",
  "description": "Goes long when EMA7 crosses EMA30 upward",
  "agents": [
    {
      "agentId": "6501f1...",
      "votingPower": 0.7,
      "customPrompt": "Analyze EMA and RSI trends"
    },
    {
      "agentId": "6501f2...",
      "votingPower": 0.3,
      "customPrompt": "Check short-term sentiment from Twitter"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Strategy created successfully",
  "strategy": {
    "_id": "...",
    "name": "BTC EMA Crossover",
    "description": "Goes long when EMA7 crosses EMA30 upward",
    "agentConfigs": ["...", "..."],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/strategies/:userId
Fetch all strategies of a user with populated agent configs

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "_id": "...",
    "name": "BTC EMA Crossover",
    "description": "Goes long when EMA7 crosses EMA30 upward",
    "agentConfigs": [
      {
        "_id": "...",
        "votingPower": 0.7,
        "customPrompt": "Analyze EMA and RSI trends",
        "agentId": {
          "_id": "...",
          "name": "Technical Agent",
          "type": "technical",
          "weightage": 0.5,
          "prompt": "Analyze technical indicators..."
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/strategy/:strategyId
Fetch single strategy with all agent configs populated

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "_id": "...",
  "name": "BTC EMA Crossover",
  "description": "Goes long when EMA7 crosses EMA30 upward",
  "agentConfigs": [
    {
      "_id": "...",
      "votingPower": 0.7,
      "customPrompt": "Analyze EMA and RSI trends",
      "agentId": {
        "_id": "...",
        "name": "Technical Agent",
        "type": "technical",
        "weightage": 0.5,
        "prompt": "Analyze technical indicators..."
      }
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/strategy/:strategyId
Update strategy metadata or its agent configs

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "BTC EMA v2",
  "description": "Updated thresholds",
  "agents": [
    {
      "agentId": "6501f1...",
      "votingPower": 0.6,
      "customPrompt": "Include MACD as well"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Strategy updated successfully",
  "strategy": {
    "_id": "...",
    "name": "BTC EMA v2",
    "description": "Updated thresholds",
    "agentConfigs": ["..."],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE /api/strategy/:strategyId
Delete a strategy and all its linked user agent configs

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Strategy deleted successfully"
}
```

## 3. User Agent Config API

### PATCH /api/user-agent-config/:configId
Update voting power or custom prompt of a specific agent in a strategy

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "votingPower": 0.8,
  "customPrompt": "Focus on 1h BTC sentiment from Twitter"
}
```

**Response:**
```json
{
  "message": "Agent config updated successfully",
  "userAgentConfig": {
    "_id": "...",
    "votingPower": 0.8,
    "customPrompt": "Focus on 1h BTC sentiment from Twitter",
    "agentId": "...",
    "strategyId": "...",
    "userId": "...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /api/user-agent-config/:configId
Get user agent config by ID

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "_id": "...",
  "votingPower": 0.8,
  "customPrompt": "Focus on 1h BTC sentiment from Twitter",
  "agentId": {
    "_id": "...",
    "name": "Sentiment Agent",
    "type": "sentiment",
    "weightage": 0.5,
    "prompt": "Analyze crypto sentiment..."
  },
  "strategyId": {
    "_id": "...",
    "name": "BTC EMA Crossover"
  },
  "userId": "...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/user-agent-config/:configId
Delete user agent config

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Agent config deleted successfully"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "requestId": "unique-request-id",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Environment Variables

Make sure to set these environment variables:

- `NEXT_PUBLIC_PRIVY_APP_ID`: Your Privy app ID
- `NEXT_PUBLIC_PRIVY_APP_SECRET`: Your Privy app secret
- `ADMIN_WALLET_ADDRESSES`: Comma-separated list of admin wallet addresses

## Folder Structure

The API is organized with the following structure:

```
src/
├── controllers/
│   ├── agent.controller.ts
│   ├── strategy.controller.ts
│   ├── userAgentConfig.controller.ts
│   └── user.controller.ts
├── middleware/
│   ├── auth.ts
│   └── errorHandler.ts
├── models/
│   ├── agent.model.ts
│   ├── strategy.model.ts
│   ├── user.model.ts
│   └── userAgentConfig.model.ts
└── routes/
    ├── agent.ts
    ├── strategy.ts
    ├── userAgentConfig.ts
    └── index.ts
```
