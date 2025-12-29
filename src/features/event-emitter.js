/**
 * Event Emitter System (Feature #31)
 * Implements pub/sub event system
 */

class EventEmitter {
  constructor () {
    this.listeners = new Map()
  }

  /**
   * Register event listener
   */
  on (event, handler, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    const listener = {
      handler,
      once: options.once || false,
      priority: options.priority || 0
    }

    this.listeners.get(event).push(listener)
    this.listeners.get(event).sort((a, b) => b.priority - a.priority)

    return () => this.off(event, handler)
  }

  /**
   * Register one-time listener
   */
  once (event, handler, options = {}) {
    return this.on(event, handler, { ...options, once: true })
  }

  /**
   * Remove listener
   */
  off (event, handler) {
    if (!this.listeners.has(event)) {
      return
    }

    this.listeners.set(
      event,
      this.listeners.get(event).filter((l) => l.handler !== handler)
    )
  }

  /**
   * Emit event
   */
  async emit (event, data) {
    if (!this.listeners.has(event)) {
      return []
    }

    const handlers = this.listeners.get(event)
    const results = []

    for (const listener of handlers) {
      try {
        const result = await listener.handler(data)
        results.push({ status: 'success', result })

        if (listener.once) {
          this.off(event, listener.handler)
        }
      } catch (error) {
        results.push({ status: 'error', error })
      }
    }

    return results
  }

  /**
   * Remove all listeners
   */
  removeAllListeners (event) {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

module.exports = EventEmitter
