/**
 * MFAService - Multi-Factor Authentication Service
 * Implements TOTP-based MFA for enhanced security
 */

const speakeasy = require('speakeasy')
const QRCode = require('qrcode')

class MFAService {
  constructor (options = {}) {
    this.options = {
      issuer: options.issuer || 'CodePark',
      window: options.window || 1, // Time window for token validation
      encoding: options.encoding || 'base32',
      algorithm: options.algorithm || 'sha1',
      ...options
    }
  }

  /**
   * Setup MFA for a user
   * @param {string} userId - User identifier
   * @param {Object} userInfo - Additional user information
   * @returns {Promise<Object>} MFA setup data including secret and QR code
   */
  async setupMFA (userId, userInfo = {}) {
    const secret = speakeasy.generateSecret({
      name: `${this.options.issuer} (${userInfo.email || userId})`,
      issuer: this.options.issuer,
      length: 32
    })

    // Generate QR code for easy setup
    const qrCodeUrl = await this._generateQRCode(secret.otpauth_url)

    return {
      userId,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauthUrl: secret.otpauth_url,
      backupCodes: this._generateBackupCodes()
    }
  }

  /**
   * Verify MFA token
   * @param {string} secret - User's MFA secret
   * @param {string} token - Token to verify
   * @returns {boolean} Whether token is valid
   */
  verify (secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: this.options.encoding,
      token,
      window: this.options.window,
      algorithm: this.options.algorithm
    })
  }

  /**
   * Verify backup code
   * @param {Array<string>} backupCodes - User's backup codes
   * @param {string} code - Code to verify
   * @returns {Object} Verification result with remaining codes
   */
  verifyBackupCode (backupCodes, code) {
    const index = backupCodes.indexOf(code)

    if (index === -1) {
      return {
        valid: false,
        remainingCodes: backupCodes
      }
    }

    // Remove used backup code
    const remainingCodes = backupCodes.filter((_, i) => i !== index)

    return {
      valid: true,
      remainingCodes
    }
  }

  /**
   * Generate new backup codes
   * @param {number} count - Number of codes to generate
   * @returns {Array<string>} Backup codes
   */
  generateNewBackupCodes (count = 10) {
    return this._generateBackupCodes(count)
  }

  /**
   * Validate MFA setup
   * @param {string} secret - MFA secret
   * @param {string} token - Verification token
   * @returns {boolean} Whether setup is valid
   */
  validateSetup (secret, token) {
    return this.verify(secret, token)
  }

  /**
   * Disable MFA for a user
   * @param {string} userId - User identifier
   * @param {string} token - Current valid token for verification
   * @param {string} secret - User's MFA secret
   * @returns {Object} Disable result
   */
  disableMFA (userId, token, secret) {
    const isValid = this.verify(secret, token)

    if (!isValid) {
      return {
        success: false,
        error: 'Invalid verification token'
      }
    }

    return {
      success: true,
      userId,
      message: 'MFA disabled successfully'
    }
  }

  /**
   * Private: Generate QR code from otpauth URL
   */
  async _generateQRCode (otpauthUrl) {
    try {
      return await QRCode.toDataURL(otpauthUrl)
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`)
    }
  }

  /**
   * Private: Generate backup codes
   */
  _generateBackupCodes (count = 10) {
    const codes = []

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      codes.push(code)
    }

    return codes
  }

  /**
   * Get current time-based token (for testing)
   * @param {string} secret - MFA secret
   * @returns {string} Current token
   */
  getCurrentToken (secret) {
    return speakeasy.totp({
      secret,
      encoding: this.options.encoding,
      algorithm: this.options.algorithm
    })
  }
}

module.exports = MFAService
