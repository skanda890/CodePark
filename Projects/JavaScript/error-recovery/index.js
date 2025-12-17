class CircuitBreaker {
  constructor (options = {}) {
    this.timeout = options.timeout || 5000
    this.errorThreshold = options.errorThreshold || 5
    this.resetTimeout = options.resetTimeout || 60000
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0
    this.successCount = 0
  }

  async execute (fn) {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        )
      ])

      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  onSuccess () {
    this.failureCount = 0
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED'
      this.successCount = 0
    }
  }

  onFailure () {
    this.failureCount++
    if (this.failureCount >= this.errorThreshold) {
      this.state = 'OPEN'
      this.openedAt = Date.now()
    }
  }

  shouldAttemptReset () {
    return Date.now() - this.openedAt >= this.resetTimeout
  }
}

module.exports = CircuitBreaker
