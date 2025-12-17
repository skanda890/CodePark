# Notification System Feature

## Overview

Multi-channel notifications.

## Channels

- Email
- SMS
- Push
- In-app
- Webhooks

## Usage

```javascript
await notificationManager.send({
  type: "welcome",
  channels: ["email", "in-app"],
  recipient: user,
});
```
