/**
 * Integration Tests for Webhook System
 */

const request = require('supertest')
const express = require('express')
const webhookRoutes = require('../../routes/webhooks')

describe('Webhook Integration Tests', () => {
  let app

  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use('/api/webhooks', webhookRoutes)
  })

  describe('POST /api/webhooks', () => {
    test('should create a new webhook', async () => {
      const webhookData = {
        url: 'https://example.com/webhook',
        events: ['user.created', 'user.updated'],
        active: true
      }

      const response = await request(app)
        .post('/api/webhooks')
        .send(webhookData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.url).toBe(webhookData.url)
      expect(response.body.data.events).toEqual(webhookData.events)
    })

    test('should reject invalid webhook URL', async () => {
      const webhookData = {
        url: 'invalid-url',
        events: ['user.created']
      }

      const response = await request(app)
        .post('/api/webhooks')
        .send(webhookData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/webhooks', () => {
    test('should list all webhooks', async () => {
      const response = await request(app).get('/api/webhooks').expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body).toHaveProperty('count')
    })

    test('should filter webhooks by active status', async () => {
      const response = await request(app)
        .get('/api/webhooks?active=true')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.every((w) => w.active === true)).toBe(true)
    })
  })

  describe('GET /api/webhooks/:id', () => {
    let webhookId

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .send({
          url: 'https://example.com/test',
          events: ['test.event']
        })
      webhookId = response.body.data.id
    })

    test('should get webhook details', async () => {
      const response = await request(app)
        .get(`/api/webhooks/${webhookId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(webhookId)
    })

    test('should return 404 for non-existent webhook', async () => {
      const response = await request(app)
        .get('/api/webhooks/non-existent-id')
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/webhooks/:id', () => {
    let webhookId

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .send({
          url: 'https://example.com/test',
          events: ['test.event']
        })
      webhookId = response.body.data.id
    })

    test('should update webhook', async () => {
      const updates = {
        active: false,
        events: ['new.event']
      }

      const response = await request(app)
        .put(`/api/webhooks/${webhookId}`)
        .send(updates)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.active).toBe(false)
      expect(response.body.data.events).toContain('new.event')
    })
  })

  describe('DELETE /api/webhooks/:id', () => {
    let webhookId

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .send({
          url: 'https://example.com/test',
          events: ['test.event']
        })
      webhookId = response.body.data.id
    })

    test('should delete webhook', async () => {
      const response = await request(app)
        .delete(`/api/webhooks/${webhookId}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify deletion
      await request(app).get(`/api/webhooks/${webhookId}`).expect(404)
    })
  })

  describe('POST /api/webhooks/:id/test', () => {
    let webhookId

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/webhooks')
        .send({
          url: 'https://httpbin.org/post',
          events: ['test.event']
        })
      webhookId = response.body.data.id
    })

    test('should test webhook delivery', async () => {
      const response = await request(app)
        .post(`/api/webhooks/${webhookId}/test`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('webhookId', webhookId)
    }, 10000) // Increase timeout for HTTP request
  })
})
