/**
 * Unit Tests for MetricsService
 */

const MetricsService = require('../../services/MetricsService')

describe('MetricsService', () => {
  let metricsService

  beforeEach(() => {
    metricsService = new MetricsService({
      retentionPeriod: 1000, // 1 second for testing
      flushInterval: 100
    })
  })

  afterEach(() => {
    if (metricsService) {
      metricsService.stopStreaming()
    }
  })

  describe('Collector Management', () => {
    test('should register a new collector', () => {
      const collector = metricsService.registerCollector('test-metric')

      expect(collector).toBeDefined()
      expect(collector.name).toBe('test-metric')
      expect(collector.enabled).toBe(true)
    })

    test('should throw error when registering duplicate collector', () => {
      metricsService.registerCollector('test-metric')

      expect(() => {
        metricsService.registerCollector('test-metric')
      }).toThrow("Collector 'test-metric' already registered")
    })

    test('should register collector with custom config', () => {
      const collector = metricsService.registerCollector('custom-metric', {
        aggregation: 'sum',
        tags: { environment: 'test' }
      })

      expect(collector.aggregation).toBe('sum')
      expect(collector.tags).toEqual({ environment: 'test' })
    })
  })

  describe('Metric Recording', () => {
    beforeEach(() => {
      metricsService.registerCollector('response-time')
    })

    test('should record metric value', () => {
      metricsService.record('response-time', 150)

      const snapshot = metricsService.getSnapshot()
      expect(snapshot['response-time'].count).toBe(1)
    })

    test('should record multiple metrics', () => {
      metricsService.record('response-time', 150)
      metricsService.record('response-time', 200)
      metricsService.record('response-time', 175)

      const snapshot = metricsService.getSnapshot()
      expect(snapshot['response-time'].count).toBe(3)
    })

    test('should include tags with metrics', () => {
      metricsService.record('response-time', 150, { endpoint: '/api/users' })

      const history = metricsService.getHistory('response-time')
      expect(history[0].tags).toHaveProperty('endpoint', '/api/users')
    })
  })

  describe('Aggregation', () => {
    test('should calculate average aggregation', () => {
      metricsService.registerCollector('avg-metric', { aggregation: 'avg' })
      metricsService.record('avg-metric', 100)
      metricsService.record('avg-metric', 200)
      metricsService.record('avg-metric', 300)

      const snapshot = metricsService.getSnapshot()
      expect(snapshot['avg-metric'].current).toBe(200)
    })

    test('should calculate sum aggregation', () => {
      metricsService.registerCollector('sum-metric', { aggregation: 'sum' })
      metricsService.record('sum-metric', 10)
      metricsService.record('sum-metric', 20)
      metricsService.record('sum-metric', 30)

      const snapshot = metricsService.getSnapshot()
      expect(snapshot['sum-metric'].current).toBe(60)
    })

    test('should calculate min aggregation', () => {
      metricsService.registerCollector('min-metric', { aggregation: 'min' })
      metricsService.record('min-metric', 100)
      metricsService.record('min-metric', 50)
      metricsService.record('min-metric', 200)

      const snapshot = metricsService.getSnapshot()
      expect(snapshot['min-metric'].current).toBe(50)
    })

    test('should calculate max aggregation', () => {
      metricsService.registerCollector('max-metric', { aggregation: 'max' })
      metricsService.record('max-metric', 100)
      metricsService.record('max-metric', 300)
      metricsService.record('max-metric', 200)

      const snapshot = metricsService.getSnapshot()
      expect(snapshot['max-metric'].current).toBe(300)
    })
  })

  describe('History and Export', () => {
    beforeEach(() => {
      metricsService.registerCollector('test-metric')
    })

    test('should retrieve history', () => {
      metricsService.record('test-metric', 100)
      metricsService.record('test-metric', 200)

      const history = metricsService.getHistory('test-metric')
      expect(history).toHaveLength(2)
    })

    test('should filter history by time range', () => {
      const now = Date.now()
      metricsService.record('test-metric', 100)

      const history = metricsService.getHistory('test-metric', {
        startTime: now - 1000
      })

      expect(history.length).toBeGreaterThan(0)
    })

    test('should export metrics as JSON', () => {
      metricsService.record('test-metric', 100)

      const exported = metricsService.export('json')
      const data = JSON.parse(exported)

      expect(data).toHaveProperty('test-metric')
      expect(data['test-metric']).toHaveLength(1)
    })
  })

  describe('Clear', () => {
    test('should clear all metrics', () => {
      metricsService.registerCollector('test-metric')
      metricsService.record('test-metric', 100)
      metricsService.record('test-metric', 200)

      metricsService.clear()

      const snapshot = metricsService.getSnapshot()
      expect(snapshot['test-metric'].count).toBe(0)
    })
  })
})
