/**
 * Request/Response Transformer Pipeline (Feature #13)
 * Transforms requests and responses through middleware pipeline
 */

class TransformerPipeline {
  constructor () {
    this.requestTransformers = []
    this.responseTransformers = []
  }

  /**
   * Register request transformer
   */
  addRequestTransformer (name, transformer) {
    if (typeof transformer !== 'function') {
      throw new Error('Transformer must be a function')
    }
    this.requestTransformers.push({ name, transformer })
  }

  /**
   * Register response transformer
   */
  addResponseTransformer (name, transformer) {
    if (typeof transformer !== 'function') {
      throw new Error('Transformer must be a function')
    }
    this.responseTransformers.push({ name, transformer })
  }

  /**
   * Execute request transformers
   */
  async transformRequest (req) {
    for (const { name, transformer } of this.requestTransformers) {
      try {
        await transformer(req)
      } catch (error) {
        console.error(`Request transformer '${name}' error:`, error)
        throw error
      }
    }
    return req
  }

  /**
   * Execute response transformers
   */
  async transformResponse (res, data) {
    let transformed = data
    for (const { name, transformer } of this.responseTransformers) {
      try {
        transformed = await transformer(transformed, res)
      } catch (error) {
        console.error(`Response transformer '${name}' error:`, error)
        throw error
      }
    }
    return transformed
  }

  /**
   * Express middleware
   */
  middleware () {
    return async (req, res, next) => {
      try {
        // Transform request
        await this.transformRequest(req)

        // Wrap response.json
        const originalJson = res.json.bind(res)
        res.json = async function (data) {
          const transformed = await this.transformResponse(res, data)
          return originalJson(transformed)
        }.bind(this)

        next()
      } catch (error) {
        next(error)
      }
    }
  }
}

module.exports = TransformerPipeline
