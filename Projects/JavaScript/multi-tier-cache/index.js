class MultiTierCache {
  constructor (options = {}) {
    this.l1 = options.l1 || new MemoryCache()
    this.l2 = options.l2 || null
    this.ttl = options.ttl || 3600
  }

  async get (key) {
    // Try L1 (memory)
    let value = await this.l1.get(key)
    if (value) {
      return value
    }

    // Try L2 (Redis)
    if (this.l2) {
      value = await this.l2.get(key)
      if (value) {
        await this.l1.set(key, value, this.ttl)
        return value
      }
    }

    return null
  }

  async set (key, value, ttl = this.ttl, tags = []) {
    await this.l1.set(key, value, ttl)
    if (this.l2) {
      await this.l2.set(key, value, ttl)
    }
    if (tags.length > 0) {
      this.storeTags(key, tags)
    }
  }

  async invalidate (key) {
    await this.l1.delete(key)
    if (this.l2) {
      await this.l2.delete(key)
    }
  }

  storeTags (key, tags) {
    // Store tags for bulk invalidation
    for (const tag of tags) {
      const tagKey = `tag:${tag}`
      const keys = this.l1.get(tagKey) || []
      keys.push(key)
      this.l1.set(tagKey, keys, 86400)
    }
  }

  async invalidateByTag (tag) {
    const tagKey = `tag:${tag}`
    const keys = (await this.l1.get(tagKey)) || []
    for (const key of keys) {
      await this.invalidate(key)
    }
  }
}

class MemoryCache {
  constructor () {
    this.store = new Map()
  }

  async get (key) {
    const item = this.store.get(key)
    if (!item) return null
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  async set (key, value, ttl = 3600) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000
    })
  }

  async delete (key) {
    return this.store.delete(key)
  }
}

module.exports = { MultiTierCache, MemoryCache }
