const DataLoader = require('dataloader')

class BatchOperations {
  constructor () {
    this.userLoader = new DataLoader(this.batchLoadUsers.bind(this))
    this.postLoader = new DataLoader(this.batchLoadPosts.bind(this))
  }

  async batchLoadUsers (userIds) {
    console.log(`Loading users: ${userIds.join(', ')}`)
    // Mock data - replace with actual DB query
    return userIds.map((id) => ({
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`
    }))
  }

  async batchLoadPosts (postIds) {
    console.log(`Loading posts: ${postIds.join(', ')}`)
    // Mock data - replace with actual DB query
    return postIds.map((id) => ({
      id,
      title: `Post ${id}`,
      content: `Content of post ${id}`
    }))
  }

  async processBatch (requests) {
    const results = []
    for (const req of requests) {
      const result = await this.handleRequest(req)
      results.push(result)
    }
    return results
  }

  async handleRequest (request) {
    const { method, path, data } = request
    switch (method.toUpperCase()) {
      case 'GET':
        return this.get(path)
      case 'POST':
        return this.post(path, data)
      case 'PUT':
        return this.put(path, data)
      case 'DELETE':
        return this.delete(path)
      default:
        return { error: 'Unknown method' }
    }
  }

  async get (path) {
    if (path.startsWith('/users/')) {
      const id = path.split('/').pop()
      return this.userLoader.load(id)
    }
    return { error: 'Not found' }
  }

  async post (path, data) {
    console.log(`Creating ${path}`, data)
    return { success: true, id: Math.random().toString(), ...data }
  }

  async put (path, data) {
    console.log(`Updating ${path}`, data)
    return { success: true, ...data }
  }

  async delete (path) {
    console.log(`Deleting ${path}`)
    return { success: true }
  }
}

module.exports = BatchOperations
