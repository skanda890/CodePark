class DeadLetterQueue {
  constructor (options = {}) {
    this.queue = []
    this.maxRetries = options.maxRetries || 5
    this.retentionDays = options.retentionDays || 30
  }

  async add (task, error, metadata = {}) {
    const dlqItem = {
      id: Math.random().toString(36).substring(7),
      task,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      metadata,
      attempts: task.attempts || 0,
      maxRetries: this.maxRetries,
      addedAt: new Date(),
      expiresAt: new Date(
        Date.now() + this.retentionDays * 24 * 60 * 60 * 1000
      ),
      resolved: false
    }

    this.queue.push(dlqItem)
    console.log(`Task added to DLQ: ${dlqItem.id}`)
    return dlqItem
  }

  async replay (itemId) {
    const item = this.queue.find((i) => i.id === itemId)
    if (!item) return null

    if (item.attempts >= item.maxRetries) {
      throw new Error('Max retries exceeded')
    }

    item.attempts++
    console.log(`Replaying DLQ item: ${itemId} (attempt ${item.attempts})`)
    return item
  }

  async resolve (itemId) {
    const item = this.queue.find((i) => i.id === itemId)
    if (item) {
      item.resolved = true
      item.resolvedAt = new Date()
    }
    return item
  }

  async getUnresolved () {
    return this.queue.filter((i) => !i.resolved)
  }

  async cleanup () {
    const now = new Date()
    this.queue = this.queue.filter((item) => {
      return item.expiresAt > now && !item.resolved
    })
  }

  async analyze () {
    const stats = {
      total: this.queue.length,
      unresolved: this.queue.filter((i) => !i.resolved).length,
      byErrorType: {},
      oldestItem: this.queue[0]?.addedAt
    }

    for (const item of this.queue) {
      const errorType = item.error.code || 'UNKNOWN'
      stats.byErrorType[errorType] = (stats.byErrorType[errorType] || 0) + 1
    }

    return stats
  }
}

module.exports = DeadLetterQueue
