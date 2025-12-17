# IP Whitelist/Blacklist Feature

## Overview

Manage IP-based access control.

## Features

- Whitelist management
- Blacklist management
- CIDR support
- Geographic blocking

## Usage

```javascript
const ipControl = new IPControl();

app.use((req, res, next) => {
  const ip = req.ip;
  if (!ipControl.isAllowed(ip)) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
});
```

## API

```
GET /ip-control/whitelist - List whitelist
POST /ip-control/whitelist - Add IP
DELETE /ip-control/whitelist/:ip - Remove IP
GET /ip-control/blacklist - List blacklist
POST /ip-control/blacklist - Add IP
```
