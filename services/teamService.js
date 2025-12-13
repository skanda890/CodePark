const prisma = require('../lib/prisma')
const { hasPermission } = require('../lib/permissions')

class TeamService {
  constructor (currentUserId, ipAddress, userAgent, auditLogger = null) {
    this.currentUserId = currentUserId
    this.ipAddress = ipAddress
    this.userAgent = userAgent
    this.auditLogger = auditLogger
  }

  /**
   * Add member to team
   */
  async addTeamMember (projectId, userId, role = 'CONTRIBUTOR') {
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
    await this.logAuditEvent({
      projectId,
      action: 'team_member_added',
      resourceType: 'member',
      resourceId: member.id
    })

    return member
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

    await this.logAuditEvent({
      projectId,
      action: 'member_role_updated',
      resourceType: 'member',
      resourceId: member.id,
      oldValue: member.role,
      newValue: newRole
    })

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

    await this.logAuditEvent({
      projectId,
      action: 'member_removed',
      resourceType: 'member',
      resourceId: userId
    })
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
   * Check user permission using shared permission model
   */
  async hasPermission (projectId, userId, requiredPermission) {
    const member = await prisma.teamMember.findUnique({
      where: { projectId_userId: { projectId, userId } }
    })

    if (!member) {
      return false
    }

    return hasPermission(member.role, requiredPermission)
  }

  /**
   * Log audit event with options object pattern
   */
  async logAuditEvent ({
    projectId,
    action,
    resourceType,
    resourceId,
    oldValue = null,
    newValue = null
  }) {
    if (this.auditLogger) {
      return this.auditLogger.log({
        projectId,
        action,
        resourceType,
        resourceId,
        oldValue,
        newValue
      })
    }

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
}

module.exports = TeamService
