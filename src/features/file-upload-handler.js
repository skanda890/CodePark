/**
 * File Upload Handler Pro (Feature #15)
 * Handles file uploads with validation, storage, and metadata
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createReadStream } = require('fs')

class FileUploadHandler {
  constructor (options = {}) {
    this.uploadDir = options.uploadDir || './uploads'
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024 // 10MB
    this.allowedMimeTypes = options.allowedMimeTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain'
    ]
    this.files = new Map()

    // Create upload directory if not exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  /**
   * Validate file
   */
  validateFile (file) {
    const errors = []

    if (!file) {
      errors.push('File is required')
    }

    if (file && !file.mimetype) {
      errors.push('File type is required')
    }

    if (file && !this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(
        `File type ${file.mimetype} not allowed. Allowed: ${this.allowedMimeTypes.join(', ')}`
      )
    }

    if (file && file.size > this.maxFileSize) {
      errors.push(
        `File size ${file.size} exceeds maximum ${this.maxFileSize} bytes`
      )
    }

    return errors
  }

  /**
   * Generate unique filename
   */
  generateFilename (originalName) {
    const ext = path.extname(originalName)
    const hash = crypto.randomBytes(8).toString('hex')
    const timestamp = Date.now()
    return `${timestamp}-${hash}${ext}`
  }

  /**
   * Calculate file hash
   */
  async calculateFileHash (filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = createReadStream(filePath)

      stream.on('data', (chunk) => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  /**
   * Upload file
   */
  async uploadFile (file, metadata = {}) {
    const errors = this.validateFile(file)
    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }

    const filename = this.generateFilename(file.originalname)
    const filepath = path.join(this.uploadDir, filename)

    // Save file
    await new Promise((resolve, reject) => {
      file.mv(filepath, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    // Calculate hash
    const fileHash = await this.calculateFileHash(filepath)

    // Store metadata
    const fileMetadata = {
      id: crypto.randomUUID(),
      originalName: file.originalname,
      filename,
      filepath,
      mimetype: file.mimetype,
      size: file.size,
      hash: fileHash,
      uploadedAt: new Date(),
      ...metadata
    }

    this.files.set(fileMetadata.id, fileMetadata)

    return fileMetadata
  }

  /**
   * Delete file
   */
  async deleteFile (fileId) {
    const metadata = this.files.get(fileId)
    if (!metadata) {
      throw new Error(`File ${fileId} not found`)
    }

    // Delete from filesystem
    if (fs.existsSync(metadata.filepath)) {
      fs.unlinkSync(metadata.filepath)
    }

    // Remove metadata
    this.files.delete(fileId)

    return true
  }

  /**
   * Get file metadata
   */
  getFileMetadata (fileId) {
    return this.files.get(fileId)
  }

  /**
   * List all files
   */
  listFiles () {
    return Array.from(this.files.values())
  }
}

module.exports = FileUploadHandler
