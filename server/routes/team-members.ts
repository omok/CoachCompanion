import express from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { requireTeamRolePermission } from '../utils/authorization';
import { insertTeamMemberSchema } from '@shared/schema';
import { Logger } from '../logger';

/**
 * Creates a router for team members endpoints
 * 
 * @param storage - Storage instance for database operations
 * @returns Express router
 */
export function createTeamMembersRouter(storage: IStorage) {
  const router = express.Router({ mergeParams: true });

  /**
   * GET /api/user/teams
   * 
   * Get all team memberships for the authenticated user
   */
  router.get('/api/user/teams', async (req, res) => {
    // Log the request details
    console.log('[API] GET /api/user/teams request received', {
      session: req.session,
      userId: req.session?.userId,
      passportSession: (req.session as any)?.passport,
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      headers: req.headers,
      cookies: req.cookies
    });

    // Get the user ID either from session or passport user
    const userId = req.session.userId || (req.user ? (req.user as any).id : null) || 
                  (req.session as any)?.passport?.user;

    // Check if user is authenticated
    if (!userId) {
      console.log('[API] GET /api/user/teams - No userId found in session or user object', { 
        session: req.session,
        user: req.user
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      console.log(`[API] GET /api/user/teams - Fetching team memberships for userId: ${userId}`);
      
      // Call the storage method to get team memberships
      const teamMemberships = await storage.getTeamMembersByUserId(userId);
      
      // Log the result
      console.log(`[API] GET /api/user/teams - Found ${teamMemberships.length} team memberships`, { 
        userId,
        teamMemberships
      });
      
      res.json(teamMemberships);
    } catch (error) {
      console.log('[API] GET /api/user/teams - Error', error);
      Logger.error('Error fetching team memberships', { error });
      res.status(500).json({ error: 'Failed to fetch team memberships' });
    }
  });

  /**
   * GET /api/teams/:teamId/members
   * 
   * Get all members of a team
   * Requires 'seeTeamRoster' permission
   */
  router.get('/api/teams/:teamId/members', requireTeamRolePermission('seeTeamRoster'), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }

      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      Logger.error('Error fetching team members', { error });
      res.status(500).json({ error: 'Failed to fetch team members' });
    }
  });

  /**
   * POST /api/teams/:teamId/members
   * 
   * Add a new member to a team
   * Requires 'inviteTeamMembers' permission
   */
  router.post('/api/teams/:teamId/members', requireTeamRolePermission('inviteTeamMembers'), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }

      // Validate request body
      const validatedData = insertTeamMemberSchema.parse({
        ...req.body,
        teamId
      });

      const newMember = await storage.createTeamMember(validatedData);
      res.status(201).json(newMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      Logger.error('Error creating team member', { error });
      res.status(500).json({ error: 'Failed to create team member' });
    }
  });

  /**
   * PUT /api/teams/:teamId/members/:memberId
   * 
   * Update a team member's role
   * Requires 'inviteTeamMembers' permission
   */
  router.put('/api/teams/:teamId/members/:memberId', requireTeamRolePermission('inviteTeamMembers'), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const memberId = parseInt(req.params.memberId);
      
      if (isNaN(teamId) || isNaN(memberId)) {
        return res.status(400).json({ error: 'Invalid ID parameters' });
      }

      // Validate request body
      const validatedData = z.object({
        role: z.string().optional(),
        isOwner: z.boolean().optional()
      }).parse(req.body);

      // Get the member to verify it belongs to the specified team
      const members = await storage.getTeamMembers(teamId);
      const memberToUpdate = members.find(m => m.id === memberId);
      
      if (!memberToUpdate) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      // Update the member
      const updatedMember = await storage.updateTeamMember(memberId, validatedData);
      res.json(updatedMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      Logger.error('Error updating team member', { error });
      res.status(500).json({ error: 'Failed to update team member' });
    }
  });

  /**
   * DELETE /api/teams/:teamId/members/:memberId
   * 
   * Remove a member from a team
   * Requires 'removeTeamMembers' permission
   */
  router.delete('/api/teams/:teamId/members/:memberId', requireTeamRolePermission('removeTeamMembers'), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const memberId = parseInt(req.params.memberId);
      
      if (isNaN(teamId) || isNaN(memberId)) {
        return res.status(400).json({ error: 'Invalid ID parameters' });
      }

      // Get the member to verify it belongs to the specified team
      const members = await storage.getTeamMembers(teamId);
      const memberToDelete = members.find(m => m.id === memberId);
      
      if (!memberToDelete) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      // Check if the user is trying to delete the team owner
      if (memberToDelete.isOwner) {
        return res.status(403).json({ error: 'Cannot remove the team owner' });
      }

      // Delete the member
      await storage.deleteTeamMember(memberId);
      res.status(204).send();
    } catch (error) {
      Logger.error('Error deleting team member', { error });
      res.status(500).json({ error: 'Failed to delete team member' });
    }
  });

  return router;
} 