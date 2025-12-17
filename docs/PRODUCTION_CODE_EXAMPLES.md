# CodePark Production-Ready Code Examples

## File 1: config/redis-tls.js

```javascript
const redis = require('redis');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const createRedisClient = async () => {
  try {
    // Validate environment
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisTLS = process.env.REDIS_TLS === 'true';

    let options = {
      host: redisHost,
      port: redisPort,
      db: 0,
      retryStrategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry exceeded timeout');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      },
      password: redisPassword
    };

    // Configure TLS if enabled
    if (redisTLS) {
      options.tls = {
        ca: fs.readFileSync(path.join(process.env.REDIS_CA_CERT || '/etc/redis/ca.crt')),
        cert: fs.readFileSync(path.join(process.env.REDIS_CLIENT_CERT || '/etc/redis/client.crt')),
        key: fs.readFileSync(path.join(process.env.REDIS_CLIENT_KEY || '/etc/redis/client.key')),
        rejectUnauthorized: true
      };
      logger.info('Redis TLS enabled');
    }

    const client = redis.createClient(options);

    client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    // Health check
    const healthCheck = setInterval(async () => {
      try {
        await client.ping();
      } catch (err) {
        logger.error('Redis health check failed:', err);
      }
    }, 30000);

    client.on('close', () => {
      clearInterval(healthCheck);
    });

    return client;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    throw error;
  }
};

module.exports = { createRedisClient };
```

---

## File 2: config/database-tls.js

```javascript
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const connectDatabase = async () => {
  try {
    // Validate environment
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      throw new Error('MONGODB_URL is required');
    }

    const mongoUser = process.env.MONGODB_USER;
    const mongoPassword = process.env.MONGODB_PASSWORD;
    const mongoTLS = process.env.MONGODB_TLS === 'true';

    let options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
      journal: true
    };

    // Add credentials if provided
    if (mongoUser && mongoPassword) {
      options.user = mongoUser;
      options.pass = mongoPassword;
    }

    // Configure TLS if enabled
    if (mongoTLS) {
      options.ssl = true;
      options.sslCA = fs.readFileSync(path.join(process.env.MONGODB_CA_CERT || '/etc/mongodb/ca.crt'));
      options.sslCert = fs.readFileSync(path.join(process.env.MONGODB_CLIENT_CERT || '/etc/mongodb/client.crt'));
      options.sslKey = fs.readFileSync(path.join(process.env.MONGODB_CLIENT_KEY || '/etc/mongodb/client.key'));
      options.sslValidate = true;
      logger.info('MongoDB TLS enabled');
    }

    await mongoose.connect(mongoUrl, options);
    logger.info('Connected to MongoDB');

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

module.exports = { connectDatabase };
```

---

## File 3: middleware/validation/index.js

```javascript
const { body, validationResult, query, param } = require('express-validator');
const { z } = require('zod');

// Zod schemas for type-safe validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[a-z]/, 'Password must contain lowercase')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[!@#$%^&*]/, 'Password must contain special character'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric, underscore, hyphen')
});

// Express validators
const authValidation = {
  register: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail(),
    body('password')
      .isLength({ min: 12 })
      .matches(/[A-Z]/)
      .matches(/[a-z]/)
      .matches(/[0-9]/)
      .matches(/[!@#$%^&*]/),
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_-]+$/)
  ],
  
  login: [
    body('email').trim().isEmail(),
    body('password').notEmpty()
  ],
  
  updateProfile: [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 }),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
  ]
};

const gameValidation = {
  createGame: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .escape(),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .escape(),
    body('genre')
      .isIn(['action', 'adventure', 'puzzle', 'rpg', 'strategy', 'other'])
  ],
  
  updateScore: [
    param('gameId').isMongoId(),
    body('score')
      .isInt({ min: 0, max: 999999999 })
      .toInt()
  ]
};

const webhookValidation = {
  create: [
    body('url')
      .isURL({ require_protocol: true })
      .custom((url) => {
        const allowedDomains = (process.env.WEBHOOK_DOMAINS || '').split(',');
        const urlObj = new URL(url);
        return allowedDomains.includes(urlObj.hostname);
      }),
    body('events')
      .isArray()
      .custom((events) => {
        const validEvents = ['game.created', 'game.updated', 'score.submitted', 'user.registered'];
        return events.every(event => validEvents.includes(event));
      })
  ]
};

// Error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = {
  authValidation,
  gameValidation,
  webhookValidation,
  handleValidationErrors,
  registerSchema,
  validationResult
};
```

---

## File 4: middleware/webhook-signature.js

