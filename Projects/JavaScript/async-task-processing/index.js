const Queue = require('bull')

class TaskProcessor {
  constructor (options = {}) {
    this.queue = new Queue(
      'tasks',
      options.redisUrl || 'redis://localhost:6379'
    )
    this.workers = new Map()
    this.setupQueueHandlers()
  }

  setupQueueHandlers () {
    this.queue.on('completed', (job) => {
      console.log(`Task completed: ${job.id}`)
    })

    this.queue.on('failed', (job, err) => {
      console.error(`Task failed: ${job.id} - ${err.message}`)
    })
  }

  registerWorker (taskType, handler) {
    this.workers.set(taskType, handler)
  }

  async addTask (taskType, data, options = {}) {
    const job = await this.queue.add(
      { type: taskType, data },
      {
        priority: options.priority || 5,
        attempts: options.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true
      }
    )
    return job
  }

  async processQueue () {
    this.queue.process('*', async (job) => {
      const handler = this.workers.get(job.data.type)
      if (!handler) {
        throw new Error(`No handler for task type: ${job.data.type}`)
      }
      return await handler(job.data.data)
    })
  }

  async getTaskStatus (jobId) {
    const job = await this.queue.getJob(jobId)
    if (!job) return null

    return {
      id: job.id,
      state: await job.getState(),
      progress: job.progress(),
      attempts: job.attemptsMade,
      data: job.data
    }
  }
}

module.exports = TaskProcessor
