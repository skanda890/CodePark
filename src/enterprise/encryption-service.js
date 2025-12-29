/**
 * Data Encryption Service (Feature #44)
 * Encrypts and decrypts sensitive data
 */

const crypto = require('crypto')

class EncryptionService {
  constructor (options = {}) {
    this.algorithm = options.algorithm || 'aes-256-gcm'
    this.keyLength = options.keyLength || 32
    this.ivLength = options.ivLength || 16
    this.encryptionKey =
      options.encryptionKey || crypto.randomBytes(this.keyLength)
  }

  /**
   * Encrypt data
   */
  encrypt (data) {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv
    )

    let encrypted = cipher.update(JSON.stringify(data), 'utf-8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    }
  }

  /**
   * Decrypt data
   */
  decrypt (encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(encryptedData.iv, 'hex')
    )

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf-8')
    decrypted += decipher.final('utf-8')

    return JSON.parse(decrypted)
  }

  /**
   * Hash password with salt
   */
  hashPassword (password, salt = crypto.randomBytes(16)) {
    return {
      hash: crypto
        .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
        .toString('hex'),
      salt: salt.toString('hex')
    }
  }

  /**
   * Verify password
   */
  verifyPassword (password, storedHash, salt) {
    const hash = crypto
      .pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha512')
      .toString('hex')
    return hash === storedHash
  }
}

module.exports = EncryptionService
