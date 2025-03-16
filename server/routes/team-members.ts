import express, { Router } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { requireTeamRolePermission } from '../utils/authorization';
import { insertTeamMemberSchema } from '@shared/schema';
import { Logger } from '../logger';
import { TEAM_ROLE_PERMISSIONS } from "@shared/access-control";
import { TEAM_ROLES } from "@shared/constants";
import { TEAM_PERMISSION_KEYS } from '@shared/access-control';
import { isValidTeamRole, getSuggestedTeamRole } from '../utils/validation';

/**
 * Creates a router for team members endpoints
 * 
 * @param storage - Storage instance for database operations
 * @returns Express router
 */
export function createTeamMembersRouter(storage: IStorage) {
  const router = Router();

  /**
   * GET /api/user/teams
   * 
   * Get all team memberships for the authenticated user
   */
  router.get('/api/user/teams', async (req, res) => {
    // Get the user ID from any available source
    const userId = req.user?.id || 
                  req.session?.userId || 
                  (req.session as any)?.passport?.user;

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to access team memberships'
      });
    }

    try {
      // Call the storage method to get team memberships
      const teamMemberships = await storage.getTeamMembersByUserId(userId);
      
      res.json(teamMemberships);
    } catch (error) {
      Logger.error('Error fetching team memberships', { error, userId });
      res.status(500).json({ 
        error: 'Failed to fetch team memberships',
        message: 'An error occurred while retrieving your team memberships'
      });
    }
  });

  /**
   * GET /api/teams/:teamId/members
   * 
   * Get all members of a team
   * Requires SEE_TEAM_ROSTER permission
   */
  router.get('/api/teams/:teamId/members', requireTeamRolePermission(TEAM_PERMISSION_KEYS.SEE_TEAM_ROSTER), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }

      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      Logger.error('Error getting team members', { error });
      res.status(500).json({ error: 'Failed to get team members' });
    }
  });

  /**
   * POST /api/teams/:teamId/members
   * 
   * Create a new team member (add a user to a team with a specific role)
   * 
   * Requires INVITE_TEAM_MEMBERS permission
   */
  router.post('/api/teams/:teamId/members', requireTeamRolePermission(TEAM_PERMISSION_KEYS.INVITE_TEAM_MEMBERS), async (req, res) => {
    try {
      // Parse and validate the team ID
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Team ID must be a valid number'
        });
      }
      
      // Validate the role
      if (req.body.role && !isValidTeamRole(req.body.role)) {
        const suggestedRole = getSuggestedTeamRole(req.body.role);
        
        if (suggestedRole !== req.body.role) {
          // Update the role to the suggested one
          req.body.role = suggestedRole;
        } else {
          // Can't correct, return validation error
          return res.status(400).json({
            error: 'Validation Error',
            message: `Invalid team role: "${req.body.role}". Valid roles are: ${Object.values(TEAM_ROLES).join(', ')}`,
            validRoles: Object.values(TEAM_ROLES)
          });
        }
      }
      
      // Parse and validate the request
      try {
        const parsedData = insertTeamMemberSchema.parse({
          ...req.body,
          teamId
        });
        
        // Create the team member
        const teamMember = await storage.createTeamMember(parsedData, { currentUserId: req.user?.id || 0 });
        
        // Return success response
        res.status(201).json(teamMember);
      } catch (err) {
        Logger.error('Error inserting team member', { error: err });
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid team member data',
          details: err
        });
      }
    } catch (error) {
      Logger.error('Error creating team member', { error });
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while creating the team member'
      });
    }
  });

  /**
   * PUT /api/teams/:teamId/members/:memberId
   * 
   * Update a team member's role
   * Requires MANAGE_TEAM_SETTINGS permission
   */
  router.put('/api/teams/:teamId/members/:memberId', requireTeamRolePermission(TEAM_PERMISSION_KEYS.MANAGE_TEAM_SETTINGS), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const memberId = parseInt(req.params.memberId);
      
      if (isNaN(teamId) || isNaN(memberId)) {
        return res.status(400).json({ error: 'Invalid ID parameters' });
      }

      // Validate the request body
      const validatedData = z.object({
        role: z.enum([TEAM_ROLES.OWNER, TEAM_ROLES.ASSISTANT_COACH, TEAM_ROLES.TEAM_MANAGER, TEAM_ROLES.REGULAR]).optional(),
        isOwner: z.boolean().optional()
      }).parse(req.body);

      // Get the member to verify it belongs to the specified team
      const members = await storage.getTeamMembers(teamId);
      const memberToUpdate = members.find(m => m.id === memberId);
      
      if (!memberToUpdate) {
        return res.status(404).json({ error: 'Team member not found' });
      }

      // Get the current user ID from the session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Update the member with the current user context
      const updatedMember = await storage.updateTeamMember(memberId, validatedData, { currentUserId: userId });
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
   * Requires REMOVE_TEAM_MEMBERS permission
   */
  router.delete('/api/teams/:teamId/members/:memberId', requireTeamRolePermission(TEAM_PERMISSION_KEYS.REMOVE_TEAM_MEMBERS), async (req, res) => {
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