# 📨 WebHook System

Robust webhook delivery system with automatic retries, exponential backoff, and comprehensive delivery tracking.

## Features

- 🔧 **Reliable Delivery**: Retry logic with exponential backoff
- 📋 **Event Tracking**: Full delivery history and status
- 💬 **Event Filtering**: Subscribe to specific events
- 📡 **Delivery Verification**: HMAC signature verification
- 🔌 **REST API**: Easy webhook management
- 📊 **Metrics**: Delivery success rates and latency
- 🔐 **Security**: Timeout and rate limiting

## Installation

```bash
cd webhook-system
npm install
```

## Environment Variables

```env
PORT=3009
NODE_ENV=development
MAX_RETRIES=5
RETRY_DELAY=1000
REQUEST_TIMEOUT=10000
```

## Usage

### Start the Service

```bash
npm start
```

## REST API Endpoints

### POST /register

Register a webhook endpoint.

```bash
curl -X POST http://localhost:3009/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://myapp.example.com/webhooks/codepark",
    "event": "code-review",
    "secret": "webhook-secret-key",
    "active": true
  }'
```

**Response:**

```json
{
  "status": "registered",
  "id": "wh-20251215-xyz",
  "url": "https://myapp.example.com/webhooks/codepark",
  "event": "code-review"
}
```

### POST /dispatch

Trigger webhook delivery.

```bash
curl -X POST http://localhost:3009/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "event": "code-review",
    "payload": {
      "id": "review-123",
      "status": "approved",
      "reviewer": "alice@example.com"
    }
  }'
```

**Response:**

```json
{
  "status": "dispatched",
  "count": 3,
  "deliveries": [
    {
      "id": "del-1",
      "webhookId": "wh-1",
      "status": "queued"
    }
  ]
}
```

### GET /webhooks

List all webhooks.

```bash
curl http://localhost:3009/webhooks
```

**Response:**

```json
[
  {
    "id": "wh-1",
    "url": "https://app1.example.com/webhooks",
    "event": "code-review",
    "active": true,
    "created": "2025-12-01T10:00:00Z"
  }
]
```

### GET /deliveries/:webhookId

Get delivery history for a webhook.

```bash
curl http://localhost:3009/deliveries/wh-1
```

**Response:**

```json
{
  "webhookId": "wh-1",
  "deliveries": [
    {
      "id": "del-1",
      "timestamp": "2025-12-15T15:30:00Z",
      "event": "code-review",
      "status": "success",
      "statusCode": 200,
      "duration": 245,
      "attempt": 1
    },
    {
      "id": "del-2",
      "timestamp": "2025-12-15T15:35:00Z",
      "event": "code-review",
      "status": "retrying",
      "statusCode": 503,
      "duration": 5000,
      "attempt": 1,
      "retryAfter": "2025-12-15T15:35:02Z"
    }
  ]
}
```

## Event Types

| Event | Description | Trigger |
|:---:|:---:|:---:|
| `code-review` | Code review submitted | Pull request reviewed |
| `deployment` | Deployment completed | Build deployed |
| `build-failed` | Build failed | CI/CD failure |
| `test-passed` | All tests passed | Test suite completion |
| `issue-created` | Issue created | New GitHub issue |
| `pull-request` | PR opened/closed | PR state change |

## Webhook Payload Format

```json
{
  "id": "evt-20251215-xyz",
  "event": "code-review",
  "timestamp": "2025-12-15T15:30:00Z",
  "data": {
    "id": "review-123",
    "status": "approved",
    "reviewer": {
      "id": "user-456",
      "name": "Alice",
      "email": "alice@example.com"
    },
    "pullRequest": {
      "id": "pr-789",
      "number": 42,
      "title": "Add feature X"
    }
  }
}
```

## HMAC Signature Verification

### Receiving Webhooks Securely

```javascript
const crypto = require('crypto');
const express = require('express');
const app = express();

app.post('/webhooks/codepark', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = 'webhook-secret-key';
  
  // Calculate HMAC
  const payload = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Verify signature
  if (hash !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  console.log('Webhook verified:', req.body);
  res.json({ status: 'ok' });
});
```

## Retry Strategy

### Exponential Backoff

```javascript
const retryDelays = [
  1000,        // Attempt 1: immediate
  2000,        // Attempt 2: 2 sec delay
  4000,        // Attempt 3: 4 sec delay
  8000,        // Attempt 4: 8 sec delay
  16000,       // Attempt 5: 16 sec delay
];
```

### Retry Conditions

- **Network Errors**: Connection timeout, refused
- **5xx Errors**: Server errors (429, 500-599)
- **Rate Limiting**: 429 Too Many Requests
- **Not Retried**: 4xx errors (except 429), validation errors

## Configuration

### Webhook Registration

```json
{
  "url": "https://myapp.example.com/webhooks/codepark",
  "event": "code-review",
  "secret": "webhook-secret-xyz",
  "active": true,
  "maxRetries": 5,
  "timeout": 10000,
  "headers": {
    "Authorization": "Bearer token-xyz",
    "X-Custom-Header": "value"
  }
}
```

## Delivery Flow

```
Event Triggered
    |
    v
Find Registered Webhooks
    |
    v
Queue for Delivery
    |
    v
Execute HTTP POST
    |
    +--- Success (2xx) -> Mark as delivered
    |
    +--- Failure (5xx/timeout) -> Schedule retry
    |
    +--- Max retries exceeded -> Mark as failed
    |
```

## Performance

- **Delivery Latency**: < 1s (typical)
- **Retry Attempts**: Up to 5
- **Total Retry Window**: ~31 seconds
- **Throughput**: 1000+ webhooks/sec

## Troubleshooting

### Webhooks Not Delivered
- Verify URL is accessible
- Check firewall/NAT rules
- Review delivery logs
- Verify secret key

### Failed Signature Verification
- Ensure secret key matches
- Check payload encoding
- Verify HMAC algorithm (sha256)

## Dependencies

- `express@next` - Web framework
- `axios@next` - HTTP client
- `p-retry@next` - Retry utilities

## License

MIT
