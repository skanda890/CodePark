# Cache Invalidation by Tags Feature

## Overview

Tag-based cache invalidation strategy.

## Features

- Tag assignment
- Bulk invalidation
- Cascade invalidation
- Smart invalidation

## Usage

```javascript
cache.set('user:1', userData, ['user', 'user:1']);
cache.invalidateByTag('user'); // Invalidate all user caches
```
