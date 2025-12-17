const crypto = require('crypto');

const SIGNATURE_ALGORITHM = 'sha256';
const SIGNATURE_HEADER = 'x-webhook-signature';
const TIMESTAMP_HEADER = 'x-webhook-timestamp';
const MAX_TIMESTAMP_DIFF = 5 * 60 * 1000; // 5 minutes

// Logger stub - replace with your logger
const logger = {
  info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
  warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || '')
};

/**
 * Generate webhook signature
 * @param {string|object} payload - Request payload
 * @param {string} secret - Webhook secret
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Signature hex string
 */
const generateSignature = (payload, secret, timestamp) => {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const message = `${timestamp}.${payloadString}`;
  
  return crypto
    .createHmac(SIGNATURE_ALGORITHM, secret)
    .update(message)
    .digest('hex');
};

/**
 * Verify webhook signature using constant-time comparison
 * @param {string} signature - Received signature
 * @param {string} expected - Expected signature
 * @returns {boolean} Whether signature is valid
 */
const verifySignature = (signature, expected) => {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch (error) {
    // timingSafeEqual throws if lengths don't match
    return false;
  }
};

/**
 * Middleware to verify webhook requests
 * @param {object} options - Configuration options
 * @param {string} options.secret - Webhook secret
 * @param {number} options.maxTimestampDiff - Max time diff in ms (default: 5 min)
 * @returns {function} Express middleware
 */
const webhookVerification = (options = {}) => {
  const secret = options.secret || process.env.WEBHOOK_SECRET;
  const maxDiff = options.maxTimestampDiff || MAX_TIMESTAMP_DIFF;

  if (!secret) {
    throw new Error('WEBHOOK_SECRET is required for webhook verification');
  }

  return (req, res, next) => {
    const signature = req.get(SIGNATURE_HEADER);
    const timestamp = req.get(TIMESTAMP_HEADER);

    // Log webhook attempt
    const requestInfo = {
      ip: req.ip,
      method: req.method,
      path: req.path,
      hasSignature: !!signature,
      hasTimestamp: !!timestamp
    };

    // Validate headers exist
    if (!signature || !timestamp) {
      logger.warn('Webhook missing signature or timestamp', requestInfo);
      return res.status(401).json({
        success: false,
        error: 'Missing webhook signature or timestamp'
      });
    }

    // Validate timestamp format
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) {
      logger.warn('Webhook invalid timestamp format', { ...requestInfo, timestamp });
      return res.status(401).json({
        success: false,
        error: 'Invalid timestamp format'
      });
    }

    // Validate timestamp is within acceptable range (prevent replay attacks)
    const requestTime = timestampNum * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeDiff = Math.abs(now - requestTime);

    if (timeDiff > maxDiff) {
      logger.warn('Webhook timestamp out of range', {
        ...requestInfo,
        timeDiff,
        maxDiff
      });
      return res.status(401).json({
        success: false,
        error: 'Webhook timestamp too old or in future'
      });
    }

    // Verify signature
    try {
      // Store raw body for signature verification
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const expectedSignature = generateSignature(rawBody, secret, timestamp);

      if (!verifySignature(signature, expectedSignature)) {
        logger.warn('Webhook signature verification failed', requestInfo);
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }

      logger.info('Webhook verified successfully', requestInfo);
      req.webhook = {
        verified: true,
        timestamp: timestampNum
      };
      next();
    } catch (error) {
      logger.error('Webhook verification error', {
        ...requestInfo,
        error: error.message
      });
      return res.status(500).json({
        success: false,
        error: 'Internal server error during webhook verification'
      });
    }
  };
};

/**
 * Middleware to capture raw body for webhook verification
 * Add this before express.json() if using webhooks
 */
const captureRawBody = (req, res, buffer, encoding) => {
  if (buffer && buffer.length) {
    req.rawBody = buffer.toString(encoding || 'utf8');
  }
};

module.exports = {
  generateSignature,
  verifySignature,
  webhookVerification,
  captureRawBody,
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER
};
