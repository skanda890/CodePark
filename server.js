/**
 * CodePark v2.0.0 - Production Server
 * Integrates all new features with proper error handling and monitoring
 */

require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const express = require('express');
const { getConfig } = require('./config/app-config');

// Feature modules
const RequestValidator = require('./Projects/JavaScript/RequestValidationFramework');
const CORSManager = require('./Projects/JavaScript/CORSManager');
const IPWhitelistService = require('./Projects/JavaScript/IPWhitelistingService');
const HealthCheckService = require('./Projects/JavaScript/HealthCheckService');
const LogAggregationService = require('./Projects/JavaScript/LogAggregationService');
const QueryCache = require('./Projects/JavaScript/QueryResultCaching');
const CompressionMiddleware = require('./Projects/JavaScript/CompressionMiddleware');
const GraphQLSubscriptions = require('./Projects/JavaScript/GraphQLSubscriptions');

class CodeParkServer {
  constructor() {
    this.config = getConfig();
    this.app = express();
    this.services = {};
    this.setupPhase = 'initialization';
  }

  /**
   * Initialize all services
   */
  async initialize() {
    try {
      console.log(`\n🚀 CodePark v2.0.0 Server Starting`);
      console.log(`Environment: ${this.config.app.environment}`);
      console.log(`Port: ${this.config.server.port}\n`);

      this.setupLogging();
      this.setupCompression();
      this.setupCORS();
      this.setupValidation();
      this.setupIPWhitelist();
      this.setupCaching();
      this.setupHealthChecks();
      this.setupRoutes();
      this.setupErrorHandling();

      console.log('✅ All services initialized successfully\n');
      return this;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    }
  }

  /**
   * Setup Logging Service
   */
  setupLogging() {
    console.log('[1/7] Setting up logging...');
    this.setupPhase = 'logging';

    const logger = new LogAggregationService({
      level: this.config.logging.level,
      maxBufferSize: this.config.logging.maxBufferSize,
    });

    // Console transport (dev/staging)
    if (['development', 'staging'].includes(this.config.app.environment)) {
      logger.addConsoleTransport({ colorize: true });
    }

    // File transport
    if (this.config.logging.file) {
      logger.addFileTransport(this.config.logging.file, { format: 'json' });
    }

    // HTTP transport (production)
    if (this.config.logging.http) {
      logger.addHttpTransport(this.config.logging.http);
    }

    this.app.use(logger.middleware());
    this.services.logger = logger;
    global.logger = logger;

    logger.info('Logging service initialized', {
      level: this.config.logging.level,
      transports: this.config.logging.transports,
    });
  }

  /**
   * Setup Compression Middleware
   */
  setupCompression() {
    console.log('[2/7] Setting up compression...');
    this.setupPhase = 'compression';

    const compression = new CompressionMiddleware({
      level: this.config.compression.level,
      minSize: this.config.compression.minSize,
    });

    this.app.use(compression.middleware());
    this.services.compression = compression;

    this.services.logger?.info('Compression middleware initialized', {
      level: this.config.compression.level,
      minSize: this.config.compression.minSize,
    });
  }

  /**
   * Setup CORS Manager
   */
  setupCORS() {
    console.log('[3/7] Setting up CORS...');
    this.setupPhase = 'cors';

    const corsManager = new CORSManager(this.config.cors);

    this.app.use(corsManager.middleware());
    this.services.cors = corsManager;

    this.services.logger?.info('CORS manager initialized', {
      origins: this.config.cors.origins.length,
      credentials: this.config.cors.credentials,
    });
  }

