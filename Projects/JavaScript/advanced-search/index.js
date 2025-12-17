class AdvancedSearch {
  constructor (data = []) {
    this.data = data
    this.indices = new Map()
    this.buildIndices()
  }

  buildIndices () {
    // Build search indices
    const textIndex = new Map()
    for (const item of this.data) {
      const text = JSON.stringify(item).toLowerCase()
      const words = text.split(/\s+/)
      for (const word of words) {
        if (!textIndex.has(word)) {
          textIndex.set(word, [])
        }
        textIndex.get(word).push(item)
      }
    }
    this.indices.set('text', textIndex)
  }

  async search (query, options = {}) {
    const {
      filters = {},
      facets = [],
      sort = null,
      limit = 20,
      offset = 0
    } = options

    let results = this.data

    // Full-text search
    if (query) {
      const queryWords = query.toLowerCase().split(/\s+/)
      results = results.filter((item) => {
        const text = JSON.stringify(item).toLowerCase()
        return queryWords.every((word) => text.includes(word))
      })
    }

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      results = results.filter((item) => item[key] === value)
    }

    // Apply sorting
    if (sort) {
      const [field, order] = sort.startsWith('-')
        ? [sort.substring(1), -1]
        : [sort, 1]
      results.sort((a, b) => {
        if (a[field] < b[field]) return -order
        if (a[field] > b[field]) return order
        return 0
      })
    }

    // Calculate facets
    const facetResults = {}
    if (facets.length > 0) {
      for (const facet of facets) {
        facetResults[facet] = {}
        for (const item of results) {
          const value = item[facet]
          facetResults[facet][value] = (facetResults[facet][value] || 0) + 1
        }
      }
    }

    // Pagination
    const paginatedResults = results.slice(offset, offset + limit)

    return {
      results: paginatedResults,
      total: results.length,
      facets: facetResults
    }
  }

  async autocomplete (prefix, field = 'name') {
    const suggestions = new Set()
    for (const item of this.data) {
      if (
        item[field] &&
        item[field].toLowerCase().startsWith(prefix.toLowerCase())
      ) {
        suggestions.add(item[field])
      }
    }
    return Array.from(suggestions).slice(0, 10)
  }
}

module.exports = AdvancedSearch
