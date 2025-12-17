const crypto = require('crypto');

class EncryptionService {
  constructor(options = {}) {
    this.algorithm = options.algorithm || 'aes-256-gcm';
    this.key = options.key || crypto.randomBytes(32);
  }

  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  hash(data, salt = crypto.randomBytes(16)) {
    return crypto
      .pbkdf2Sync(data, salt, 100000, 64, 'sha512')
      .toString('hex');
  }
}

module.exports = EncryptionService;
