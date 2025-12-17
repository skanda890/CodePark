# Dead Letter Queue Feature

## Overview

Handle failed tasks with a DLQ.

## Features

- Failed task storage
- Replay capabilities
- Analysis tools
- Alerts

## Usage

```javascript
const dlq = new DeadLetterQueue();
await dlq.add(failedTask);
await dlq.replay(taskId);
```
