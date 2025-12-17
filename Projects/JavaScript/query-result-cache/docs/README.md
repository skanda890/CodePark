# Query Result Caching Feature

## Overview

Cache database query results automatically.

## Features

- Query fingerprinting
- Automatic cache key generation
- Invalidation strategies
- Query warming

## Usage

```javascript
const cached = new CachedQuery(db);
const results = await cached.find({ role: 'admin' });
```
