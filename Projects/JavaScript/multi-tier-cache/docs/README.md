# Multi-tier Caching Feature

## Overview

Implement L1 (memory), L2 (Redis), L3 (HTTP) caching.

## Features

- Memory cache (Node memory)
- Redis cache (distributed)
- HTTP cache (browser)
- Cache invalidation

## Usage

```javascript
const cache = new MultiTierCache({
  l1: new MemoryCache(),
  l2: new RedisCache(),
  ttl: 3600,
});

const value = await cache.get("key");
```
