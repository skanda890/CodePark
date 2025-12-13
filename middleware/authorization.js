const prisma = require('../lib/prisma')
const { hasPermission } = require('../lib/permissions')

/**
 * Check if user has a specific permission
 */
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { projectId } = req.params
      const userId = req.user.id

      const member = await prisma.teamMember.findUnique({
        where: { projectId_userId: { projectId, userId } }
      })

      if (!member) {
        return res.status(403).json({
          error: 'User is not a team member',
          required: requiredPermission
        })
      }

      if (!hasPermission(member.role, requiredPermission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredPermission,
          userRole: member.role
        })
      }

      next()
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

/**
 * Factory for creating role-based middleware
 */
const requireRole = (allowedRoles, errorMessage) => {
  return async (req, res, next) => {
    try {
      const { projectId } = req.params
      const member = await prisma.teamMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id
          }
        }
      })

      if (!member || !allowedRoles.includes(member.role)) {
        return res.status(403).json({
          error: errorMessage,
          userRole: member?.role || 'none'
        })
      }

      next()
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' })
    }
  }
}

/**
 * Check if user is project owner or admin
 */
const requireAdminRole = requireRole(
  ['OWNER', 'ADMIN'],
  'Admin access required'
)

/**
 * Check if user is project owner
 */
const requireOwnerRole = requireRole(['OWNER'], 'Owner access required')

module.exports = {
  requirePermission,
  requireAdminRole,
  requireOwnerRole
}
