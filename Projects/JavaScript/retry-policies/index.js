class RetryPolicy {
  constructor (options = {}) {
    this.maxAttempts = options.maxAttempts || 3
    this.strategy = options.strategy || 'exponential'
    this.initialDelay = options.initialDelay || 1000
    this.maxDelay = options.maxDelay || 60000
    this.jitter = options.jitter || true
  }

  getDelay (attempt) {
    let delay

    switch (this.strategy) {
      case 'linear':
        delay = this.initialDelay * attempt
        break
      case 'exponential':
        delay = this.initialDelay * Math.pow(2, attempt)
        break
      case 'fibonacci':
        delay = this.initialDelay * this.fibonacci(attempt)
        break
      default:
        delay = this.initialDelay
    }

    // Cap the delay
    delay = Math.min(delay, this.maxDelay)

    // Add jitter
    if (this.jitter) {
      delay += Math.random() * (delay * 0.1)
    }

    return delay
  }

  fibonacci (n) {
    if (n <= 1) return n
    let a = 0
    let b = 1
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b]
    }
    return b
  }

  async execute (fn, context = null) {
    let lastError

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        return await fn.call(context)
      } catch (error) {
        lastError = error
        if (attempt < this.maxAttempts - 1) {
          const delay = this.getDelay(attempt)
          console.log(`Retry attempt ${attempt + 1} after ${delay}ms`)
          await this.delay(delay)
        }
      }
    }

    throw lastError
  }

  delay (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

module.exports = RetryPolicy
