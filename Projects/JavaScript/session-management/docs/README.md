# Session Management Feature

## Overview

Secure session management with multiple storage options.

## Installation

```bash
npm install express-session connect-redis
```

## Features

- Session creation
- Session storage
- Session expiration
- CSRF protection
- Secure cookies

## Configuration

```javascript
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);
```

## Best Practices

- Use Redis for distributed sessions
- Set secure cookies
- Implement CSRF tokens
- Rotate session IDs
