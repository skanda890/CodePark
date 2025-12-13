const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission, requireAdminRole } = require('../middleware/authorization');
const TeamService = require('../services/teamService');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(requireAuth);

/**
 * POST /api/projects/:projectId/members
 * Add team member to project
 */
router.post(
  '/:projectId/members',
  requireAdminRole,
  [
    body('userId').isString().notEmpty().withMessage('User ID is required'),
    body('role').isIn(['OWNER', 'ADMIN', 'MAINTAINER', 'CONTRIBUTOR', 'VIEWER']).optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { projectId } = req.params;
      const { userId, role = 'CONTRIBUTOR' } = req.body;
      
      const teamService = new TeamService(req.user.id, req.ip, req.get('User-Agent'));
      const member = await teamService.addTeamMember(projectId, userId, role);
      
      res.status(201).json({
        success: true,
        data: member
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/projects/:projectId/members
 * Get team members
 */
router.get(
  '/:projectId/members',
  requirePermission('read-members'),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      
      const teamService = new TeamService(req.user.id, req.ip, req.get('User-Agent'));
      const members = await teamService.getTeamMembers(projectId);
      
      res.json({
        success: true,
        count: members.length,
        data: members
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PATCH /api/projects/:projectId/members/:userId/role
 * Update member role
 */
router.patch(
  '/:projectId/members/:userId/role',
  requireAdminRole,
  [
    body('role').isIn(['OWNER', 'ADMIN', 'MAINTAINER', 'CONTRIBUTOR', 'VIEWER'])
      .withMessage('Invalid role')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { projectId, userId } = req.params;
      const { role } = req.body;
      
      const teamService = new TeamService(req.user.id, req.ip, req.get('User-Agent'));
      const member = await teamService.updateMemberRole(projectId, userId, role);
      
      res.json({
        success: true,
        data: member
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * DELETE /api/projects/:projectId/members/:userId
 * Remove team member
 */
router.delete(
  '/:projectId/members/:userId',
  requireAdminRole,
  async (req, res) => {
    try {
      const { projectId, userId } = req.params;
      
      const teamService = new TeamService(req.user.id, req.ip, req.get('User-Agent'));
      await teamService.removeTeamMember(projectId, userId);
      
      res.json({ success: true, message: 'Member removed' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * POST /api/projects/:projectId/invites
 * Send team invite
 */
router.post(
  '/:projectId/invites',
  requireAdminRole,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('role').isIn(['CONTRIBUTOR', 'MAINTAINER', 'ADMIN']).optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { projectId } = req.params;
      const { email, role = 'CONTRIBUTOR' } = req.body;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const invite = await prisma.projectInvite.create({
        data: {
          projectId,
          email,
          role,
          token,
          expiresAt
        }
      });
      
      // TODO: Send email with invite link
      // sendInviteEmail(email, `${process.env.APP_URL}/invite/${token}`);
      
      res.status(201).json({
        success: true,
        data: { 
          id: invite.id, 
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * POST /api/invites/:token/accept
 * Accept team invite
 */
router.post(
  '/invites/:token/accept',
  requireAuth,
  async (req, res) => {
    try {
      const { token } = req.params;
      
      const invite = await prisma.projectInvite.findUnique({
        where: { token }
      });
      
      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }
      
      if (new Date() > invite.expiresAt) {
        return res.status(400).json({ error: 'Invite has expired' });
      }
      
      // Create team member
      const member = await prisma.teamMember.create({
        data: {
          projectId: invite.projectId,
          userId: req.user.id,
          role: invite.role
        }
      });
      
      // Mark invite as accepted
      await prisma.projectInvite.update({
        where: { id: invite.id },
        data: {
          acceptedAt: new Date(),
          acceptedByUserId: req.user.id
        }
      });
      
      res.json({ 
        success: true, 
        message: 'Invite accepted',
        data: member
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/projects/:projectId/invites
 * Get pending invites for a project
 */
router.get(
  '/:projectId/invites',
  requireAdminRole,
  async (req, res) => {
    try {
      const { projectId } = req.params;
      
      const invites = await prisma.projectInvite.findMany({
        where: { 
          projectId,
          acceptedAt: null
        },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.json({
        success: true,
        count: invites.length,
        data: invites
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;