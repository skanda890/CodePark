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

### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Verify Token

```http
GET /api/v1/auth/verify
Authorization: Bearer your-token
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
  "attempts": 1
}
```

**Response (too high):**

```json
{
  "result": "too high",
  "attempts": 2
}
```

**Response (correct):**

```json
{
  "result": "correct",
  "attempts": 3,
  "message": "Congratulations! You guessed it in 3 attempt(s)!"
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

## Health Endpoints

### General Health

```http
GET /health
```

### Liveness Probe

```http
GET /health/live
```

### Readiness Probe

```http
GET /health/ready
```

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
