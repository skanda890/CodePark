/**
 * Role-based permission mapping
 * Each role includes a list of permissions it has access to
 */
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
  VIEWER: [
    'read-code',
    'view-reviews',
    'view-analytics',
    'read-members'
  ]
}

/**
 * Check if a role has a specific permission
 * @param {string} role - User role (OWNER, ADMIN, etc.)
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean} True if role has the permission
 */
const hasPermission = (role, requiredPermission) => {
  const permissions = rolePermissions[role] || []
  return permissions.includes('all') || permissions.includes(requiredPermission)
}

module.exports = {
  rolePermissions,
  hasPermission
}
