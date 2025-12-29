/**
 * Middleware Chain Executor (Feature #36)
 * Chains multiple middlewares for request processing
 */

class MiddlewareChain {
  constructor () {
    this.middlewares = []
  }

  /**
   * Use middleware
   */
  use (middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function')
    }
    this.middlewares.push(middleware)
  }

  /**
   * Execute middleware chain
   */
  async execute (req, res) {
    let index = -1

    const next = async () => {
      index += 1

      if (index >= this.middlewares.length) {
        return
      }

      const middleware = this.middlewares[index]

      return new Promise((resolve) => {
        middleware(req, res, () => {
          next().then(resolve)
        })
      })
    }

    await next()
  }
}

module.exports = MiddlewareChain
