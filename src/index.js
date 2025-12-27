/**
 * CodePark - Phase 1 Implementation Entry Point
 * Initializes all security and core features
 */

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// Import modules
const JWTSecurityManager = require('./security/jwt-security');
const PasswordHashManager = require('./security/password-hashing');
const InputValidator = require('./security/input-validation');
const RateLimiter = require('./security/rate-limiter');
const { ErrorHandler } = require('./core/error-handler');
const RequestLogger = require('./core/request-logger');
const HealthCheckAggregator = require('./core/health-check');
const RequestDeduplicator = require('./core/request-deduplication');
const GracefulShutdownManager = require('./core/graceful-shutdown');
const ConfigurationManager = require('./core/configuration-manager');

// Initialize app
const app = express();

// Configuration
const config = new ConfigurationManager();

// Security middleware
app.use(helmet()); // Set security headers
app.use(cors()); // Enable CORS

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize modules
const jwtManager = new JWTSecurityManager({
  secret: config.get('jwt.secret'),
});

const passwordManager = new PasswordHashManager();
const validator = new InputValidator();
const rateLimiter = new RateLimiter();
const errorHandler = new ErrorHandler();
const requestLogger = new RequestLogger();
const healthCheck = new HealthCheckAggregator();
const deduplicator = new RequestDeduplicator();

// Apply middleware
app.use(requestLogger.middleware());
app.use(rateLimiter.middleware());
app.use(deduplicator.middleware());
app.use(healthCheck.middleware('/health'));

// Register health checks
healthCheck.registerCheck('config-loaded', async () => ({
  status: 'ok',
  env: config.get('server.env'),
}));

// Routes

// Health check
app.get('/health', async (req, res) => {
  const health = await healthCheck.getHealthStatus();
  res.json(health);
});

// Auth routes
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // Validate input
    if (!validator.validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if (!validator.validateUsername(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Hash password
    const passwordHash = await passwordManager.hashPassword(password);

    // Generate tokens
    const accessToken = jwtManager.generateAccessToken(email);
    const refreshToken = jwtManager.generateRefreshToken(email);

    res.json({
      success: true,
      user: { email, username },
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!validator.validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // In real app, fetch user from database
    const accessToken = jwtManager.generateAccessToken(email);
    const refreshToken = jwtManager.generateRefreshToken(email);

    res.json({
      success: true,
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/refresh', async (req, res, next) => {
  try {
    const { refreshToken, userId } = req.body;

    const newTokens = await jwtManager.refreshAccessToken(
      refreshToken,
      userId
    );

    res.json({ success: true, tokens: newTokens });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const { token } = req.body;
    await jwtManager.revokeToken(token);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Config endpoint (safe version)
app.get('/api/config', (req, res) => {
  res.json({
    env: config.get('server.env'),
    version: '2.1.0-phase1',
    features: {
      jwtSecurity: true,
      passwordHashing: true,
      inputValidation: true,
      rateLimiting: true,
      errorHandling: true,
      requestLogging: true,
      healthChecks: true,
      deduplication: true,
      gracefulShutdown: true,
      configManagement: true,
    },
  });
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler.middleware());

// Start server
const server = app.listen(config.get('server.port'), () => {
  console.log(
    `\n🚀 CodePark Phase 1 running on port ${config.get('server.port')}`
  );
  console.log('📦 Modules loaded:');
  console.log('  ✅ JWT Security Manager');
  console.log('  ✅ Password Hash Manager');
  console.log('  ✅ Input Validator');
  console.log('  ✅ Rate Limiter');
  console.log('  ✅ Error Handler');
  console.log('  ✅ Request Logger');
  console.log('  ✅ Health Check Aggregator');
  console.log('  ✅ Request Deduplicator');
  console.log('  ✅ Graceful Shutdown Manager');
  console.log('  ✅ Configuration Manager');
  console.log('\n🔗 Health check: http://localhost:3000/health');
});

// Graceful shutdown
const shutdownManager = new GracefulShutdownManager({
  server,
  timeout: 30000,
});

shutdownManager.registerCleanupTask('close-server', async () => {
  console.log('Closing HTTP server...');
});

shutdownManager.setupSignalHandlers();

module.exports = app;
