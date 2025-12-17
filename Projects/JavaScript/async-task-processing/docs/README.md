# Async Task Processing Feature

## Overview

Process tasks asynchronously using queues.

## Features

- Task queuing
- Worker pools
- Priority queues
- Progress tracking

## Usage

```javascript
const queue = new TaskQueue();
await queue.add({ type: "email", data: { to: "user@example.com" } });
```
