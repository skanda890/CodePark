/**
 * Bloom Filter (Feature #34)
 * Space-efficient data structure for membership testing
 */

const crypto = require('crypto')

class BloomFilter {
  constructor (size = 10000, hashFunctions = 3) {
    this.size = size
    this.bits = new Uint8Array(Math.ceil(size / 8))
    this.hashFunctions = hashFunctions
  }

  /**
   * Hash function
   */
  hash (value, seed) {
    const hash = crypto.createHash('md5').update(`${value}:${seed}`).digest()
    return Math.abs(parseInt(hash.readUInt32BE(0)) % this.size)
  }

  /**
   * Add value to filter
   */
  add (value) {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this.hash(value, i)
      const byteIndex = Math.floor(index / 8)
      const bitIndex = index % 8
      this.bits[byteIndex] |= 1 << bitIndex
    }
  }

  /**
   * Check if value might be in filter (may have false positives)
   */
  mightContain (value) {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this.hash(value, i)
      const byteIndex = Math.floor(index / 8)
      const bitIndex = index % 8
      if ((this.bits[byteIndex] & (1 << bitIndex)) === 0) {
        return false
      }
    }
    return true
  }
}

module.exports = BloomFilter
