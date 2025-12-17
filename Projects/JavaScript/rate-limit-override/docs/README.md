# Rate Limit Override Feature

## Overview

Manage rate limits with override capabilities for authenticated users.

## Installation

```bash
npm install redis
```

## Features

- Dynamic rate limits
- User whitelisting
- Tier-based limits
- Reset capabilities
- Analytics

## Usage

```javascript
const limiter = new RateLimiter({
  windowMs: 60000,
  max: 100,
  skipSuccessfulRequests: false,
});

app.use(limiter);
```

## Configuration

```javascript
const overrides = {
  userId: "user123",
  limit: 10000,
  expires: "2025-12-31",
};

await limiter.setOverride(overrides);
```

## API

```
GET /rate-limits - Check limits
POST /rate-limits/override - Set override
DELETE /rate-limits/override/:id - Remove override
```

## Monitoring

- Request tracking
- Limit violations
- Override usage
