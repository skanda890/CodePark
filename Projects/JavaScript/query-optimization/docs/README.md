# Query Optimization Feature

## Overview

Optimize database queries with indexing and profiling.

## Features

- Index suggestions
- Query profiling
- Slow query detection
- Execution plan analysis

## Profiling

```javascript
db.setProfilingLevel(1, { slowms: 100 });
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty();
```
