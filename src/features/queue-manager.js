/**
 * Message Queue Manager (Feature #30)
 * Manages asynchronous task queues
 */

const crypto = require('crypto')

class QueueManager {
  constructor (options = {}) {
    this.queues = new Map()
    this.workers = new Map()
    this.maxRetries = options.maxRetries || 3
  }

  /**
   * Create queue
   */
  createQueue (name) {
    const queue = {
      name,
      tasks: [],
      processing: false
    }
    this.queues.set(name, queue)
    return queue
  }

  /**
   * Register worker
   */
  registerWorker (queueName, workerFn) {
    this.workers.set(queueName, workerFn)
  }

  /**
   * Enqueue task
   */
  enqueue (queueName, task, options = {}) {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

    const queueTask = {
      id: crypto.randomUUID(),
      data: task,
      retries: 0,
      createdAt: new Date(),
      attempts: [],
      priority: options.priority || 0
    }

    queue.tasks.push(queueTask)
    this.processQueue(queueName)

    return queueTask
  }

  /**
   * Process queue
   */
  async processQueue (queueName) {
    const queue = this.queues.get(queueName)
    if (!queue || queue.processing) {
      return
    }

    queue.processing = true
    const worker = this.workers.get(queueName)

    while (queue.tasks.length > 0) {
      const task = queue.tasks.shift()

      try {
        if (worker) {
          await worker(task.data)
          task.attempts.push({
            status: 'success',
            timestamp: new Date()
          })
        }
      } catch (error) {
        task.retries += 1

        if (task.retries < this.maxRetries) {
          queue.tasks.push(task)
          task.attempts.push({
            status: 'failed',
            error: error.message,
            timestamp: new Date()
          })
        } else {
          task.attempts.push({
            status: 'abandoned',
            error: error.message,
            timestamp: new Date()
          })
        }
      }
    }

    queue.processing = false
  }
}

module.exports = QueueManager
