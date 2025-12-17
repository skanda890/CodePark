# Database Migrations Feature

## Overview

Manage database schema changes with migrations.

## Features

- Migration runner
- Version tracking
- Rollback support
- Lock mechanism

## CLI

```bash
npm run migrate up
npm run migrate down
npm run migrate status
```

## Migration File

```javascript
module.exports = {
  up: async (db) => {
    await db.createCollection("users");
  },
  down: async (db) => {
    await db.dropCollection("users");
  },
};
```
