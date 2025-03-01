import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, initializeTestData } from "./auth";
import { storage } from "./storage";
import { insertTeamSchema, insertPlayerSchema, insertAttendanceSchema, insertPracticeNoteSchema, insertPaymentSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

/**
 * Register all API routes for the application
 * 
 * This function sets up authentication and registers all API endpoints
 * for teams, players, attendance, practice notes, and payments.
 * 
 * The API follows these general authorization patterns:
 * - Coaches can access and modify data for teams they coach
 * - Parents can access data for teams their children are on
 * - Some operations (like creating teams) are restricted to coaches only
 * 
 * @param app - Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Initialize test data
  await initializeTestData();

  /**
   * Error handler for validation errors
   * 
   * This function provides consistent error handling for validation errors
   * across all API endpoints. It converts Zod validation errors into a
   * user-friendly format with detailed information about what went wrong.
   * 
   * @param err - The error object (potentially a Zod validation error)
   * @param res - The Express response object
   * @returns The response with appropriate error details
   */
  const handleValidationError = (err: unknown, res: any) => {
    if (err instanceof ZodError) {
      // Convert Zod error to a more user-friendly format
      const validationError = fromZodError(err);
      return res.status(400).json({
        error: 'Validation Error',
        message: validationError.message,
        details: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    console.error('Unexpected error:', err);
    return res.status(500).json({
      error: 'Server Error',
      message: 'An unexpected error occurred while processing your request'
    });
  };

  // ==================== TEAM ENDPOINTS ====================

  /**
   * Create a new team
   * 
   * This endpoint allows coaches to create new teams. The coach ID is
   * automatically set to the authenticated user's ID to ensure that
   * coaches can only create teams they coach.
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
  app.post("/api/teams", async (req, res) => {
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
  app.get("/api/teams", async (req, res) => {
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

  // ==================== PLAYER ENDPOINTS ====================

  /**
   * Add a player to a team
   * 
   * This endpoint allows adding a player to a team with appropriate authorization checks.
   * The business logic includes:
   * 
   * 1. Coaches can add players to teams they coach
   * 2. Parents can add their children to teams (parentId is automatically set)
   * 3. Team existence is verified before adding a player
   * 
   * Authorization:
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: automatically sets parentId to the authenticated user
   * 
   * @route POST /api/teams/:teamId/players
   * @param teamId - The team ID to add the player to
   * @body name - Player name
   * @body parentId - Parent ID (required for coaches, auto-set for parents)
   * @returns The created player with ID assigned
   */
  app.post("/api/teams/:teamId/players", async (req, res) => {
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
      
      // Authorization check: coaches can only add players to their teams
      if (req.user.role === "coach" && team.coachId !== req.user.id) {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'You do not have permission to add players to this team'
        });
      }

      // Set parentId automatically for parents, use provided value for coaches
      const parentId = req.user.role === "parent" ? req.user.id : req.body.parentId;
      
      const parsed = insertPlayerSchema.parse({
        ...req.body,
        teamId,
        parentId,
      });
      
      const player = await storage.createPlayer(parsed);
      res.status(201).json(player);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  /**
   * Get players for a team
   * 
   * This endpoint returns all players for a specific team with appropriate
   * authorization checks to ensure data access control.
   * 
   * Authorization:
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: must have a child on the team (checked indirectly via team access)
   * 
   * @route GET /api/teams/:teamId/players
   * @param teamId - The team ID to get players for
   * @returns Array of players for the specified team
   */
  app.get("/api/teams/:teamId/players", async (req, res) => {
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
          message: 'You do not have permission to view players for this team'
        });
      }
      
      // For parents, the authorization is handled implicitly by the getTeam check
      // If a parent can access the team, they have a child on the team
      
      const players = await storage.getPlayersByTeamId(teamId);
      res.json(players);
    } catch (err) {
      console.error('Error fetching players:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching players'
      });
    }
  });

  /**
   * Get details for a specific player
   * 
   * This endpoint retrieves detailed information about a specific player
   * within a team. It includes authorization checks to ensure that only
   * authorized users can access the player data.
   * 
   * Authorization:
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: must be the parent of the player
   * 
   * @route GET /api/teams/:teamId/players/:playerId
   * @param teamId - The team ID the player belongs to
   * @param playerId - The player ID to get details for
   * @returns The player object with complete details
   */
  app.get("/api/teams/:teamId/players/:playerId", async (req, res) => {
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
          message: 'You do not have permission to view this player'
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
          message: 'You do not have permission to view this player'
        });
      }
      
      res.json(player);
    } catch (err) {
      console.error('Error fetching player:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching player details'
      });
    }
  });

  // ==================== ATTENDANCE ENDPOINTS ====================

  /**
   * Record attendance for a team
   * 
   * This endpoint allows coaches to record attendance for a team on a specific date.
   * The business logic includes:
   * 
   * 1. Replaces all attendance records for the team and date (bulk update pattern)
   * 2. Validates that each record has the required fields
   * 3. Ensures the coach has permission to record attendance for the team
   * 
   * The bulk update pattern simplifies the client-side logic by allowing the client
   * to send the complete state of attendance for a date, rather than calculating
   * individual changes.
   * 
   * Authorization:
   * - User must be authenticated
   * - User must have the 'coach' role
   * - User must be the coach of the team
   * 
   * @route POST /api/teams/:teamId/attendance
   * @param teamId - The team ID to record attendance for
   * @body date - The date of attendance
   * @body records - Array of attendance records (playerId, present)
   * @returns The created attendance records
   */
  app.post("/api/teams/:teamId/attendance", async (req, res) => {
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
  app.get("/api/teams/:teamId/attendance", async (req, res) => {
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
        startDate = new Date(req.query.startDate as string);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({
            error: 'Invalid Request',
            message: 'Invalid start date format'
          });
        }
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            error: 'Invalid Request',
            message: 'Invalid end date format'
          });
        }
      }
      
      const attendance = await storage.getAttendanceByTeamId(
        teamId
      );
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
  app.get("/api/teams/:teamId/attendance/player/:playerId", async (req, res) => {
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

  // Practice Notes
  /**
   * Create practice notes for a team
   * 
   * This endpoint allows coaches to record notes for a practice session,
   * including general notes and specific player observations. The business
   * logic includes:
   * 
   * 1. Validates that the coach has permission to add notes for the team
   * 2. Ensures the practice date is valid
   * 3. Validates that all referenced players exist on the team
   * 
   * Practice notes are a key feature for tracking team and player progress
   * over time and facilitating communication between coaches and parents.
   * 
   * Authorization:
   * - User must be authenticated
   * - User must have the 'coach' role
   * - User must be the coach of the team
   * 
   * @route POST /api/teams/:teamId/practice-notes
   * @param teamId - The team ID to add practice notes for
   * @body practiceDate - Date of the practice session
   * @body notes - General notes about the practice
   * @body playerIds - Array of player IDs who participated
   * @returns The created practice note with ID assigned
   */
  app.post("/api/teams/:teamId/practice-notes", async (req, res) => {
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
  app.get("/api/teams/:teamId/practice-notes", async (req, res) => {
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
        startDate = new Date(req.query.startDate as string);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({
            error: 'Invalid Request',
            message: 'Invalid start date format'
          });
        }
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({
            error: 'Invalid Request',
            message: 'Invalid end date format'
          });
        }
      }
      
      const practiceNotes = await storage.getPracticeNotesByTeamId(
        teamId
      );
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
  app.get("/api/teams/:teamId/practice-notes/player/:playerId", async (req, res) => {
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

  // Payments
  /**
   * Record a payment for a team
   * 
   * This endpoint allows coaches to record payments for a team.
   * The business logic includes:
   * 
   * 1. Validates that the coach has permission to record payments for the team
   * 2. Ensures the payment data is valid (amount, player, date)
   * 3. Creates a payment record in the database
   * 
   * Authorization:
   * - User must be authenticated
   * - User must have the 'coach' role
   * - User must be the coach of the team
   * 
   * @route POST /api/teams/:teamId/payments
   * @param teamId - The team ID to record payment for
   * @body playerId - The player ID the payment is for
   * @body amount - Payment amount (positive number with max 2 decimal places)
   * @body date - Date of payment
   * @body notes - Optional notes about the payment
   * @returns The created payment record with ID assigned
   */
  app.post("/api/teams/:teamId/payments", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "coach") {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in as a coach to record payments'
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
          message: 'You do not have permission to record payments for this team'
        });
      }
      
      const parsed = insertPaymentSchema.parse({
        ...req.body,
        teamId,
      });
      
      const payment = await storage.createPayment(parsed);
      res.status(201).json(payment);
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  /**
   * Get all payments for a team
   * 
   * This endpoint retrieves all payment records for a specific team.
   * It provides a comprehensive financial overview for the team.
   * 
   * Authorization:
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: must have a child on the team
   * 
   * @route GET /api/teams/:teamId/payments
   * @param teamId - The team ID to get payments for
   * @returns Array of payment records for the specified team
   */
  app.get("/api/teams/:teamId/payments", async (req, res) => {
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
          message: 'You do not have permission to view payments for this team'
        });
      }
      
      const payments = await storage.getPaymentsByTeamId(teamId);
      res.json(payments);
    } catch (err) {
      console.error('Error fetching team payments:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching payment records'
      });
    }
  });

  /**
   * Get payment summary totals by player for a team
   * 
   * This endpoint retrieves a summary of payments grouped by player for a team.
   * It calculates the total amount paid by each player, which is useful for
   * financial reporting and tracking payment status.
   * 
   * Authorization:
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: must have a child on the team
   * 
   * @route GET /api/teams/:teamId/payments/totals
   * @param teamId - The team ID to get payment totals for
   * @returns Array of objects containing player ID and total amount paid
   */
  app.get("/api/teams/:teamId/payments/totals", async (req, res) => {
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
          message: 'You do not have permission to view payment totals for this team'
        });
      }
      
      const totals = await storage.getPaymentSummaryByTeam(teamId);
      res.json(totals);
    } catch (err) {
      console.error('Error fetching payment totals:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching payment totals'
      });
    }
  });

  /**
   * Get payments for a specific player
   * 
   * This endpoint retrieves payment records for a specific player.
   * It provides a financial history for the player.
   * 
   * Authorization:
   * - User must be authenticated
   * - User must have the 'coach' role
   * - User must be the coach of the team
   * 
   * @route GET /api/teams/:teamId/payments/player/:playerId
   * @param teamId - The team ID the player belongs to
   * @param playerId - The player ID to get payments for
   * @returns Array of payment records for the specified player
   */
  app.get("/api/teams/:teamId/payments/player/:playerId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== "coach") {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in as a coach to view player payments'
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
          message: 'You do not have permission to view payments for this team'
        });
      }
      
      const player = await storage.getPlayer(playerId);
      if (!player || player.teamId !== teamId) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Player not found'
        });
      }
      
      const payments = await storage.getPaymentsByPlayerId(playerId);
      res.json(payments);
    } catch (err) {
      console.error('Error fetching player payments:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching payment records'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}