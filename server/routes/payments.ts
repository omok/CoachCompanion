import { Router, Request } from "express";
import { insertPaymentSchema } from "@shared/schema";
import { handleValidationError } from "./utils";
import { IStorage } from "../storage";
import { Logger } from "../logger";

// Validate date format - YYYY-MM-DD
function isValidDateFormat(dateStr: string | null): boolean {
  if (!dateStr) return true; // null is valid
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// Format dates in payment data to YYYY-MM-DD strings for client
function formatPaymentDatesForClient(payments: any[]) {
  return payments.map(payment => {
    // If the date is already a string in YYYY-MM-DD format, return as is
    if (typeof payment.date === 'string' && isValidDateFormat(payment.date)) {
      return payment;
    }
    
    // Convert Date objects to YYYY-MM-DD format
    const dateObj = payment.date instanceof Date ? payment.date : new Date(payment.date);
    // Use ISO string and take first 10 chars (YYYY-MM-DD)
    // This avoids timezone issues by taking only the date part
    const dateString = dateObj.toISOString().split('T')[0];
        
    return {
      ...payment,
      date: dateString
    };
  });
}

// Define interface for request params
interface TeamParams {
  teamId: string;
}

interface PlayerParams extends TeamParams {
  playerId: string;
}

/**
 * Creates and configures the payments router
 * 
 * @param storage - The storage interface for database access
 * @returns Express router configured with payment routes
 */
export function createPaymentsRouter(storage: IStorage): Router {
  const router = Router({ mergeParams: true });

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
  router.post("/", async (req: Request<TeamParams>, res) => {
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
      
      // Validate date format before parsing
      if (!isValidDateFormat(req.body.date)) {
        Logger.warn(`Invalid date format received: ${req.body.date}`);
        return res.status(400).json({
          error: 'Invalid Format',
          message: 'Date must be in YYYY-MM-DD format'
        });
      }
      
      const parsed = insertPaymentSchema.parse({
        ...req.body,
        teamId,
      });
      
      Logger.info(`Creating payment record: ${JSON.stringify({
        playerId: parsed.playerId,
        teamId: parsed.teamId,
        amount: parsed.amount,
        date: parsed.date,
        hasNotes: !!parsed.notes
      })}`);
      
      // Create a Date object from the YYYY-MM-DD string
      // Use noon UTC to avoid timezone issues
      const dateValue = new Date(`${parsed.date}T12:00:00Z`);
      Logger.info(`Converted payment date string '${parsed.date}' to Date: ${dateValue.toISOString()}`);
      
      const payment = await storage.createPayment({
        ...parsed,
        date: dateValue
      });
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
          message: 'You do not have permission to view payments for this team'
        });
      }
      
      const payments = await storage.getPaymentsByTeamId(teamId);
      // Format dates before sending to client
      const formattedPayments = formatPaymentDatesForClient(payments);
      res.json(formattedPayments);
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
  router.get("/totals", async (req: Request<TeamParams>, res) => {
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
  router.get("/player/:playerId", async (req: Request<PlayerParams>, res) => {
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
      // Format dates before sending to client
      const formattedPayments = formatPaymentDatesForClient(payments);
      res.json(formattedPayments);
    } catch (err) {
      console.error('Error fetching player payments:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching payment records'
      });
    }
  });

  return router;
} 