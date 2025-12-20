/**
 * Application Configuration
 * Environment-specific settings for development, staging, and production
 */

const path = require('path');

const baseConfig = {
  app: {
    name: 'CodePark',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxBufferSize: parseInt(process.env.LOG_BUFFER_SIZE || '1000', 10),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300000', 10),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
    backend: process.env.CACHE_BACKEND || 'memory',
  },
  compression: {
    level: parseInt(process.env.COMPRESSION_LEVEL || '6', 10),
    minSize: parseInt(process.env.COMPRESSION_MIN_SIZE || '1024', 10),
  },
};

const environmentConfigs = {
  development: {
    ...baseConfig,
    logging: {
      ...baseConfig.logging,
      level: 'debug',
      transports: ['console'],
    },
    cors: {
      origins: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
      ],
      credentials: true,
    },
    database: {
      uri: 'mongodb://localhost:27017/codepark-dev',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    redis: {
      host: 'localhost',
      port: 6379,
    },
    ipWhitelist: {
      enforceMode: 'off',
      maxRequestsPerIp: 10000,
    },
  },

  staging: {
    ...baseConfig,
    logging: {
      ...baseConfig.logging,
      level: process.env.LOG_LEVEL || 'info',
      transports: ['console', 'file'],
      file: process.env.LOG_FILE || '/var/log/codepark/app.log',
    },
    cors: {
      origins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : [
            'https://staging.example.com',
            'https://app-staging.example.com',
          ],
      credentials: true,
    },
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/codepark-staging',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
      },
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    },
    ipWhitelist: {
      enforceMode: process.env.IP_WHITELIST_MODE || 'whitelist',
      list: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
      maxRequestsPerIp: 5000,
    },
  },

  production: {
    ...baseConfig,
    logging: {
      ...baseConfig.logging,
      level: process.env.LOG_LEVEL || 'warn',
      transports: ['file', 'http'],
      file: process.env.LOG_FILE || '/var/log/codepark/app.log',
      http: process.env.LOG_HTTP_ENDPOINT,
    },
    cors: {
      origins: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['https://example.com', 'https://www.example.com'],
      credentials: true,
    },
    database: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 50,
        minPoolSize: 10,
      },
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true',
    },
    ipWhitelist: {
      enforceMode: 'whitelist',
      list: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',') : [],
      maxRequestsPerIp: 1000,
    },
  },
};

const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const config = environmentConfigs[env];

  if (!config) {
    throw new Error(
      `Invalid NODE_ENV: ${env}. Must be development, staging, or production`
    );
  }

  return config;
};

module.exports = {
  getConfig,
  environmentConfigs,
};
