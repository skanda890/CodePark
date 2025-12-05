# CodePark API Documentation v2.0

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

All game endpoints require JWT authentication.

### Get Token
```http
POST /api/v1/auth/token
Content-Type: application/json

{
  "username": "player1"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "24h",
  "user": {
    "username": "player1",
    "userId": "user-1733414400000"
  }
}
```

**Notes:**
- Access token expires in 24h (default)
- Refresh token expires in 7d (default)
- Store both tokens securely
- Use access token for API calls
- Use refresh token to get new access token

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "24h"
}
```

**Notes:**
- Call this before access token expires
- Returns new access token only
- Refresh token remains valid
- **Fixed**: Now correctly verifies refresh token with proper secret

### Verify Token
```http
GET /api/v1/auth/verify
Authorization: Bearer your-token
```

**Response (valid):**
```json
{
  "valid": true,
  "user": {
    "username": "player1",
    "userId": "user-1733414400000"
  }
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "error": "jwt expired"
}
```

## Game Endpoints

### Start Game
```http
GET /api/v1/game/start
Authorization: Bearer your-token
```

**Response:**
```json
{
  "message": "Number guessing game started! Guess a number between 1 and 100.",
  "gameId": "1733414400000-123456789",
  "expiresIn": "10 minutes",
  "hint": "POST /api/v1/game/check with your guess"
}
```

### Check Guess
```http
POST /api/v1/game/check
Authorization: Bearer your-token
Content-Type: application/json

{
  "gameId": "1733414400000-123456789",
  "guess": 50
}
```

**Response (too low):**
```json
{
  "result": "too low",
  "attempts": 1,
  "hint": "Try a higher number"
}
```

**Response (too high):**
```json
{
  "result": "too high",
  "attempts": 2,
  "hint": "Try a lower number"
}
```

**Response (correct):**
```json
{
  "result": "correct",
  "attempts": 3,
  "message": "Congratulations! You guessed it in 3 attempt(s)!",
  "number": 73
}
```

### Get Stats
```http
GET /api/v1/game/stats
Authorization: Bearer your-token
```

**Response:**
```json
{
  "activeGames": 2,
  "totalActiveGames": 15,
  "maxGames": 1000,
  "games": [
    {
      "gameId": "1733414400000-123456789",
      "createdAt": 1733414400000,
      "attempts": 3
    }
  ]
}
```

### Cancel Game
```http
DELETE /api/v1/game/:gameId
Authorization: Bearer your-token
```

**Response:**
```json
{
  "message": "Game cancelled successfully",
  "gameId": "1733414400000-123456789"
}
```

## Health Endpoints

### General Health
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-05T13:37:00.000Z",
  "uptime": 123.456,
  "version": "2.0.0",
  "environment": "development",
  "features": {
    "websocket": true,
    "redis": true,
    "metrics": true,
    "caching": true,
    "compression": true
  },
  "cache": {
    "mode": "redis",
    "degraded": false,
    "status": "ok"
  },
  "connections": {
    "websocket": 5
  }
}
```

**Cache Status Values**:
- `ok` - Redis connected and working
- `degraded` - Redis down, using in-memory fallback (NEW!)
- `disabled` - Cache intentionally disabled
- `error` - Cache completely unavailable

### Liveness Probe
```http
GET /health/live
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-05T13:37:00.000Z"
}
```

### Readiness Probe
```http
GET /health/ready
```

**Response (ready):**
```json
{
  "status": "ready",
  "timestamp": "2025-12-05T13:37:00.000Z",
  "checks": {
    "server": "ok",
    "cache": "ok",
    "websocket": "ok"
  }
}
```

**Response (degraded):**
```json
{
  "status": "degraded",
  "timestamp": "2025-12-05T13:37:00.000Z",
  "checks": {
    "server": "ok",
    "cache": "degraded",
    "websocket": "ok"
  }
}
```

**Note**: Now correctly reports cache degradation when Redis is down!

## Metrics

```http
GET http://localhost:9090/metrics
```

Prometheus format metrics.

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Game Endpoints**: 20 requests per 5 minutes per IP

## Error Responses

All errors follow this format:

```json
{
  "error": "Error title",
  "message": "Detailed error message",
  "requestId": "uuid-v4-request-id"
}
```

### Status Codes

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not allowed)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable (capacity reached)

## JWT Token Flow

```
1. Get Token
   POST /api/v1/auth/token
   ↓
   Returns: accessToken + refreshToken

2. Use Access Token
   GET /api/v1/game/start
   Authorization: Bearer <accessToken>
   ↓
   Works for 24h

3. Token Expires
   API returns 401
   ↓
   
4. Refresh Token
   POST /api/v1/auth/refresh
   Body: { refreshToken }
   ↓
   Returns: new accessToken

5. Continue Using API
   Use new accessToken
   ↓
   Repeat from step 2

6. Refresh Token Expires (7d)
   Must get new tokens from step 1
```

## Configuration

See `.env.example` for all configuration options.

**Key settings**:
- `JWT_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret (optional, recommended)
- `JWT_EXPIRY` - Access token lifetime (default: 24h)
- `JWT_REFRESH_EXPIRY` - Refresh token lifetime (default: 7d)
- `REDIS_ENABLED` - Enable Redis cache
- `WS_ENABLED` - Enable WebSocket
- `METRICS_ENABLED` - Enable Prometheus metrics
