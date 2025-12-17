# Audit Logging Feature

## Overview

Comprehensive audit logging for compliance.

## Features

- User action tracking
- Change logging
- Access logs
- Data export
- Retention policies

## Usage

```javascript
auditLogger.log({
  userId: user.id,
  action: 'user.update',
  resource: 'User',
  resourceId: user.id,
  changes: { role: 'admin' },
  timestamp: new Date()
});
```

## API

```
GET /audit/logs - List logs
GET /audit/logs/:userId - User logs
GET /audit/logs/resource/:resourceId - Resource logs
DELETE /audit/logs - Purge old logs
```
