import { Router, Request } from "express";
import { insertPracticeNoteSchema } from "@shared/schema";
import { handleValidationError } from "./utils";
import { IStorage } from "../storage";

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
   * This endpoint allows coaches to record notes for a practice session,
   * including general notes and specific player observations.
   * 
   * Authorization:
   * - User must be authenticated
   * - User must have the 'coach' role
   * - User must be the coach of the team
   * 
   * @route POST /api/teams/:teamId/practice-notes
   * @param teamId - The team ID to add practice notes for
   * @body practiceDate - The date of the practice
   * @body notes - General notes about the practice
   * @body playerIds - Array of player IDs that participated
   * @returns The created practice note with ID assigned
   */
  router.post("/", async (req: Request<TeamParams>, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "coach") {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in as a coach to add practice notes'
        });
      }
      
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Team ID must be a valid number'
        });
      }
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Team with ID ${teamId} not found`
        });
      }
      
      if (team.coachId !== req.user.id) {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'You do not have permission to add practice notes for this team'
        });
      }
      
      const parsed = insertPracticeNoteSchema.parse({
        ...req.body,
        teamId,
        coachId: req.user.id,
      });
      
      const practiceNote = await storage.createPracticeNote(parsed);
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
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: must have a child on the team
   * 
   * @route GET /api/teams/:teamId/practice-notes
   * @param teamId - The team ID to get practice notes for
   * @query startDate - Optional start date for filtering (inclusive)
   * @query endDate - Optional end date for filtering (inclusive)
   * @returns Array of practice notes for the specified team and date range
   */
  router.get("/", async (req: Request<TeamParams, any, any, DateRangeQuery>, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to perform this action'
        });
      }
      
      const teamId = parseInt(req.params.teamId);
      if (isNaN(teamId)) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Team ID must be a valid number'
        });
      }
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Team with ID ${teamId} not found`
        });
      }
      
      // Authorization check for coaches
      if (req.user.role === "coach" && team.coachId !== req.user.id) {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'You do not have permission to view practice notes for this team'
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
   * - User must be authenticated
   * - User must have the 'coach' role
   * - User must be the coach of the team
   * 
   * @route GET /api/teams/:teamId/practice-notes/player/:playerId
   * @param teamId - The team ID the player belongs to
   * @param playerId - The player ID to get practice notes for
   * @returns Array of practice notes that include the specified player
   */
  router.get("/player/:playerId", async (req: Request<PlayerParams>, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "coach") {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in as a coach to view player practice notes'
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
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Team with ID ${teamId} not found`
        });
      }
      
      if (team.coachId !== req.user.id) {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'You do not have permission to view practice notes for this team'
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