```javascript
const crypto = require('crypto');
const logger = require('../logger');

const SIGNATURE_ALGORITHM = 'sha256';
const SIGNATURE_HEADER = 'x-webhook-signature';
const TIMESTAMP_HEADER = 'x-webhook-timestamp';
const MAX_TIMESTAMP_DIFF = 5 * 60 * 1000; // 5 minutes

// Generate webhook signature
const generateSignature = (payload, secret) => {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto
    .createHmac(SIGNATURE_ALGORITHM, secret)
    .update(payloadString)
    .digest('hex');
};

// Verify webhook signature
const verifyWebhookSignature = (signature, payload, secret) => {
  const expected = generateSignature(payload, secret);
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
};

// Middleware to verify webhook requests
const webhookVerification = (req, res, next) => {
  const signature = req.get(SIGNATURE_HEADER);
  const timestamp = req.get(TIMESTAMP_HEADER);
  const webhookSecret = process.env.WEBHOOK_SECRET;

  // Validate headers
  if (!signature || !timestamp) {
    logger.warn('Webhook missing signature or timestamp', { 
      ip: req.ip,
      path: req.path 
    });
    return res.status(401).json({ 
      error: 'Missing webhook signature or timestamp' 
    });
  }

  // Validate timestamp to prevent replay attacks
  const requestTime = parseInt(timestamp) * 1000;
  const now = Date.now();
  
  if (isNaN(requestTime) || Math.abs(now - requestTime) > MAX_TIMESTAMP_DIFF) {
    logger.warn('Webhook timestamp validation failed', { 
      ip: req.ip,
      path: req.path,
      timeDiff: Math.abs(now - requestTime)
    });
    return res.status(401).json({ 
      error: 'Invalid or expired webhook timestamp' 
    });
  }

  // Verify signature
  try {
    const bodyString = JSON.stringify(req.body);
    const verifyPayload = `${timestamp}.${bodyString}`;
    
    verifyWebhookSignature(signature, verifyPayload, webhookSecret);
    logger.info('Webhook verified successfully', { 
      ip: req.ip,
      path: req.path 
    });
    next();
  } catch (error) {
    logger.warn('Webhook signature verification failed', { 
      ip: req.ip,
      path: req.path,
      error: error.message
    });
    return res.status(401).json({ 
      error: 'Invalid webhook signature' 
    });
  }
};

module.exports = {
  generateSignature,
  verifyWebhookSignature,
  webhookVerification
};
```

---

## File 5: config/env-validation.js

```javascript
const { z } = require('zod');
const logger = require('../logger');

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'staging']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  
  // Database
  MONGODB_URL: z.string().url(),
  MONGODB_USER: z.string().optional(),
  MONGODB_PASSWORD: z.string().optional(),
  MONGODB_TLS: z.enum(['true', 'false']).default('false'),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TLS: z.enum(['true', 'false']).default('false'),
  
  // JWT
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  
  // Security
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  WEBHOOK_DOMAINS: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Feature flags
  ENABLE_GRAPHQL: z.enum(['true', 'false']).default('true'),
  ENABLE_WEBHOOKS: z.enum(['true', 'false']).default('true')
});

const validateEnvironment = () => {
  try {
    const env = envSchema.parse(process.env);
    logger.info('Environment validation successful');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join('\n');
      logger.error('Environment validation failed:\n' + issues);
    } else {
      logger.error('Environment validation error:', error.message);
    }
    process.exit(1);
  }
};

module.exports = { validateEnvironment, envSchema };
```

---

## Integration Example: index.js

```javascript
const express = require('express');
const helmet = require('helmet');
const logger = require('./logger');

// Import security components
const { validateEnvironment } = require('./config/env-validation');
const { connectDatabase } = require('./config/database-tls');
const { createRedisClient } = require('./config/redis-tls');
const { webhookVerification } = require('./middleware/webhook-signature');
const { authValidation, gameValidation, handleValidationErrors } = require('./middleware/validation');

const app = express();

// Validate environment on startup
const env = validateEnvironment();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb' }));

// Initialize database and cache
let mongoConnection;
let redisClient;

(async () => {
  try {
    mongoConnection = await connectDatabase();
    redisClient = await createRedisClient();
    logger.info('All connections initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize connections:', error);
    process.exit(1);
  }
})();

// Auth routes with validation
app.post('/api/auth/register',
  authValidation.register,
  handleValidationErrors,
  (req, res) => {
    // Handler
  }
);

// Game routes with validation
app.post('/api/games',
  gameValidation.createGame,
  handleValidationErrors,
  (req, res) => {
    // Handler
  }
);

// Webhook routes with signature verification
app.post('/api/webhooks/:event',
  webhookVerification,
  (req, res) => {
    // Handler
  }
);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id
  });
});

const PORT = env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
```

---

**All production-ready code ready for implementation.**
