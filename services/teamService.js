const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

class TeamService {
  /**
   * Add member to team
   */
  async addTeamMember (projectId, userId, role = 'CONTRIBUTOR') {
    try {
      // Check if project exists and user is owner/admin
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { teamMembers: { where: { userId: this.currentUserId } } }
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Check permissions
      const userRole = project.teamMembers[0]?.role
      if (!['OWNER', 'ADMIN'].includes(userRole)) {
        throw new Error('Insufficient permissions')
      }

      // Check if member already exists
      const existing = await prisma.teamMember.findUnique({
        where: { projectId_userId: { projectId, userId } }
      })

      if (existing) {
        throw new Error('User is already a team member')
      }

      // Add member
      const member = await prisma.teamMember.create({
        data: {
          projectId,
          userId,
          role
        },
        include: {
          user: { select: { id: true, username: true, email: true } }
        }
      })

      // Log action
      await this.logAuditEvent(
        projectId,
        'team_member_added',
        'member',
        member.id
      )

      return member
    } catch (error) {
      throw new Error(`Failed to add team member: ${error.message}`)
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole (projectId, userId, newRole) {
    const validRoles = [
      'OWNER',
      'ADMIN',
      'MAINTAINER',
      'CONTRIBUTOR',
      'VIEWER'
    ]

    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
    }

    const member = await prisma.teamMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role: newRole },
      include: { user: { select: { username: true, email: true } } }
    })

    await this.logAuditEvent(
      projectId,
      'member_role_updated',
      'member',
      member.id,
      member.role,
      newRole
    )

    return member
  }

  /**
   * Remove team member
   */
  async removeTeamMember (projectId, userId) {
    // Verify not removing last owner
    const owners = await prisma.teamMember.findMany({
      where: { projectId, role: 'OWNER' }
    })

    if (owners.length === 1 && owners[0].userId === userId) {
      throw new Error('Cannot remove the last owner of the project')
    }

    await prisma.teamMember.delete({
      where: { projectId_userId: { projectId, userId } }
    })

    await this.logAuditEvent(projectId, 'member_removed', 'member', userId)
  }

  /**
   * Get team members
   */
  async getTeamMembers (projectId) {
    return prisma.teamMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })
  }

  /**
   * Check user permission
   */
  async hasPermission (projectId, userId, requiredPermission) {
    const member = await prisma.teamMember.findUnique({
      where: { projectId_userId: { projectId, userId } }
    })

    if (!member) {
      return false
    }

    const rolePermissions = {
      OWNER: ['all'],
      ADMIN: [
        'manage-team',
        'manage-settings',
        'delete-project',
        'manage-reviews'
      ],
      MAINTAINER: [
        'create-review',
        'approve-review',
        'merge-code',
        'manage-issues'
      ],
      CONTRIBUTOR: ['write-code', 'create-review', 'comment-review'],
      VIEWER: ['read-code', 'view-reviews', 'view-analytics']
    }

    const permissions = rolePermissions[member.role] || []
    return (
      permissions.includes('all') || permissions.includes(requiredPermission)
    )
  }

  /**
   * Log audit event
   */
  async logAuditEvent (
    projectId,
    action,
    resourceType,
    resourceId,
    oldValue = null,
    newValue = null
  ) {
    return prisma.auditLog.create({
      data: {
        projectId,
        userId: this.currentUserId,
        action,
        resourceType,
        resourceId,
        oldValue: oldValue?.toString(),
        newValue: newValue?.toString(),
        ipAddress: this.ipAddress,
        userAgent: this.userAgent
      }
    })
  }

  constructor (currentUserId, ipAddress, userAgent) {
    this.currentUserId = currentUserId
    this.ipAddress = ipAddress
    this.userAgent = userAgent
  }
}

module.exports = TeamService
