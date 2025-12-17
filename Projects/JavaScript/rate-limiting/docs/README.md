# Rate Limiting Feature

## Overview

Prevent abuse with rate limiting.

## Installation

```bash
npm install express-rate-limit
```

## Configuration

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);
```