  /**
   * Setup Request Validation
   */
  setupValidation() {
    console.log('[4/7] Setting up request validation...');
    this.setupPhase = 'validation';

    const validator = new RequestValidator();

    // Register default schemas
    validator.registerSchema('user', {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0, maximum: 150 },
      },
      required: ['name', 'email'],
    });

    this.services.validator = validator;

    this.services.logger?.info('Request validator initialized');
  }

  /**
   * Setup IP Whitelisting
   */
  setupIPWhitelist() {
    console.log('[5/7] Setting up IP whitelisting...');
    this.setupPhase = 'ip-whitelist';

    const ipService = new IPWhitelistService(this.config.ipWhitelist);

    // Add IPs from config
    if (this.config.ipWhitelist.list && this.config.ipWhitelist.list.length > 0) {
      this.config.ipWhitelist.list.forEach((ip) => {
        ipService.addToWhitelist(ip.trim());
      });
    } else {
      // Default: allow localhost
      ipService.addToWhitelist('127.0.0.1');
      ipService.addToWhitelist('::1');
    }

    // Only enable middleware in production/staging
    if (this.config.ipWhitelist.enforceMode !== 'off') {
      this.app.use(ipService.middleware());
    }

    this.services.ipService = ipService;

    this.services.logger?.info('IP whitelist service initialized', {
      enforceMode: this.config.ipWhitelist.enforceMode,
      whitelistCount: this.config.ipWhitelist.list?.length || 0,
    });
  }

  /**
   * Setup Query Caching
   */
  setupCaching() {
    console.log('[6/7] Setting up query caching...');
    this.setupPhase = 'caching';

    const cache = new QueryCache({
      ttl: this.config.cache.ttl,
      maxSize: this.config.cache.maxSize,
    });

    this.services.cache = cache;

    this.services.logger?.info('Query cache initialized', {
      ttl: this.config.cache.ttl,
      maxSize: this.config.cache.maxSize,
    });
  }

  /**
   * Setup Health Checks
   */
  setupHealthChecks() {
    console.log('[7/7] Setting up health checks...');
    this.setupPhase = 'health-checks';

    const health = new HealthCheckService({
      failureThreshold: 3,
      checkTimeout: 5000,
    });

    // Liveness probe
    health.registerLivenessProbe(async () => {
      return Promise.resolve(true);
    });

    // Readiness probe
    health.registerReadinessProbe(async () => {
      // Check all critical services
      return true; // Simplified for this example
    });

    // Memory check
    health.registerCheck(
      'memory',
      async () => {
        const used = process.memoryUsage();
        const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;
        return heapUsedPercent < 90;
      },
      { critical: false }
    );

    // Setup endpoints
    this.app.get('/health', health.healthMiddleware());
    this.app.get('/health/live', health.livenessMiddleware());
    this.app.get('/health/ready', health.readinessMiddleware());

    this.services.health = health;

    this.services.logger?.info('Health check service initialized');
  }

  /**
   * Setup Routes
   */
  setupRoutes() {
    // Parse JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // API Routes
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'ok',
        version: this.config.app.version,
        environment: this.config.app.environment,
        uptime: process.uptime(),
      });
    });

    // Sample endpoint with validation
    this.app.post(
      '/api/users',
      this.services.validator.middleware('user', 'body'),
      (req, res) => {
        this.services.logger?.info('User created', {
          email: req.validatedData.email,
        });
        res.json({
          success: true,
          data: req.validatedData,
        });
      }
    );

    // Admin endpoints (dev/staging only)
    if (this.config.app.environment !== 'production') {
      this.app.get('/admin/config', (req, res) => {
        res.json({
          environment: this.config.app.environment,
          services: Object.keys(this.services),
          config: this.config,
        });
      });

      this.app.get('/admin/cache/stats', (req, res) => {
        res.json(this.services.cache.getStats());
      });

      this.app.get('/admin/compression/stats', (req, res) => {
        res.json(this.services.compression.getStats());
      });
    }

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.path,
      });
    });
  }

  /**
   * Setup Error Handling
   */
  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      const errorResponse = {
        error: err.message || 'Internal Server Error',
        status: statusCode,
      };

      if (this.config.app.environment !== 'production') {
        errorResponse.stack = err.stack;
      }

      this.services.logger?.error('Request error', {
        message: err.message,
        statusCode,
        path: req.path,
        method: req.method,
      });

      res.status(statusCode).json(errorResponse);
    });
  }

  /**
   * Start the server
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(
        this.config.server.port,
        this.config.server.host,
        () => {
          console.log(
            `✅ Server listening on http://${this.config.server.host}:${this.config.server.port}`
          );
          console.log(`📊 Health: http://${this.config.server.host}:${this.config.server.port}/health`);
          console.log(`🔍 Status: http://${this.config.server.host}:${this.config.server.port}/api/status\n`);

          resolve(this.server);
        }
      );

      this.server.on('error', reject);
    });
  }

  /**
   * Stop the server gracefully
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.services.logger?.info('Shutting down server...');
        this.server.close(() => {
          console.log('✅ Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Handle graceful shutdown
if (require.main === module) {
  const server = new CodeParkServer();

  server
    .initialize()
    .then(() => server.start())
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down...');
    await server.stop();
    process.exit(0);
  });
}

module.exports = CodeParkServer;
