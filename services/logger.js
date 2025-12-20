/**
 * Logger Service - Fixed
 * Conditional pretty printing (development only)
 * Optimized for production performance
 */

const pino = require('pino');

const getLoggerConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

  const baseConfig = {
    level: logLevel
  };

  // Only use pretty printing in development
  if (isDevelopment) {
    return {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    };
  }

  // Production: raw JSON logs for performance and machine parsing
  return baseConfig;
};

const logger = pino(getLoggerConfig());

module.exports = logger;
