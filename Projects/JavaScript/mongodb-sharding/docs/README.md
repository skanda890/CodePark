# MongoDB Sharding Feature

## Overview

Horizontal scaling with MongoDB sharding.

## Features

- Shard key selection
- Chunk management
- Shard balancing
- Shard monitoring

## Configuration

```javascript
db.adminCommand({
  enableSharding: "codepark_db",
});

db.adminCommand({
  shardCollection: "codepark_db.users",
  key: { userId: 1 },
});
```
