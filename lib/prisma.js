const { PrismaClient } = require('@prisma/client')

// Singleton Prisma instance to prevent connection pool exhaustion
const prisma = new PrismaClient()

module.exports = prisma
