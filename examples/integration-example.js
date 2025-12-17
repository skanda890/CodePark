/**
 * CodePark Security Implementation Example
 * 
 * This file demonstrates how to integrate all security components:
 * - Environment validation
 * - Database TLS encryption
 * - Redis TLS encryption
 * - Input validation
 * - Webhook signature verification
 */

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import security components
const { validateEnvironment, getTLSConfig } = require('../config/env-validation');
const { connectDatabase, disconnectDatabase } = require('../config/database-tls');
const { createRedisClient } = require('../config/redis-tls');
const {
  authValidation,
  gameValidation,
  handleValidationErrors
} = require('../middleware/validation-middleware');
const {
  webhookVerification,
  captureRawBody,
  generateSignature
} = require('../middleware/webhook-signature');

// Initialize Express app
const app = express();

// ============================================================
// STEP 1: ENVIRONMENT VALIDATION (Do this first!)
// ============================================================
let config;
try {
  config = validateEnvironment();
  console.log('\u2705 Environment validation passed');
} catch (error) {
  console.error('\u274c Environment validation failed:', error.message);
  process.exit(1);
}

// ============================================================
// STEP 2: SECURITY MIDDLEWARE
// ============================================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
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
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter limit for auth endpoints
  skipSuccessfulRequests: true
});

app.use(limiter);

// Webhook signature verification setup
app.use('/api/webhooks', express.json({ verify: captureRawBody }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb' }));

// ============================================================
// STEP 3: DATABASE & CACHE INITIALIZATION
// ============================================================

let mongoConnection;
let redisClient;

const initializeConnections = async () => {
  try {
    console.log('\nInitializing connections...');
    
    // Connect to MongoDB
    mongoConnection = await connectDatabase();
    
    // Connect to Redis
    redisClient = await createRedisClient();
    
    console.log('\u2705 All connections initialized successfully\n');
    return { mongoConnection, redisClient };
  } catch (error) {
    console.error('\u274c Failed to initialize connections:', error);
    process.exit(1);
  }
};

// ============================================================
// STEP 4: API ROUTES WITH SECURITY
// ============================================================

// Auth Routes
app.post('/api/auth/register',
  authLimiter,
  authValidation.register,
  handleValidationErrors,
  (req, res) => {
    // Implementation: Check if user exists, hash password, save to DB
    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        email: req.body.email,
        username: req.body.username
      }
    });
  }
);

app.post('/api/auth/login',
  authLimiter,
  authValidation.login,
  handleValidationErrors,
  (req, res) => {
    // Implementation: Verify email/password, generate JWT token
    res.json({
      success: true,
      message: 'Logged in successfully',
      token: 'jwt_token_here'
    });
  }
);

// Game Routes
app.post('/api/games',
  gameValidation.createGame,
  handleValidationErrors,
  (req, res) => {
    // Implementation: Validate, sanitize, save to MongoDB
    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      game: {
        id: 'game_id_here',
        title: req.body.title,
        genre: req.body.genre
      }
    });
  }
);

app.get('/api/games/:gameId',
  gameValidation.getGame,
  handleValidationErrors,
  (req, res) => {
    // Implementation: Fetch from MongoDB using MongoID
    res.json({
      success: true,
      game: {
        id: req.params.gameId,
        title: 'Game Title',
        genre: 'action'
      }
    });
  }
);

app.put('/api/games/:gameId/score',
  gameValidation.updateScore,
  handleValidationErrors,
  (req, res) => {
    // Implementation: Update score in MongoDB
    res.json({
      success: true,
      message: 'Score updated successfully',
      score: req.body.score
    });
  }
);

// Webhook Routes (with signature verification)
app.post('/api/webhooks/game-events',
  webhookVerification({ secret: config.WEBHOOK_SECRET }),
  (req, res) => {
    // Implementation: Process webhook event
    console.log('Webhook received and verified:', req.body);
    res.json({
      success: true,
      message: 'Webhook processed'
    });
  }
);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Metrics (for monitoring)
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoConnection?.readyState,
    redis: redisClient?.connected
  });
});

// ============================================================
// STEP 5: ERROR HANDLING
// ============================================================

// Validation error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDev = config.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// ============================================================
// STEP 6: SERVER STARTUP
// ============================================================

const PORT = config.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize database and cache connections
    await initializeConnections();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`\u2705 Environment: ${config.NODE_ENV}`);
      console.log(`\u2705 Security: TLS Redis ${config.REDIS_TLS === 'true' ? 'enabled' : 'disabled'}`);
      console.log(`\u2705 Security: TLS MongoDB ${config.MONGODB_TLS === 'true' ? 'enabled' : 'disabled'}`);
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\nSIGTERM received, shutting down gracefully...');
      server.close(async () => {
        try {
          if (mongoConnection) await disconnectDatabase();
          if (redisClient) redisClient.quit();
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
