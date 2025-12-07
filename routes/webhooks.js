/**
 * Webhook Routes
 * API endpoints for webhook management
 * FIXED: Added authentication, input validation, and rate limiting
 */

const express = require('express')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const RateLimit = require('express-rate-limit')
const WebhookService = require('../services/WebhookService')
const authMiddleware = require('../middleware/auth')
const logger = require('../config/logger')

const webhookService = new WebhookService()

/**
 * SECURITY FIX: Add authentication middleware and rate limiting to all webhook endpoints
 */
router.use(authMiddleware)

// Rate limiter: max 100 requests per 15 minutes per IP for webhook routes
const limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
})
router.use(limiter)
/**
 * Input validation rules for webhooks
 */
const webhookValidationRules = () => [
  body('url')
    .isURL({ require_protocol: true })
    .withMessage('Invalid webhook URL format')
    .isLength({ max: 2048 })
    .withMessage('URL must be less than 2048 characters'),
  body('event')
    .isIn([
      'user.created',
      'user.updated',
      'game.started',
      'game.completed',
      'error.occurred'
    ])
    .withMessage('Invalid event type'),
  body('active').optional().isBoolean().withMessage('Active must be boolean'),
  body('retryCount')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Retry count must be between 0 and 10'),
  body('headers')
    .optional()
    .isObject()
    .withMessage('Headers must be an object')
]

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logger.warn(
      { errors: errors.array(), userId: req.user?.id },
      'Webhook validation failed'
    )
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}

/**
 * Create a new webhook
 * POST /api/webhooks
 * FIXED: Added authentication, validation, and authorization
 */
router.post('/', webhookValidationRules(), validate, async (req, res) => {
  try {
    // SECURITY FIX: Ensure webhook is created by the authenticated user
    const webhookData = {
      ...req.body,
      userId: req.user.id,
      createdBy: req.user.id,
      createdAt: new Date()
    }

    const webhook = await webhookService.create(webhookData)

    logger.info(
      { webhookId: webhook.id, userId: req.user.id },
      'Webhook created'
    )

    res.status(201).json({
      success: true,
      data: webhook
    })
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id },
      'Failed to create webhook'
    )
    res.status(400).json({
      success: false,
      error: 'Failed to create webhook',
      message: process.env.NODE_ENV === 'development' ? error.message : ''
    })
  }
})

/**
 * List all webhooks for the authenticated user
 * GET /api/webhooks
 * FIXED: Added user-specific filtering and authentication
 */
router.get('/', (req, res) => {
  try {
    // SECURITY FIX: Only return webhooks for the authenticated user
    const filters = {
      userId: req.user.id,
      active:
        req.query.active === 'true'
          ? true
          : req.query.active === 'false'
            ? false
            : undefined,
      event: req.query.event
    }

    const webhooks = webhookService.list(filters)
    logger.info(
      { userId: req.user.id, count: webhooks.length },
      'Webhooks listed'
    )

    res.json({
      success: true,
      data: webhooks,
      count: webhooks.length
    })
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id },
      'Failed to list webhooks'
    )
    res.status(500).json({
      success: false,
      error: 'Failed to list webhooks',
      message: process.env.NODE_ENV === 'development' ? error.message : ''
    })
  }
})

/**
 * Get webhook details
 * GET /api/webhooks/:id
 * FIXED: Added authorization check
 */
router.get('/:id', (req, res) => {
  try {
    const webhook = webhookService.get(req.params.id)

    if (!webhook) {
      logger.warn(
        { webhookId: req.params.id, userId: req.user.id },
        'Webhook not found'
      )
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      })
    }

    // SECURITY FIX: Verify ownership before returning webhook details
    if (webhook.userId !== req.user.id) {
      logger.warn(
        { webhookId: req.params.id, userId: req.user.id },
        'Unauthorized access attempt to webhook'
      )
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have access to this webhook'
      })
    }

    res.json({
      success: true,
      data: webhook
    })
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id, webhookId: req.params.id },
      'Failed to get webhook'
    )
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook',
      message: process.env.NODE_ENV === 'development' ? error.message : ''
    })
  }
})

/**
 * Update webhook
 * PUT /api/webhooks/:id
 * FIXED: Added authentication, validation, and authorization
 */
router.put('/:id', webhookValidationRules(), validate, async (req, res) => {
  try {
    const webhook = webhookService.get(req.params.id)

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      })
    }

    // SECURITY FIX: Verify ownership before updating
    if (webhook.userId !== req.user.id) {
      logger.warn(
        { webhookId: req.params.id, userId: req.user.id },
        'Unauthorized update attempt on webhook'
      )
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have access to this webhook'
      })
    }

    const updatedWebhook = await webhookService.update(req.params.id, req.body)

    logger.info(
      { webhookId: req.params.id, userId: req.user.id },
      'Webhook updated'
    )

    res.json({
      success: true,
      data: updatedWebhook
    })
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id, webhookId: req.params.id },
      'Failed to update webhook'
    )
    res
      .status(error.message && error.message.includes('not found') ? 404 : 400)
      .json({
        success: false,
        error: 'Failed to update webhook',
        message: process.env.NODE_ENV === 'development' ? error.message : ''
      })
  }
})

/**
 * Delete webhook
 * DELETE /api/webhooks/:id
 * FIXED: Added authentication and authorization
 */
router.delete('/:id', (req, res) => {
  try {
    const webhook = webhookService.get(req.params.id)

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      })
    }

    // SECURITY FIX: Verify ownership before deleting
    if (webhook.userId !== req.user.id) {
      logger.warn(
        { webhookId: req.params.id, userId: req.user.id },
        'Unauthorized deletion attempt on webhook'
      )
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have access to this webhook'
      })
    }

    const deleted = webhookService.delete(req.params.id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      })
    }

    logger.info(
      { webhookId: req.params.id, userId: req.user.id },
      'Webhook deleted'
    )

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    })
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id, webhookId: req.params.id },
      'Failed to delete webhook'
    )
    res.status(500).json({
      success: false,
      error: 'Failed to delete webhook',
      message: process.env.NODE_ENV === 'development' ? error.message : ''
    })
  }
})

/**
 * Test webhook
 * POST /api/webhooks/:id/test
 * FIXED: Added authentication and authorization
 */
router.post('/:id/test', async (req, res) => {
  try {
    const webhook = webhookService.get(req.params.id)

    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      })
    }

    // SECURITY FIX: Verify ownership before testing
    if (webhook.userId !== req.user.id) {
      logger.warn(
        { webhookId: req.params.id, userId: req.user.id },
        'Unauthorized test attempt on webhook'
      )
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have access to this webhook'
      })
    }

    const result = await webhookService.test(req.params.id)

    logger.info(
      { webhookId: req.params.id, userId: req.user.id },
      'Webhook test executed'
    )

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error(
      { err: error, userId: req.user.id, webhookId: req.params.id },
      'Failed to test webhook'
    )
    res
      .status(error.message && error.message.includes('not found') ? 404 : 500)
      .json({
        success: false,
        error: 'Failed to test webhook',
        message: process.env.NODE_ENV === 'development' ? error.message : ''
      })
  }
})

module.exports = router
module.exports.webhookService = webhookService
