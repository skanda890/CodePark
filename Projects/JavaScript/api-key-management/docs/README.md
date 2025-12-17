# API Key Management Feature

## Overview

Manage API keys for programmatic access.

## Features

- Key generation
- Key rotation
- Scopes/permissions
- Rate limiting per key
- Usage tracking

## API

```
POST /api-keys - Create key
GET /api-keys - List keys
GET /api-keys/:id - Get key
DELETE /api-keys/:id - Delete key
POST /api-keys/:id/rotate - Rotate key
```

## Usage

```
Authorization: Bearer sk_live_1234567890
```
