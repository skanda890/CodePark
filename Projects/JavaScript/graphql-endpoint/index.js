const { ApolloServer, gql } = require('apollo-server-express')
const express = require('express')

// Schema Definition
const typeDefs = gql`
  type Query {
    hello: String
    users: [User]
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User
    updateUser(id: ID!, name: String, email: String): User
    deleteUser(id: ID!): Boolean
  }

  type Subscription {
    userCreated: User
  }

  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
  }
`

// Resolvers
const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    users: async () => {
      // Mock data - replace with actual DB query
      return [
        {
          id: '1',
          name: 'Alice',
          email: 'alice@example.com',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Bob',
          email: 'bob@example.com',
          createdAt: new Date().toISOString()
        }
      ]
    },
    user: async (_, { id }) => {
      // Mock data - replace with actual DB query
      return {
        id,
        name: 'User',
        email: 'user@example.com',
        createdAt: new Date().toISOString()
      }
    }
  },
  Mutation: {
    createUser: async (_, { name, email }) => {
      // Create user logic
      return {
        id: Math.random().toString(),
        name,
        email,
        createdAt: new Date().toISOString()
      }
    },
    updateUser: async (_, { id, name, email }) => {
      // Update user logic
      return {
        id,
        name: name || 'Updated',
        email: email || 'updated@example.com',
        createdAt: new Date().toISOString()
      }
    },
    deleteUser: async (_, { id }) => {
      // Delete user logic
      return true
    }
  }
}

// Server Setup
async function startServer () {
  const app = express()
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    playground: true
  })

  await server.start()
  server.applyMiddleware({ app })

  const PORT = process.env.GRAPHQL_PORT || 4000
  app.listen(PORT, () => {
    console.log(`GraphQL server running at http://localhost:${PORT}/graphql`)
  })
}

if (require.main === module) {
  startServer().catch(console.error)
}

module.exports = { startServer, typeDefs, resolvers }
