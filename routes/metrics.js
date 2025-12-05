/**
 * Metrics Route
 * Prometheus metrics endpoint
 */

const express = require('express')
const router = express.Router()

/**
 * GET /metrics
 * Expose Prometheus metrics
 * Note: Actual metrics are served by metricsService on separate port
 * This endpoint just provides info
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Metrics are exposed on the metrics server',
    endpoint: `http://localhost:${require('../config').metrics.port}/metrics`,
    format: 'Prometheus',
    documentation: 'https://prometheus.io/docs/instrumenting/exporters/'
  })
})

module.exports = router
