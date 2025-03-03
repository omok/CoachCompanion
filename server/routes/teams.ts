import { Router } from "express";
import { insertTeamSchema } from "@shared/schema";
import { handleValidationError } from "./utils";
import { IStorage } from "../storage";
import express from 'express';
import { requireTeamRolePermission } from '../utils/authorization';

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
   * - User must have the 'coach' role
   * 
   * @route POST /api/teams
   * @body name - Team name
   * @body description - Optional team description
   * @returns The created team with ID assigned
   */
  router.post("/", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to perform this action'
        });
      }
      
      if (req.user.role !== "coach") {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'Only coaches can create teams'
        });
      }
      
      const parsed = insertTeamSchema.parse({ ...req.body, coachId: req.user.id });
      const team = await storage.createTeam(parsed);
      res.status(201).json(team);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  /**
   * Get teams for the authenticated user
   * 
   * This endpoint returns different teams based on the user's role:
   * - Coaches see teams they coach (direct relationship)
   * - Parents see teams their children are on (indirect relationship through players)
   * 
   * This dual behavior allows the same endpoint to be used by both user types
   * while maintaining proper data access controls.
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
      
      // Different behavior based on user role
      if (req.user.role === "coach") {
        // Coaches see teams they coach
        const teams = await storage.getTeamsByCoachId(req.user.id);
        res.json(teams);
      } else if (req.user.role === "parent") {
        // Parents see teams their children are on
        const teams = await storage.getTeamsByParentId(req.user.id);
        res.json(teams);
      } else {
        res.json([]);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching teams'
      });
    }
  });

  /**
   * Get a specific team by ID
   * 
   * This endpoint returns detailed information about a specific team.
   * Users must be a member of the team or the team coach to access this data.
   * 
   * Authorization:
   * - User must be authenticated
   * - User must be a member of the team or the team coach
   * 
   * @route GET /api/teams/:teamId
   * @param teamId - ID of the team to retrieve
   * @returns Team details if user has access
   */
  router.get('/:teamId', async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        console.log(`[Teams] GET team ${req.params.teamId} - Not authenticated`);
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to access team details'
        });
      }
      
      // Parse team ID
      const teamId = parseInt(req.params.teamId, 10);
      if (isNaN(teamId)) {
        console.log(`[Teams] GET team ${req.params.teamId} - Invalid team ID`);
        return res.status(400).json({ 
          error: 'Invalid Request', 
          message: 'Team ID must be a number' 
        });
      }

      console.log(`[Teams] GET team ${teamId} - User ${req.user.id} (${req.user.username}) requesting team details`);
      
      // First check if team exists
      const team = await storage.getTeamById(teamId);
      if (!team) {
        console.log(`[Teams] GET team ${teamId} - Team not found`);
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Team not found' 
        });
      }
      
      // Check team access (coach or team member)
      const userId = req.user.id;
      
      // If user is coach of the team
      if (team.coachId === userId) {
        console.log(`[Teams] GET team ${teamId} - Access granted (coach)`);
        return res.json(team);
      }
      
      // If user is a member of the team
      const teamMemberships = await storage.getTeamMembersByUserId(userId);
      const isMember = teamMemberships.some((membership: { teamId: number }) => membership.teamId === teamId);
      
      if (isMember) {
        console.log(`[Teams] GET team ${teamId} - Access granted (team member)`);
        return res.json(team);
      }
      
      // If neither coach nor member, deny access
      console.log(`[Teams] GET team ${teamId} - Access denied for user ${userId}`);
      return res.status(403).json({
        error: 'Permission Denied',
        message: 'You do not have permission to access this team'
      });
      
    } catch (error) {
      console.error(`[Teams] Error fetching team ${req.params.teamId}:`, error);
      res.status(500).json({ 
        error: 'Server Error', 
        message: 'An error occurred while fetching team details' 
      });
    }
  });

  /**
   * Update team settings
   * Requires 'manageTeamSettings' permission
   */
  router.put('/:teamId', requireTeamRolePermission('manageTeamSettings'), async (req, res) => {
    try {
      const userInfo = req.user ? `User ${req.user.id} (${req.user.username})` : 'Unknown user';
      console.log(`[Teams] PUT team ${req.params.teamId} - ${userInfo} updating team settings`);
      
      const teamId = parseInt(req.params.teamId, 10);
      if (isNaN(teamId)) {
        console.log(`[Teams] PUT team ${req.params.teamId} - Invalid team ID`);
        return res.status(400).json({ error: 'Invalid team ID' });
      }

      const { name, description, seasonStartDate, seasonEndDate, teamFee } = req.body;
      console.log(`[Teams] PUT team ${teamId} - Update data:`, { name, description, seasonStartDate, seasonEndDate, teamFee });
      
      // Process fields that need special handling
      
      // Fix for numeric field validation: convert empty string to null
      const processedTeamFee = teamFee === '' ? null : teamFee;
      
      // Process dates - ensure they're in YYYY-MM-DD format or null
      let processedStartDate = seasonStartDate;
      let processedEndDate = seasonEndDate;
      
      if (seasonStartDate && !isValidDateFormat(seasonStartDate)) {
        console.warn(`[Teams] Invalid start date format, setting to null: ${seasonStartDate}`);
        processedStartDate = null;
      }
      
      if (seasonEndDate && !isValidDateFormat(seasonEndDate)) {
        console.warn(`[Teams] Invalid end date format, setting to null: ${seasonEndDate}`);
        processedEndDate = null;
      }
      
      const updatedTeam = await storage.updateTeam(teamId, {
        name,
        description,
        seasonStartDate: processedStartDate,
        seasonEndDate: processedEndDate,
        teamFee: processedTeamFee
      });

      console.log(`[Teams] PUT team ${teamId} - Team updated successfully`);
      res.json(updatedTeam);
    } catch (error) {
      console.error(`[Teams] Error updating team ${req.params.teamId} settings:`, error);
      res.status(500).json({ error: 'Failed to update team settings' });
    }
  });

  return router;
} 