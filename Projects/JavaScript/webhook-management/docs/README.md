# Webhook Management Feature

## Overview

Manage webhooks for event-driven architecture.

## Installation

```bash
npm install axios
```

## Features

- Create webhooks
- Delete webhooks
- Test webhooks
- Retry logic
- Event filtering

## Usage

```javascript
const webhook = {
  url: 'https://example.com/webhooks/events',
  events: ['user.created', 'user.updated'],
  active: true
};

await webhookManager.create(webhook);
```

## API Endpoints

```
POST /webhooks - Create
GET /webhooks - List
GET /webhooks/:id - Get
PUT /webhooks/:id - Update
DELETE /webhooks/:id - Delete
POST /webhooks/:id/test - Test
```

## Events

- `user.created`
- `user.updated`
- `user.deleted`
- `game.started`
- `game.ended`

## Retry Policy

- Exponential backoff
- Max 5 retries
- 1 minute timeout
