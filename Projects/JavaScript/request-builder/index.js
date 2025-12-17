class RequestBuilder {
  constructor () {
    this.requests = new Map()
    this.history = []
  }

  createRequest (name, method = 'GET', url = '') {
    const request = {
      id: Math.random().toString(36).substring(7),
      name,
      method,
      url,
      headers: {},
      params: {},
      body: null,
      auth: null,
      createdAt: new Date()
    }
    this.requests.set(request.id, request)
    return request
  }

  addHeader (requestId, key, value) {
    const request = this.requests.get(requestId)
    if (request) {
      request.headers[key] = value
    }
  }

  addParam (requestId, key, value) {
    const request = this.requests.get(requestId)
    if (request) {
      request.params[key] = value
    }
  }

  setBody (requestId, body) {
    const request = this.requests.get(requestId)
    if (request) {
      request.body = body
    }
  }

  setAuth (requestId, type, credentials) {
    const request = this.requests.get(requestId)
    if (request) {
      request.auth = { type, credentials }
    }
  }

  async send (requestId) {
    const request = this.requests.get(requestId)
    if (!request) return null

    try {
      const options = {
        method: request.method,
        headers: request.headers
      }

      if (request.body) {
        options.body = JSON.stringify(request.body)
      }

      if (request.auth) {
        options.headers.Authorization = `${request.auth.type} ${request.auth.credentials}`
      }

      const response = await fetch(request.url, options)
      const data = await response.json()

      const historyEntry = {
        requestId,
        timestamp: new Date(),
        status: response.status,
        response: data
      }

      this.history.push(historyEntry)
      return historyEntry
    } catch (error) {
      return { error: error.message }
    }
  }

  getHistory (requestId) {
    return this.history.filter((h) => h.requestId === requestId)
  }
}

module.exports = RequestBuilder
