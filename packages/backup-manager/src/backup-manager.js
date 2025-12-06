// backup-manager.js - Multi-cloud storage abstraction
const AWS = require('aws-sdk')
const fs = require('fs')
const crypto = require('crypto')
const zlib = require('zlib')
const path = require('path')

class CloudStorageManager {
  constructor (provider, credentials) {
    this.provider = provider
    this.credentials = credentials
    this.uploads = new Map()
    this.initializeProvider()
  }

  initializeProvider () {
    switch (this.provider) {
      case 'aws':
        this.s3 = new AWS.S3({
          accessKeyId: this.credentials.accessKeyId,
          secretAccessKey: this.credentials.secretAccessKey,
          region: this.credentials.region || 'us-east-1'
        })
        break
      case 'local':
        // Local storage
        break
      default:
        throw new Error(`Unsupported provider: ${this.provider}`)
    }
  }

  /**
   * Encrypt file before upload
   */
  encryptFile (filePath, password) {
    return new Promise((resolve, reject) => {
      const algorithm = 'aes-256-cbc'
      const key = crypto.scryptSync(password, 'salt', 32)
      const iv = crypto.randomBytes(16)

      const cipher = crypto.createCipheriv(algorithm, key, iv)
      const input = fs.createReadStream(filePath)
      const encryptedPath = filePath + '.encrypted'
      const encrypted = fs.createWriteStream(encryptedPath)

      encrypted.write(iv)
      input
        .pipe(cipher)
        .pipe(encrypted)
        .on('finish', () => resolve(encryptedPath))
        .on('error', reject)
    })
  }

  /**
   * Compress file
   */
  async compressFile (filePath) {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip()
      const source = fs.createReadStream(filePath)
      const compressedPath = filePath + '.gz'
      const destination = fs.createWriteStream(compressedPath)

      source
        .pipe(gzip)
        .pipe(destination)
        .on('finish', () => resolve(compressedPath))
        .on('error', reject)
    })
  }

  /**
   * Upload to AWS S3
   */
  async uploadToAWS (filePath, key) {
    return new Promise((resolve, reject) => {
      const fileContent = fs.readFileSync(filePath)
      const fileSize = fileContent.length

      const params = {
        Bucket: this.credentials.bucket,
        Key: key,
        Body: fileContent,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'upload-time': new Date().toISOString(),
          'original-size': fileSize.toString()
        }
      }

      this.s3.upload(params, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }

  /**
   * Upload to local storage
   */
  async uploadToLocal (filePath, remotePath) {
    return new Promise((resolve, reject) => {
      const storagePath = path.join(this.credentials.storagePath, remotePath)
      const dir = path.dirname(storagePath)

      fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) return reject(err)

        fs.copyFile(filePath, storagePath, (err) => {
          if (err) return reject(err)
          resolve({ path: storagePath, size: fs.statSync(storagePath).size })
        })
      })
    })
  }

  /**
   * Universal upload method
   */
  async upload (filePath, remotePath, options = {}) {
    try {
      let uploadPath = filePath
      const originalSize = fs.statSync(filePath).size

      // Compression
      if (options.compress) {
        console.log('Compressing file...')
        uploadPath = await this.compressFile(uploadPath)
      }

      // Encryption
      if (options.password) {
        console.log('Encrypting file...')
        uploadPath = await this.encryptFile(uploadPath, options.password)
      }

      const fileSize = fs.statSync(uploadPath).size
      console.log(
        `Uploading ${path.basename(uploadPath)} (${(fileSize / 1024 / 1024).toFixed(2)}MB)...`
      )

      let result
      switch (this.provider) {
        case 'aws':
          result = await this.uploadToAWS(uploadPath, remotePath)
          break
        case 'local':
          result = await this.uploadToLocal(uploadPath, remotePath)
          break
        default:
          throw new Error(`Unknown provider: ${this.provider}`)
      }

      // Cleanup temporary files
      if (options.compress || options.password) {
        fs.unlinkSync(uploadPath)
      }

      console.log('✓ Upload completed successfully')
      return {
        ...result,
        originalSize,
        compressedSize: fileSize,
        compressionRatio:
          ((1 - fileSize / originalSize) * 100).toFixed(2) + '%',
        timestamp: new Date().toISOString()
      }
    } catch (err) {
      console.error('✗ Upload failed:', err.message)
      throw err
    }
  }

  /**
   * Download file
   */
  async download (remotePath, localPath, password = null) {
    try {
      console.log(`Downloading ${remotePath}...`)

      let data
      switch (this.provider) {
        case 'aws':
          data = await this.downloadFromAWS(remotePath)
          break
        case 'local':
          data = await this.downloadFromLocal(remotePath)
          break
        default:
          throw new Error(`Unknown provider: ${this.provider}`)
      }

      let outputPath = localPath

      // Decrypt if password provided
      if (password) {
        console.log('Decrypting file...')
        outputPath = await this.decryptFile(data, password, localPath)
      } else {
        fs.writeFileSync(localPath, data)
      }

      console.log('✓ Download completed')
      return outputPath
    } catch (err) {
      console.error('✗ Download failed:', err.message)
      throw err
    }
  }

  /**
   * Download from AWS S3
   */
  async downloadFromAWS (key) {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.credentials.bucket,
        Key: key
      }

      this.s3.getObject(params, (err, data) => {
        if (err) reject(err)
        else resolve(data.Body)
      })
    })
  }

  /**
   * Download from local storage
   */
  async downloadFromLocal (remotePath) {
    const localPath = path.join(this.credentials.storagePath, remotePath)
    return fs.readFileSync(localPath)
  }

  /**
   * Decrypt file
   */
  async decryptFile (encryptedData, password, outputPath) {
    return new Promise((resolve, reject) => {
      const algorithm = 'aes-256-cbc'
      const key = crypto.scryptSync(password, 'salt', 32)

      // Extract IV from file
      const iv = encryptedData.slice(0, 16)
      const encrypted = encryptedData.slice(16)

      const decipher = crypto.createDecipheriv(algorithm, key, iv)
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ])

      fs.writeFileSync(outputPath, decrypted)
      resolve(outputPath)
    })
  }

  /**
   * List backups
   */
  async listBackups (prefix = '') {
    switch (this.provider) {
      case 'aws':
        return this.listAWSBackups(prefix)
      case 'local':
        return this.listLocalBackups(prefix)
      default:
        throw new Error(`Unknown provider: ${this.provider}`)
    }
  }

  /**
   * List AWS S3 backups
   */
  async listAWSBackups (prefix = '') {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.credentials.bucket,
        Prefix: prefix
      }

      this.s3.listObjectsV2(params, (err, data) => {
        if (err) reject(err)
        else resolve(data.Contents || [])
      })
    })
  }

  /**
   * List local backups
   */
  async listLocalBackups (prefix = '') {
    const backupDir = path.join(this.credentials.storagePath, prefix)
    if (!fs.existsSync(backupDir)) return []

    return fs.readdirSync(backupDir).map((file) => ({
      Key: file,
      Size: fs.statSync(path.join(backupDir, file)).size,
      LastModified: fs.statSync(path.join(backupDir, file)).mtime
    }))
  }
}

module.exports = CloudStorageManager
