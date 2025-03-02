/**
 * Authorization Utilities
 * 
 * This module provides utility functions for authorization checks in the backend.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  userTypeHasPermission, 
  teamRoleHasPermission, 
  UserType, 
  TeamRole,
  UserTypePermissions,
  TeamRolePermissions 
} from '@shared/access-control';
import { db } from '../db';
import { teams, users, teamMembers } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Extended Express session with userId
 */
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

/**
 * Middleware to check if user has a specific user type permission
 */
export function requireUserTypePermission(permission: keyof UserTypePermissions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get user role from database
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.session.userId)
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const userRole = user.role as UserType;
      
      if (userTypeHasPermission(userRole, permission)) {
        next();
      } else {
        res.status(403).json({ error: 'Forbidden' });
      }
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

/**
 * Middleware to check if user has a specific team role permission
 */
export function requireTeamRolePermission(teamParam: string, permission: keyof TeamRolePermissions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const teamId = parseInt(req.params[teamParam], 10);
      if (isNaN(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }

      // Get user's role in the team
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, teamId)
      });

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Check if user is team owner
      if (team.coachId === req.session.userId) {
        // Owner has all permissions
        return next();
      }

      // Check team membership role
      const membership = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, req.session.userId)
        )
      });

      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this team' });
      }

      const roleInTeam = membership.role as TeamRole;
      
      if (teamRoleHasPermission(roleInTeam, permission)) {
        next();
      } else {
        res.status(403).json({ error: 'Insufficient permissions' });
      }
    } catch (error) {
      console.error('Team authorization error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

/**
 * Example usage in a route:
 * 
 * // Only coaches can create teams
 * router.post('/teams', requireUserTypePermission('createNewTeam'), async (req, res) => {
 *   // Route implementation
 * });
 * 
 * // Only team owners or roles with addPlayer permission can add players
 * router.post('/teams/:teamId/players', requireTeamRolePermission('teamId', 'addPlayer'), async (req, res) => {
 *   // Route implementation
 * });
 */ 