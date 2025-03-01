import { Router, Request } from "express";
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
 * Creates and configures the attendance router
 * 
 * @param storage - The storage interface for database access
 * @returns Express router configured with attendance routes
 */
export function createAttendanceRouter(storage: IStorage): Router {
  const router = Router({ mergeParams: true });

  /**
   * Record attendance for a team
   * 
   * This endpoint allows coaches to record attendance for a practice session.
   * It supports bulk creation of attendance records for multiple players.
   * 
   * Authorization:
   * - User must be authenticated
   * - User must be the coach of the team
   * 
   * @route POST /api/teams/:teamId/attendance
   * @param teamId - The team ID to record attendance for
   * @body date - The date of attendance
   * @body records - Array of attendance records (playerId, present)
   * @returns The created attendance records
   */
  router.post("/", async (req: Request<TeamParams>, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "coach") {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in as a coach to record attendance'
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
          message: 'You do not have permission to record attendance for this team'
        });
      }

      // Validate the date
      if (!req.body.date) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Date is required'
        });
      }
      
      const date = new Date(req.body.date);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Invalid date format'
        });
      }
      
      // Validate the records
      if (!Array.isArray(req.body.records)) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Records must be an array'
        });
      }
      
      // Transform records to include teamId and date
      const records = req.body.records.map((record: any) => ({
        playerId: record.playerId,
        teamId,
        date,
        present: record.present
      }));

      // Update attendance records
      const attendance = await storage.updateAttendance(teamId, date, records);
      res.status(201).json(attendance);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  /**
   * Get attendance records for a team
   * 
   * This endpoint retrieves attendance records for a specific team and date range.
   * It supports filtering by date range to allow for flexible reporting.
   * 
   * Authorization:
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: must have a child on the team
   * 
   * @route GET /api/teams/:teamId/attendance
   * @param teamId - The team ID to get attendance for
   * @query startDate - Optional start date for filtering (inclusive)
   * @query endDate - Optional end date for filtering (inclusive)
   * @returns Array of attendance records for the specified team and date range
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
          message: 'You do not have permission to view attendance for this team'
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
      
      const attendance = await storage.getAttendanceByTeamId(teamId);
      res.json(attendance);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching attendance records'
      });
    }
  });

  /**
   * Get attendance records for a specific player
   * 
   * This endpoint retrieves attendance records for a specific player within a team.
   * It provides a history of the player's attendance at practices.
   * 
   * Authorization:
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: must be the parent of the player
   * 
   * @route GET /api/teams/:teamId/attendance/player/:playerId
   * @param teamId - The team ID the player belongs to
   * @param playerId - The player ID to get attendance for
   * @returns Array of attendance records for the specified player
   */
  router.get("/player/:playerId", async (req: Request<PlayerParams>, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to perform this action'
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
      
      // Authorization check for coaches
      if (req.user.role === "coach" && team.coachId !== req.user.id) {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'You do not have permission to view attendance for this player'
        });
      }
      
      const player = await storage.getPlayer(playerId);
      if (!player || player.teamId !== teamId) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Player not found'
        });
      }
      
      // For parents, check if they are the parent of the player
      if (req.user.role === "parent" && player.parentId !== req.user.id) {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'You do not have permission to view attendance for this player'
        });
      }
      
      const attendance = await storage.getAttendanceByPlayerId(playerId, teamId);
      res.json(attendance);
    } catch (err) {
      console.error('Error fetching player attendance:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching attendance records'
      });
    }
  });

  return router;
} 