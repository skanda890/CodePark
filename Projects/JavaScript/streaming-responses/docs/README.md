# Streaming Responses Feature

## Overview

Implement server-sent events and streaming responses.

## Installation

```bash
npm install express
```

## Features

- Server-sent events (SSE)
- Chunked responses
- Real-time data
- Connection management

## Usage

```javascript
app.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`);
  }, 1000);

  req.on("close", () => clearInterval(interval));
});
```

## Client Usage

```javascript
const source = new EventSource("/stream");

source.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

## Performance

- Low latency
- Memory efficient
- Scalable connections
