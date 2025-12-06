/**
 * CORS Configuration Module
 * Controls cross-origin requests
 */

/**
 * CORS Options
 * Whitelist-based origin control
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Whitelist of allowed origins
    const whitelist = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];

    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 600, // 10 minutes
};

/**
 * Request Size Limits
 * Prevents payload-based attacks
 */
const requestSizeLimits = {
  json: { limit: '10mb' },
  urlencoded: { limit: '10mb', extended: true },
  raw: { limit: '10mb' },
};

module.exports = {
  corsOptions,
  requestSizeLimits,
};
