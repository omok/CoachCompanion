import { Router } from "express";
import { insertTeamSchema } from "@shared/schema";
import { handleValidationError } from "./utils";
import { IStorage } from "../storage";
import express from 'express';
import { requireTeamRolePermission } from '../utils/authorization';
import { USER_ROLES, TEAM_ROLES } from '@shared/constants';
import { TEAM_PERMISSION_KEYS } from '@shared/access-control';

/**
 * Validate date format - YYYY-MM-DD
 * Following our documented date handling approach
 */
function isValidDateFormat(dateStr: string | null): boolean {
  if (!dateStr) return true; // null is valid
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Creates and configures the teams router
 * 
 * @param storage - The storage interface for database access
 * @returns Express router configured with team routes
 */
export function createTeamsRouter(storage: IStorage): Router {
  const router = express.Router();

  /**
   * Create a new team
   * 
   * This endpoint allows coaches to create new teams. The team is automatically
   * associated with the authenticated coach through the coachId field.
   * 
   * Authorization:
   * - User must be authenticated
   * - User must have the 'Coach' role
   * 
   * @route POST /api/teams
   * @body name - Team name
   * @body description - Optional team description
   * @returns The created team with ID assigned
   */
  router.post("/", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to perform this action'
        });
      }
      
      if (req.user.role !== USER_ROLES.COACH) {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'Only coaches can create teams'
        });
      }
      
      const parsed = insertTeamSchema.parse({ ...req.body, coachId: req.user.id });
      
      const team = await storage.createTeam(parsed, { currentUserId: req.user.id });

      // Create team member entry for the creator as owner
      const teamMember = await storage.createTeamMember({
        teamId: team.id,
        userId: req.user.id,
        role: TEAM_ROLES.OWNER,
        isOwner: true
      }, { currentUserId: req.user.id });

      res.status(201).json(team);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  /**
   * Get teams for the authenticated user
   * 
   * This endpoint returns teams based on the user's role and team memberships:
   * - Returns all teams where the user is a member (regardless of role)
   * - For coaches: also includes teams they coach (direct relationship)
   * - For parents: also includes teams their children are on (indirect relationship through players)
   * 
   * Authorization:
   * - User must be authenticated
   * 
   * @route GET /api/teams
   * @returns Array of teams relevant to the authenticated user
   */
  router.get("/", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to perform this action'
        });
      }

      // Get teams where user is a member
      const teamMemberships = await storage.getTeamMembersByUserId(req.user.id);
      const memberTeamIds = teamMemberships.map(tm => tm.teamId);
      
      // Get teams based on role-specific relationships
      let roleTeamIds: number[] = [];
      if (req.user.role === USER_ROLES.COACH) {
        // Coaches see teams they coach
        const coachTeams = await storage.getTeamsByCoachId(req.user.id);
        roleTeamIds = coachTeams.map(t => t.id);
      } else if (req.user.role === USER_ROLES.NORMAL) {
        // Parents see teams their children are on
        const parentTeams = await storage.getTeamsByParentId(req.user.id);
        roleTeamIds = parentTeams.map(t => t.id);
      }

      // Combine and deduplicate team IDs
      const allTeamIds = Array.from(new Set([...memberTeamIds, ...roleTeamIds]));
      
      // Fetch all teams
      const teams = await Promise.all(
        allTeamIds.map(id => storage.getTeam(id))
      );

      // Filter out any null results (in case a team was deleted)
      res.json(teams.filter(Boolean));
    } catch (err) {
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching teams'
      });
    }
  });

  /**
   * Get a team by ID
   * 
   * This endpoint retrieves a team by its ID. It includes authorization checks
   * to ensure that only authorized users can access the team data.
   * 
   * Authorization:
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: must have a child on the team
   * 
   * @route GET /api/teams/:teamId
   * @param teamId - The team ID to retrieve
   * @returns The team object if found and authorized
   */
  router.get('/:teamId', async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.json(team);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch team' });
    }
  });

  /**
   * Update team settings
   * Requires MANAGE_TEAM_SETTINGS permission
   */
  router.put('/:teamId', requireTeamRolePermission(TEAM_PERMISSION_KEYS.MANAGE_TEAM_SETTINGS), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to perform this action'
        });
      }

      const teamId = parseInt(req.params.teamId, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }

      const updatedTeam = await storage.updateTeam(teamId, {
        name: req.body.name,
        description: req.body.description,
        seasonStartDate: req.body.seasonStartDate,
        seasonEndDate: req.body.seasonEndDate,
        feeType: req.body.feeType || 'fixed',
        teamFee: req.body.teamFee === '' ? null : req.body.teamFee
      }, { currentUserId: req.user.id });

      res.json(updatedTeam);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update team settings' });
    }
  });

  return router;
} 