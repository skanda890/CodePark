/**
 * Webhook Routes
 * API endpoints for webhook management
 */

const express = require('express');
const router = express.Router();
const WebhookService = require('../services/WebhookService');

const webhookService = new WebhookService();

/**
 * Create a new webhook
 * POST /api/webhooks
 */
router.post('/', async (req, res) => {
  try {
    const webhook = webhookService.create(req.body);
    res.status(201).json({
      success: true,
      data: webhook
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List all webhooks
 * GET /api/webhooks
 */
router.get('/', (req, res) => {
  try {
    const filters = {
      active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
      event: req.query.event
    };

    const webhooks = webhookService.list(filters);
    res.json({
      success: true,
      data: webhooks,
      count: webhooks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get webhook details
 * GET /api/webhooks/:id
 */
router.get('/:id', (req, res) => {
  try {
    const webhook = webhookService.get(req.params.id);
    
    if (!webhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    res.json({
      success: true,
      data: webhook
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update webhook
 * PUT /api/webhooks/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const webhook = webhookService.update(req.params.id, req.body);
    res.json({
      success: true,
      data: webhook
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete webhook
 * DELETE /api/webhooks/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const deleted = webhookService.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test webhook
 * POST /api/webhooks/:id/test
 */
router.post('/:id/test', async (req, res) => {
  try {
    const result = await webhookService.test(req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
module.exports.webhookService = webhookService;
