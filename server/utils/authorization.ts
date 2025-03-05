/**
 * Authorization Utilities
 * 
 * This module provides utility functions for authorization checks in the backend.
 */

import { Request, Response, NextFunction } from 'express';
import { 
  userRoleHasPermission, 
  teamRoleHasPermission,
  type UserRolePermissions,
  type TeamRolePermissions,
  TEAM_ROLE_PERMISSIONS
} from '@shared/access-control';
import { db } from '../db';
import { teams, users, teamMembers } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { USER_ROLES, TEAM_ROLES, type UserRole, type TeamRole } from '@shared/constants';

/**
 * Extended Express session with userId
 */
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

/**
 * Helper function to get the user ID from either session.userId, req.user, or passport data
 */
function getUserId(req: Request): number | null {
  // Try getting from session.userId
  if (req.session.userId) {
    return req.session.userId;
  }
  
  // Try getting from req.user if authenticated
  if (req.isAuthenticated() && req.user) {
    return (req.user as any).id;
  }
  
  // Try getting from passport session data
  const passportSession = (req.session as any)?.passport;
  if (passportSession && passportSession.user) {
    return passportSession.user;
  }
  
  return null;
}

/**
 * Middleware to check if user has a specific team role permission
 */
export function requireTeamRolePermission(permission: keyof typeof TEAM_ROLE_PERMISSIONS) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        console.log('[Auth] requireTeamRolePermission - No user ID found', { 
          session: req.session,
          isAuthenticated: req.isAuthenticated(),
          user: req.user
        });
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const teamId = parseInt(req.params.teamId, 10);
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
      if (team.coachId === userId) {
        // Owner has all permissions
        return next();
      }

      // Check team membership role
      const membership = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      });

      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this team' });
      }

      const roleInTeam = membership.role as TeamRole;
      
      if (teamRoleHasPermission(roleInTeam, TEAM_ROLE_PERMISSIONS[permission])) {
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
 * router.post('/teams/:teamId/players', requireTeamRolePermission('addPlayer'), async (req, res) => {
 *   // Route implementation
 * });
 */ 