const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, details) => console.error(`[ERROR] ${msg}`, details || ''),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

/**
 * Validate required environment variables
 * @returns {object} Validated environment object
 * @throws {Error} If validation fails
 */
const validateEnvironment = () => {
  const errors = [];

  // Required string variables
  const requiredStrings = [
    { key: 'NODE_ENV', allowed: ['development', 'staging', 'production'] },
    { key: 'MONGODB_URL', pattern: /^mongodb/ },
    { key: 'JWT_SECRET', minLength: 32 },
    { key: 'JWT_REFRESH_SECRET', minLength: 32 }
  ];

  // Validate required strings
  requiredStrings.forEach(({ key, allowed, pattern, minLength }) => {
    const value = process.env[key];
    
    if (!value) {
      errors.push(`${key} is required`);
      return;
    }

    if (allowed && !allowed.includes(value)) {
      errors.push(`${key} must be one of: ${allowed.join(', ')}. Got: ${value}`);
    }

    if (pattern && !pattern.test(value)) {
      errors.push(`${key} does not match required format`);
    }

    if (minLength && value.length < minLength) {
      errors.push(`${key} must be at least ${minLength} characters. Current length: ${value.length}`);
    }
  });

  // Optional variables with defaults
  const optionalVars = {
    'PORT': { default: '3000', validator: (v) => !isNaN(parseInt(v)) },
    'LOG_LEVEL': { default: 'info', allowed: ['error', 'warn', 'info', 'debug'] },
    'REDIS_HOST': { default: 'localhost' },
    'REDIS_PORT': { default: '6379', validator: (v) => !isNaN(parseInt(v)) },
    'REDIS_TLS': { default: 'false', allowed: ['true', 'false'] },
    'MONGODB_TLS': { default: 'false', allowed: ['true', 'false'] },
    'CORS_ORIGINS': { default: 'http://localhost:3000' },
    'JWT_EXPIRY': { default: '7d' },
    'JWT_REFRESH_EXPIRY': { default: '30d' },
    'ENABLE_GRAPHQL': { default: 'true', allowed: ['true', 'false'] },
    'ENABLE_WEBHOOKS': { default: 'true', allowed: ['true', 'false'] }
  };

  const config = {};

  // Build configuration with optional variables
  Object.entries(optionalVars).forEach(([key, { default: defaultVal, allowed, validator }]) => {
    const value = process.env[key] || defaultVal;
    
    if (allowed && !allowed.includes(value)) {
      errors.push(`${key} must be one of: ${allowed.join(', ')}. Got: ${value}`);
    }

    if (validator && !validator(value)) {
      errors.push(`${key} has invalid format. Got: ${value}`);
    }

    config[key] = value;
  });

  // Copy all required variables to config
  requiredStrings.forEach(({ key }) => {
    if (process.env[key]) {
      config[key] = process.env[key];
    }
  });

  // Optional fields (no errors if missing)
  const optionalFields = [
    'MONGODB_USER',
    'MONGODB_PASSWORD',
    'REDIS_PASSWORD',
    'REDIS_CA_CERT',
    'REDIS_CLIENT_CERT',
    'REDIS_CLIENT_KEY',
    'MONGODB_CA_CERT',
    'MONGODB_CLIENT_CERT',
    'MONGODB_CLIENT_KEY',
    'WEBHOOK_SECRET',
    'WEBHOOK_DOMAINS',
    'SENTRY_DSN',
    'DATADOG_API_KEY'
  ];

  optionalFields.forEach(key => {
    if (process.env[key]) {
      config[key] = process.env[key];
    }
  });

  // Report validation results
  if (errors.length > 0) {
    logger.error('Environment validation failed with the following errors:', {
      errors,
      count: errors.length
    });
    console.error('\n❌ Environment Validation Errors:\n');
    errors.forEach((error, i) => {
      console.error(`  ${i + 1}. ${error}`);
    });
    console.error('\n✅ Required environment variables:\n');
    requiredStrings.forEach(({ key }) => {
      console.error(`  - ${key}`);
    });
    process.exit(1);
  }

  logger.info('Environment validation successful');
  logger.info(`Running in ${config.NODE_ENV} mode`);
  
  return config;
};

/**
 * Get a configuration value with type safety
 * @param {string} key - Configuration key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value
 */
const getConfig = (key, defaultValue = undefined) => {
  return process.env[key] || defaultValue;
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Feature name (e.g., 'GRAPHQL', 'WEBHOOKS')
 * @returns {boolean} Whether feature is enabled
 */
const isFeatureEnabled = (featureName) => {
  const envKey = `ENABLE_${featureName.toUpperCase()}`;
  return process.env[envKey] === 'true';
};

/**
 * Get TLS configuration
 * @returns {object} TLS configuration object
 */
const getTLSConfig = () => {
  return {
    redis: {
      enabled: process.env.REDIS_TLS === 'true',
      ca: process.env.REDIS_CA_CERT,
      cert: process.env.REDIS_CLIENT_CERT,
      key: process.env.REDIS_CLIENT_KEY
    },
    mongodb: {
      enabled: process.env.MONGODB_TLS === 'true',
      ca: process.env.MONGODB_CA_CERT,
      cert: process.env.MONGODB_CLIENT_CERT,
      key: process.env.MONGODB_CLIENT_KEY
    }
  };
};

module.exports = {
  validateEnvironment,
  getConfig,
  isFeatureEnabled,
  getTLSConfig
};
