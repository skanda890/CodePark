# Distributed Cache Sync Feature

## Overview

Keep caches synchronized across instances.

## Features

- Event-based sync
- Pub/Sub messaging
- Cache coherence
- Conflict resolution

## Usage

```javascript
cache.on('update', (key, value) => {
  pubsub.publish('cache:update', { key, value });
});
```
