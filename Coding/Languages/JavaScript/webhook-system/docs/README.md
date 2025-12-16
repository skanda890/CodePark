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

```bash
npm start
```

## Endpoints

- `POST /register` - Register webhook endpoint
- `POST /dispatch` - Trigger webhook delivery

## Event Types

- `code-review` - Code review submitted
- `deployment` - Deployment completed
- `build-failed` - Build failed
- `test-passed` - Tests passed

## Retry Strategy

Exponential backoff with up to 5 retries.

## Dependencies

- `express@next` - Web framework
- `axios@next` - HTTP client
- `p-retry@next` - Retry utilities

## License

MIT
