/**
 * Graceful Shutdown Manager
 * Handles application shutdown with proper cleanup
 * Features: Connection draining, cleanup tasks, signal handling
 */

class GracefulShutdownManager {
  constructor (options = {}) {
    this.server = options.server
    this.timeout = options.timeout || 30000 // 30 seconds
    this.cleanupTasks = []
    this.logger = options.logger || console
    this.isShuttingDown = false
  }

  /**
   * Register cleanup task
   */
  registerCleanupTask (name, task) {
    if (typeof task !== 'function') {
      throw new Error('Cleanup task must be a function')
    }
    this.cleanupTasks.push({ name, task })
  }

  /**
   * Execute all cleanup tasks
   */
  async cleanup () {
    this.logger.info('Starting graceful shutdown...')

    const results = await Promise.allSettled(
      this.cleanupTasks.map((item) => this.executeTask(item))
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      this.logger.error(`${failed.length} cleanup tasks failed`)
    }

    this.logger.info('Cleanup completed')
  }

  /**
   * Execute single cleanup task with timeout
   */
  async executeTask ({ name, task }) {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Cleanup task '${name}' timed out`))
      }, this.timeout)

      Promise.resolve(task())
        .then(() => {
          clearTimeout(timeoutHandle)
          this.logger.info(`Cleanup task '${name}' completed`)
          resolve()
        })
        .catch((error) => {
          clearTimeout(timeoutHandle)
          this.logger.error(`Cleanup task '${name}' failed:`, error)
          reject(error)
        })
    })
  }

  /**
   * Setup signal handlers
   */
  setupSignalHandlers () {
    const signals = ['SIGTERM', 'SIGINT']

    signals.forEach((signal) => {
      process.on(signal, async () => {
        if (this.isShuttingDown) {
          return
        }

        this.isShuttingDown = true
        this.logger.info(`Received ${signal} signal`)

        // Close server
        if (this.server) {
          this.server.close(() => {
            this.logger.info('HTTP server closed')
          })
        }

        // Execute cleanup
        await this.cleanup()

        // Exit process
        process.exit(0)
      })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error)
      process.exit(1)
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection at:', promise, 'reason:', reason)
      process.exit(1)
    })
  }
}

module.exports = GracefulShutdownManager
