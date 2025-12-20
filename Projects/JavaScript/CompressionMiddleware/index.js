/**
 * Compression Middleware
 * Gzip and Brotli compression for response optimization
 * @version 1.0.0
 */

const zlib = require('zlib')

class CompressionMiddleware {
  constructor (options = {}) {
    this.enabled = options.enabled !== false
    this.level = options.level || 6
    this.minSize = options.minSize || 1024 // 1KB
    this.algorithms = options.algorithms || ['gzip', 'deflate']
    this.exclude = new Set(options.exclude || ['/health', '/status'])
    this.excludeTypes = new Set(
      options.excludeTypes || ['text/event-stream', 'application/octet-stream']
    )
    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0
    }
  }

  /**
   * Check if path should be excluded
   * @param {string} path - Request path
   * @returns {boolean}
   */
  shouldExclude (path) {
    for (const pattern of this.exclude) {
      if (
        pattern instanceof RegExp ? pattern.test(path) : path.includes(pattern)
      ) {
        return true
      }
    }
    return false
  }

  /**
   * Check if content type should be compressed
   * @param {string} type - Content type
   * @returns {boolean}
   */
  shouldCompress (type) {
    if (this.excludeTypes.has(type)) return false

    // Compress text and JSON
    return (
      type.includes('text') ||
      type.includes('json') ||
      type.includes('javascript') ||
      type.includes('xml')
    )
  }

  /**
   * Select best compression algorithm
   * @param {string} acceptEncoding - Accept-Encoding header
   * @returns {string} - Selected algorithm
   */
  selectAlgorithm (acceptEncoding) {
    if (!acceptEncoding) return null

    const encodings = acceptEncoding
      .split(',')
      .map((e) => e.trim().split(';')[0])

    // Prefer brotli if supported
    if (encodings.includes('br') && this.algorithms.includes('br')) return 'br'
    if (encodings.includes('gzip') && this.algorithms.includes('gzip')) {
      return 'gzip'
    }
    if (encodings.includes('deflate') && this.algorithms.includes('deflate')) {
      return 'deflate'
    }

    return null
  }

  /**
   * Compress data
   * @param {Buffer} data - Data to compress
   * @param {string} algorithm - Compression algorithm
   * @returns {Promise<Buffer>} - Compressed data
   */
  compress (data, algorithm) {
    return new Promise((resolve, reject) => {
      let compressor

      switch (algorithm) {
        case 'gzip':
          compressor = zlib.gzip
          break
        case 'deflate':
          compressor = zlib.deflate
          break
        case 'br':
          compressor = zlib.brotliCompress
          break
        default:
          return reject(new Error(`Unknown algorithm: ${algorithm}`))
      }

      compressor(data, { level: this.level }, (error, compressed) => {
        if (error) reject(error)
        else resolve(compressed)
      })
    })
  }

  /**
   * Express middleware
   */
  middleware () {
    return async (req, res, next) => {
      if (!this.enabled) return next()
      if (this.shouldExclude(req.path)) return next()

      this.stats.totalRequests += 1

      const algorithm = this.selectAlgorithm(req.headers['accept-encoding'])
      if (!algorithm) return next()

      const originalSend = res.send.bind(res)
      const originalJson = res.json.bind(res)

      const compress = async (data) => {
        const type = res.get('Content-Type') || ''

        // Skip if not compressible or too small
        if (!this.shouldCompress(type) || data.length < this.minSize) {
          return originalSend(data)
        }

        try {
          const buffer = Buffer.isBuffer(data)
            ? data
            : Buffer.from(data, 'utf-8')
          const compressed = await this.compress(buffer, algorithm)

          // Only use compression if it actually reduces size
          if (compressed.length < buffer.length) {
            this.stats.compressedRequests += 1
            this.stats.totalSizeBefore += buffer.length
            this.stats.totalSizeAfter += compressed.length

            res.set('Content-Encoding', algorithm)
            res.set('Content-Length', compressed.length)
            res.set(
              'X-Compression-Ratio',
              `${((1 - compressed.length / buffer.length) * 100).toFixed(2)}%`
            )
            return res.send(compressed)
          }
        } catch (error) {
          // Fall back to uncompressed
          console.error('Compression error:', error)
        }

        return originalSend(data)
      }

      res.send = (data) => compress(data)

      res.json = (data) => {
        const stringified = JSON.stringify(data)
        compress(stringified)
      }

      next()
    }
  }

  /**
   * Get compression statistics
   */
  getStats () {
    const ratio =
      this.stats.totalSizeBefore > 0
        ? (
            (1 - this.stats.totalSizeAfter / this.stats.totalSizeBefore) *
            100
          ).toFixed(2)
        : 0

    return {
      ...this.stats,
      compressionRate: `${this.stats.compressedRequests}/${this.stats.totalRequests}`,
      compressionRatio: `${ratio}%`,
      avgSavings:
        this.stats.compressedRequests > 0
          ? `${(this.stats.totalSizeBefore - this.stats.totalSizeAfter) / this.stats.compressedRequests} bytes`
          : '0 bytes'
    }
  }

  /**
   * Reset statistics
   */
  resetStats () {
    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      totalSizeBefore: 0,
      totalSizeAfter: 0
    }
  }
}

module.exports = CompressionMiddleware
