const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Check if user has permission for resource
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

      const rolePermissions = {
        OWNER: ['all'],
        ADMIN: [
          'manage-team',
          'manage-settings',
          'delete-project',
          'manage-reviews',
          'read-members'
        ],
        MAINTAINER: [
          'create-review',
          'approve-review',
          'merge-code',
          'manage-issues',
          'read-members'
        ],
        CONTRIBUTOR: [
          'write-code',
          'create-review',
          'comment-review',
          'read-members'
        ],
        VIEWER: ['read-code', 'view-reviews', 'view-analytics', 'read-members']
      }

      const permissions = rolePermissions[member.role] || []
      const hasPermission =
        permissions.includes('all') || permissions.includes(requiredPermission)

      if (!hasPermission) {
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
 * Check if user is project owner or admin
 */
const requireAdminRole = async (req, res, next) => {
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

    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return res.status(403).json({
        error: 'Admin access required',
        userRole: member?.role || 'none'
      })
    }

    next()
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' })
  }
}

/**
 * Check if user is project owner
 */
const requireOwnerRole = async (req, res, next) => {
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

    if (!member || member.role !== 'OWNER') {
      return res.status(403).json({
        error: 'Owner access required',
        userRole: member?.role || 'none'
      })
    }

    next()
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' })
  }
}

module.exports = {
  requirePermission,
  requireAdminRole,
  requireOwnerRole
}
