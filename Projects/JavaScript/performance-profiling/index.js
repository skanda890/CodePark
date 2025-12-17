class PerformanceProfiler {
  constructor () {
    this.profiles = new Map()
    this.metrics = new Map()
  }

  startProfile (name) {
    const profile = {
      name,
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
      snapshots: []
    }
    this.profiles.set(name, profile)
    return profile
  }

  snapshot (profileName, label) {
    const profile = this.profiles.get(profileName)
    if (profile) {
      profile.snapshots.push({
        label,
        time: performance.now() - profile.startTime,
        memory: process.memoryUsage()
      })
    }
  }

  endProfile (name) {
    const profile = this.profiles.get(name)
    if (profile) {
      profile.endTime = performance.now()
      profile.endMemory = process.memoryUsage()
      profile.duration = profile.endTime - profile.startTime
      profile.memoryDelta =
        profile.endMemory.heapUsed - profile.startMemory.heapUsed
    }
    return profile
  }

  getProfile (name) {
    return this.profiles.get(name)
  }

  getAllProfiles () {
    return Array.from(this.profiles.values())
  }

  getMetrics (name) {
    const profile = this.profiles.get(name)
    if (!profile) return null

    return {
      name: profile.name,
      duration: profile.duration,
      memoryUsed: (profile.memoryDelta / 1024 / 1024).toFixed(2) + ' MB',
      snapshots: profile.snapshots.map((s) => ({
        label: s.label,
        time: s.time.toFixed(2) + ' ms'
      }))
    }
  }
}

module.exports = PerformanceProfiler
