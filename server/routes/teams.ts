import { Router } from "express";
import { insertTeamSchema } from "@shared/schema";
import { handleValidationError } from "./utils";
import { IStorage } from "../storage";
import express from 'express';
import { requireTeamRolePermission } from '../utils/authorization';

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
   * Update team settings
   * Requires 'manageTeamSettings' permission
   */
  router.put('/:teamId', requireTeamRolePermission('manageTeamSettings'), async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId, 10);
      if (isNaN(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID' });
      }

      const { name, description, seasonStartDate, seasonEndDate, teamFee } = req.body;
      
      const updatedTeam = await storage.updateTeam(teamId, {
        name,
        description,
        seasonStartDate,
        seasonEndDate,
        teamFee
      });

      res.json(updatedTeam);
    } catch (error) {
      console.error('Error updating team settings:', error);
      res.status(500).json({ error: 'Failed to update team settings' });
    }
  });

  return router;
} 