const cron = require('node-cron')

class CacheWarmer {
  constructor (options = {}) {
    this.schedule = options.schedule || '0 * * * *' // Hourly
    this.cache = options.cache
    this.datasets = options.datasets || []
  }

  start () {
    cron.schedule(this.schedule, () => this.warm())
    console.log(`Cache warming scheduled: ${this.schedule}`)
  }

  async warm () {
    console.log('Starting cache warming...')
    for (const dataset of this.datasets) {
      try {
        const data = await dataset.loader()
        await this.cache.set(dataset.key, data, 3600)
        console.log(`Warmed cache: ${dataset.key}`)
      } catch (error) {
        console.error(
          `Cache warming failed for ${dataset.key}: ${error.message}`
        )
      }
    }
  }

  addDataset (key, loader, ttl = 3600) {
    this.datasets.push({ key, loader, ttl })
  }

  removeDataset (key) {
    this.datasets = this.datasets.filter((d) => d.key !== key)
  }
}

module.exports = CacheWarmer
