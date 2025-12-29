/**
 * Advanced Multipart Parser (Feature #33)
 * Handles multipart form data and file uploads
 */

const crypto = require('crypto')

class MultipartParser {
  constructor () {
    this.parsers = new Map()
  }

  /**
   * Parse multipart request
   */
  async parse (req) {
    const contentType = req.get('content-type')

    if (!contentType || !contentType.includes('multipart/form-data')) {
      throw new Error('Invalid content type')
    }

    const boundary = contentType.split('boundary=')[1]
    const parts = req.body.split(`--${boundary}`)

    const result = {
      fields: {},
      files: []
    }

    for (let i = 1; i < parts.length - 1; i++) {
      const part = parts[i]
      const headers = this.extractHeaders(part)

      if (headers['content-disposition']) {
        const disposition = headers['content-disposition']

        if (disposition.includes('filename=')) {
          const filename = disposition.match(/filename="([^"]+)"/)[1]
          const content = this.extractContent(part)

          result.files.push({
            filename,
            mimetype: headers['content-type'] || 'application/octet-stream',
            content
          })
        } else {
          const name = disposition.match(/name="([^"]+)"/)[1]
          const content = this.extractContent(part)
          result.fields[name] = content
        }
      }
    }

    return result
  }

  /**
   * Extract headers from part
   */
  extractHeaders (part) {
    const headerEnd = part.indexOf('\r\n\r\n')
    const headerStr = part.substring(0, headerEnd)
    const headers = {}

    headerStr.split('\r\n').forEach((line) => {
      const [key, value] = line.split(': ')
      if (key) {
        headers[key.toLowerCase()] = value
      }
    })

    return headers
  }

  /**
   * Extract content from part
   */
  extractContent (part) {
    const contentStart = part.indexOf('\r\n\r\n') + 4
    const contentEnd = part.lastIndexOf('\r\n')
    return part.substring(contentStart, contentEnd)
  }
}

module.exports = MultipartParser
