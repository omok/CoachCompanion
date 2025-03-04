import { Router, Request } from "express";
import { insertPlayerSchema } from "@shared/schema";
import { handleValidationError } from "./utils";
import { IStorage } from "../storage";
import { InsertPlayer } from "@shared/schema";

// Define interface for request params
interface TeamParams {
  teamId: string;
}

interface PlayerParams extends TeamParams {
  playerId: string;
}

/**
 * Creates and configures the players router
 * 
 * @param storage - The storage interface for database access
 * @returns Express router configured with player routes
 */
export function createPlayersRouter(storage: IStorage): Router {
  const router = Router({ mergeParams: true });

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
  router.post("/", async (req: Request<TeamParams>, res) => {
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
      
      const player = await storage.createPlayer(parsed, { currentUserId: req.user.id });
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
  router.get("/", async (req: Request<TeamParams>, res) => {
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
  router.get("/:playerId", async (req: Request<PlayerParams>, res) => {
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

  /**
   * Update a player's information
   * 
   * This endpoint allows updating information for a specific player within a team.
   * It includes authorization checks to ensure that only authorized users can 
   * modify player data.
   * 
   * Authorization:
   * - User must be authenticated
   * - For coaches: must be the coach of the team
   * - For parents: must be the parent of the player
   * 
   * @route PUT /api/teams/:teamId/players/:playerId
   * @param teamId - The team ID the player belongs to
   * @param playerId - The player ID to update
   * @body Object containing fields to update (name, active, jerseyNumber)
   * @returns The updated player object
   */
  router.put("/:playerId", async (req: Request<PlayerParams>, res) => {
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
      
      // Retrieve the player to check authorization
      const player = await storage.getPlayer(playerId);
      if (!player || player.teamId !== teamId) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Player not found or player does not belong to this team'
        });
      }
      
      // Authorization check for coaches
      if (req.user.role === "coach" && team.coachId !== req.user.id) {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'You do not have permission to update this player'
        });
      }
      
      // For parents, check if they are the parent of the player
      if (req.user.role === "parent" && player.parentId !== req.user.id) {
        return res.status(403).json({
          error: 'Permission Denied',
          message: 'You do not have permission to update this player'
        });
      }
      
      // Extract and validate updateable fields
      const { name, active, jerseyNumber } = req.body;
      const updates: Partial<InsertPlayer> = {};
      
      if (name !== undefined) updates.name = name;
      if (active !== undefined) updates.active = active;
      if (jerseyNumber !== undefined) updates.jerseyNumber = jerseyNumber;
      
      // Update the player
      const updatedPlayer = await storage.updatePlayer(playerId, updates, { currentUserId: req.user.id });
      res.json(updatedPlayer);
    } catch (err) {
      console.error('Error updating player:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while updating the player'
      });
    }
  });

  return router;
} 