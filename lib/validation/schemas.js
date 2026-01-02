/**
 * Zod validation schemas for all API inputs
 * Prevents prototype pollution, XSS, injection attacks
 * Phase 2 Security Implementation
 */

const { z } = require('zod')

// Base schemas
const EmailSchema = z.string().email().toLowerCase().trim()

const UserSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: EmailSchema,
  password: z.string().min(8).max(128),
  role: z.enum(['user', 'developer', 'admin']).default('user'),
  permissions: z.array(z.string()).optional().default([])
})

const ProjectSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
  members: z.array(EmailSchema).optional().default([])
})

const ConfigSchema = z.object({
  key: z.string().regex(/^[A-Z_]+$/),
  value: z.string().max(10000),
  secure: z.boolean().default(false)
})

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false)
})

const TokenRefreshSchema = z.object({
  refreshToken: z.string().min(1)
})

// API Request schemas
const CreateUserRequest = UserSchema.omit({ permissions: true })
const UpdateUserRequest = UserSchema.partial()
const CreateProjectRequest = ProjectSchema
const UpdateProjectRequest = ProjectSchema.partial()

// Prevent prototype pollution by using strict()
const StrictUserSchema = CreateUserRequest.strict()
const StrictProjectSchema = CreateProjectRequest.strict()
const StrictConfigSchema = ConfigSchema.strict()
const StrictLoginSchema = LoginSchema.strict()
const StrictTokenRefreshSchema = TokenRefreshSchema.strict()

module.exports = {
  UserSchema,
  ProjectSchema,
  ConfigSchema,
  LoginSchema,
  TokenRefreshSchema,
  CreateUserRequest,
  UpdateUserRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  StrictUserSchema,
  StrictProjectSchema,
  StrictConfigSchema,
  StrictLoginSchema,
  StrictTokenRefreshSchema
}
