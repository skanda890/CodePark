# Real-time Event Streaming Feature

## Overview

Stream events in real-time to clients.

## Features

- Server-sent events
- WebSocket support
- Event filtering
- Subscription management

## Usage

```javascript
const source = new EventSource('/events/stream');
source.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```
