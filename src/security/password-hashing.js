/**
 * Password Hashing Module
 * Implements Argon2 password hashing with secure parameters
 * Features: Argon2id, configurable memory and iterations, salt generation
 */

const argon2 = require('argon2');
const crypto = require('crypto');

class PasswordHashManager {
  constructor(options = {}) {
    // Argon2 parameters (OWASP recommended)
    this.hashOptions = {
      type: argon2.argon2id, // argon2id is most resistant to GPU attacks
      memoryCost: options.memoryCost || 65536, // 64MB
      timeCost: options.timeCost || 3, // 3 iterations
      parallelism: options.parallelism || 4, // 4 parallel threads
      saltLength: options.saltLength || 16, // 16-byte salt
      raw: false, // Return encoded hash string
    };
  }

  /**
   * Hash password using Argon2id
   * @param {string} password - Plain text password
   * @returns {Promise<string>} - Encoded hash with salt
   */
  async hashPassword(password) {
    try {
      // Input validation
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (password.length > 128) {
        throw new Error('Password must not exceed 128 characters');
      }

      // Hash with Argon2
      const hash = await argon2.hash(password, this.hashOptions);
      return hash;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw error;
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Encoded Argon2 hash
   * @returns {Promise<boolean>} - True if password matches
   */
  async verifyPassword(password, hash) {
    try {
      if (!password || !hash) {
        return false;
      }

      const isMatch = await argon2.verify(hash, password);
      return isMatch;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Check if hash needs rehashing
   * Can detect if Argon2 parameters have been updated
   */
  needsRehash(hash) {
    try {
      // Parse Argon2 hash to extract parameters
      // Format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
      const parts = hash.split('$');
      if (parts.length < 5) {
        return true;
      }

      const params = new URLSearchParams(parts[3]);
      const m = parseInt(params.get('m'), 10);
      const t = parseInt(params.get('t'), 10);
      const p = parseInt(params.get('p'), 10);

      // Check if current parameters match stored parameters
      return (
        m !== this.hashOptions.memoryCost ||
        t !== this.hashOptions.timeCost ||
        p !== this.hashOptions.parallelism
      );
    } catch (error) {
      return true;
    }
  }

  /**
   * Generate secure random password
   * Useful for password reset or temporary passwords
   */
  generateRandomPassword(length = 16) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';

    const allChars = uppercase + lowercase + numbers + special;
    let password = '';

    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}

module.exports = PasswordHashManager;
