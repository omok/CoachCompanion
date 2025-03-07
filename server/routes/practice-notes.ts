import { Router, Request, Response } from "express";
import { insertPracticeNoteSchema } from "@shared/schema";
import { handleValidationError } from "./utils";
import { IStorage } from "../storage";
import { Logger } from "../logger";
import { requireTeamRolePermission } from '../utils/authorization';
import { TEAM_PERMISSION_KEYS } from '@shared/access-control';

// Define interface for request params
interface TeamParams {
  teamId: string;
}

interface PlayerParams extends TeamParams {
  playerId: string;
}

// Define interface for query params
interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

/**
 * Creates and configures the practice notes router
 * 
 * @param storage - The storage interface for database access
 * @returns Express router configured with practice notes routes
 */
export function createPracticeNotesRouter(storage: IStorage): Router {
  const router = Router({ mergeParams: true });

  /**
   * Create practice notes for a team
   * 
   * This endpoint allows users with the ADD_PRACTICE_NOTE permission to record notes
   * for a practice session, including general notes and specific player observations.
   * 
   * Authorization:
   * - User must have ADD_PRACTICE_NOTE permission for the team
   * 
   * @route POST /api/teams/:teamId/practice-notes
   * @param teamId - The team ID to create notes for
   * @returns The created practice note with ID assigned
   */
  router.post("/", requireTeamRolePermission(TEAM_PERMISSION_KEYS.ADD_PRACTICE_NOTE), async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to create practice notes'
        });
      }
      
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Team ID must be a valid number'
        });
      }
      
      // Team existence check
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Team with ID ${teamId} not found`
        });
      }
      
      // Parse and validate the data
      const parsed = insertPracticeNoteSchema.parse({
        ...req.body,
        teamId,
        coachId: req.user.id,
      });
      
      // Create the practice note
      const practiceNote = await storage.createPracticeNote(parsed, { currentUserId: req.user.id });
      res.status(201).json(practiceNote);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  /**
   * Get practice notes for a team
   * 
   * This endpoint retrieves practice notes for a specific team with optional
   * date range filtering. It provides a chronological record of practice
   * sessions and observations.
   * 
   * Authorization:
   * - User must have SEE_TEAM_ROSTER permission for the team
   * 
   * @route GET /api/teams/:teamId/practice-notes
   * @param teamId - The team ID to get practice notes for
   * @query startDate - Optional start date for filtering (inclusive)
   * @query endDate - Optional end date for filtering (inclusive)
   * @returns Array of practice notes for the specified team and date range
   */
  router.get("/", requireTeamRolePermission(TEAM_PERMISSION_KEYS.SEE_TEAM_ROSTER), async (req: Request<TeamParams, any, any, DateRangeQuery>, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to view practice notes'
        });
      }
      
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Team ID must be a valid number'
        });
      }
      
      // Parse date filters if provided
      let startDate = undefined;
      let endDate = undefined;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({
            error: 'Invalid Request',
            message: 'Invalid start date format'
          });
        }
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            error: 'Invalid Request',
            message: 'Invalid end date format'
          });
        }
      }
      
      const practiceNotes = await storage.getPracticeNotesByTeamId(teamId);
      res.json(practiceNotes);
    } catch (err) {
      console.error('Error fetching practice notes:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching practice notes'
      });
    }
  });

  /**
   * Get practice notes for a specific player
   * 
   * This endpoint retrieves practice notes that include a specific player.
   * It filters the team's practice notes to only include those that reference
   * the specified player.
   * 
   * Authorization:
   * - User must have ADD_PRACTICE_NOTE permission for the team
   * 
   * @route GET /api/teams/:teamId/practice-notes/player/:playerId
   * @param teamId - The team ID the player belongs to
   * @param playerId - The player ID to get practice notes for
   * @returns Array of practice notes that include the specified player
   */
  router.get("/player/:playerId", requireTeamRolePermission(TEAM_PERMISSION_KEYS.ADD_PRACTICE_NOTE), async (req: Request<PlayerParams>, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to view player practice notes'
        });
      }
      
      const teamId = parseInt(req.params.teamId);
      const playerId = parseInt(req.params.playerId);
      
      if (isNaN(teamId) || isNaN(playerId)) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Team ID and Player ID must be valid numbers'
        });
      }
      
      const player = await storage.getPlayer(playerId);
      if (!player || player.teamId !== teamId) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Player not found'
        });
      }
      
      const notes = await storage.getPracticeNotesByPlayerId(playerId, teamId);
      res.json(notes);
    } catch (err) {
      console.error('Error fetching player practice notes:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching practice notes'
      });
    }
  });

  return router;
} 