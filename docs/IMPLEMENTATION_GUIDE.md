# Implementation Guide

This guide provides instructions for implementing and using the features from FEATURE_IMPLEMENTATIONS.md.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Real-Time Monitoring](#real-time-monitoring)
3. [Security Enhancements](#security-enhancements)
4. [API Improvements](#api-improvements)
5. [Database Optimizations](#database-optimizations)
6. [Notification System](#notification-system)
7. [Testing](#testing)
8. [Deployment](#deployment)

## Getting Started

### Prerequisites

```bash
npm install --save speakeasy qrcode axios redis ioredis mongoose socket.io
npm install --save-dev jest supertest
```

### Environment Variables

Add to your `.env` file:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/codepark

# Redis
REDIS_URL=redis://localhost:6379

# Webhooks
WEBHOOK_SECRET_KEY=your-secret-key-here

# MFA
MFA_ISSUER=CodePark
```

## Real-Time Monitoring

### Setup

```javascript
const MetricsService = require('./services/MetricsService');
const { Server } = require('socket.io');

const metricsService = new MetricsService();

// Register collectors
metricsService.registerCollector('api-response-time', { aggregation: 'avg' });
metricsService.registerCollector('database-query-time', { aggregation: 'avg' });
metricsService.registerCollector('user-activity', { aggregation: 'count' });

// Start streaming (requires Socket.IO)
const io = new Server(server);
metricsService.startStreaming(io);
```

### Recording Metrics

```javascript
// In your route handlers or middleware
const startTime = Date.now();
// ... perform operation
const duration = Date.now() - startTime;
metricsService.record('api-response-time', duration, {
  endpoint: req.path,
  method: req.method
});
```

### Frontend Integration

```javascript
// Client-side Socket.IO connection
const socket = io('http://localhost:3000');

socket.on('metrics:snapshot', (data) => {
  console.log('Initial metrics:', data);
  updateDashboard(data);
});

socket.on('metrics:update', (data) => {
  console.log('Metrics update:', data);
  updateDashboard(data);
});
```

## Security Enhancements

### Multi-Factor Authentication

```javascript
const MFAService = require('./services/MFAService');
const mfaService = new MFAService({ issuer: 'CodePark' });

// Setup MFA for user
app.post('/api/auth/mfa/setup', async (req, res) => {
  const userId = req.user.id;
  const setup = await mfaService.setupMFA(userId, {
    email: req.user.email
  });
  
  // Save secret to database
  await User.updateOne(
    { _id: userId },
    { 
      mfaSecret: setup.secret,
      mfaBackupCodes: setup.backupCodes,
      mfaEnabled: false // User must verify first
    }
  );
  
  res.json({
    qrCode: setup.qrCode,
    backupCodes: setup.backupCodes
  });
});

// Verify and enable MFA
app.post('/api/auth/mfa/verify', async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user.id);
  
  const isValid = mfaService.verify(user.mfaSecret, token);
  
  if (isValid) {
    await User.updateOne(
      { _id: req.user.id },
      { mfaEnabled: true }
    );
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid token' });
  }
});
```

### Rate Limiting

```javascript
const RateLimiterService = require('./services/RateLimiterService');

// Global rate limiter
const globalLimiter = new RateLimiterService({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', globalLimiter.middleware());

// Endpoint-specific rate limiter
const authLimiter = new RateLimiterService({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});

app.post('/api/auth/login', authLimiter.middleware(), loginHandler);
```

## API Improvements

### Webhook System

```javascript
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);

// Dispatch events
const { webhookService } = require('./routes/webhooks');

// When a user is created
await webhookService.dispatch('user.created', {
  userId: user.id,
  email: user.email,
  createdAt: user.createdAt
});

// When a project is updated
await webhookService.dispatch('project.updated', {
  projectId: project.id,
  changes: changedFields
});
```

### GraphQL Subscriptions

Create `graphql/subscriptions.js`:

```javascript
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

const subscriptions = {
  projectUpdated: {
    subscribe: (_, { projectId }) => {
      return pubsub.asyncIterator([`PROJECT_UPDATED_${projectId}`]);
    }
  }
};

// Trigger subscription when project updates
pubsub.publish(`PROJECT_UPDATED_${projectId}`, {
  projectUpdated: updatedProject
});

module.exports = { subscriptions, pubsub };
```

## Database Optimizations

### Connection Pooling

```javascript
const DatabaseConfig = require('./config/database');

const dbConfig = new DatabaseConfig({
  uri: process.env.MONGODB_URI,
  minPoolSize: 10,
  maxPoolSize: 100
});

await dbConfig.connect();
```

### Caching Middleware

```javascript
const CacheMiddleware = require('./middleware/cacheMiddleware');

const cache = new CacheMiddleware({
  defaultTTL: 300, // 5 minutes
  redisUrl: process.env.REDIS_URL
});

await cache.connect();

// Apply to routes
app.get('/api/users', cache.middleware(60), getUsersHandler);
app.get('/api/projects', cache.middleware(300), getProjectsHandler);

// Invalidate cache on updates
app.put('/api/users/:id', async (req, res) => {
  // Update user
  await cache.invalidate('GET:/api/users*');
  res.json({ success: true });
});
```

## Notification System

### Setup

```javascript
const NotificationService = require('./services/NotificationService');
const { exampleHandlers } = require('./services/NotificationService');

const notificationService = new NotificationService();

// Register channels
notificationService.registerChannel('email', exampleHandlers.email);
notificationService.registerChannel('push', exampleHandlers.push);
notificationService.registerChannel('in-app', exampleHandlers['in-app']);

// Send notifications
await notificationService.notify(userId, {
  title: 'Welcome to CodePark!',
  body: 'Thank you for joining us.',
  priority: 'high'
}, ['email', 'in-app']);

// Bulk notifications
await notificationService.notifyBulk([
  { userId: 'user1', message: { title: 'Update 1' } },
  { userId: 'user2', message: { title: 'Update 2' } }
]);
```

## Testing

### Run Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests with coverage
npm test -- --coverage
```

### Add to package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:watch": "jest --watch"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"]
  }
}
```

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Redis server running
- [ ] MongoDB connection established
- [ ] Database indexes created
- [ ] Rate limits configured appropriately
- [ ] Webhook secrets generated
- [ ] MFA issuer name set

### Production Configuration

```javascript
// config/production.js
module.exports = {
  database: {
    poolSize: { min: 20, max: 200 },
    autoIndex: false // Disable for performance
  },
  cache: {
    defaultTTL: 600 // 10 minutes
  },
  rateLimiter: {
    windowMs: 15 * 60 * 1000,
    max: 1000 // Higher for production
  }
};
```

### Monitoring

```javascript
// Setup monitoring endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbConfig.getStats(),
    cache: cache.getStats(),
    metrics: metricsService.getSnapshot()
  });
});
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/skanda890/CodePark/issues
- Discussions: https://github.com/skanda890/CodePark/discussions
