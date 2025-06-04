import { Router } from "express";
import type { Request } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { insertSessionBalanceSchema, insertSessionTransactionSchema } from "@shared/schema";
import { handleValidationError } from "./utils";
import { IStorage } from "../storage";
import { Logger } from "../logger";
import { requireTeamRolePermission } from '../utils/authorization';
import { TEAM_PERMISSION_KEYS } from '@shared/access-control';

// Validate date format - YYYY-MM-DD
function isValidDateFormat(dateStr: string | null): boolean {
  if (!dateStr) return true; // null is valid
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// Helper function to ensure date is a Date object
function ensureDate(date: string | Date): Date {
  if (typeof date === 'string') {
    return new Date(date);
  }
  return date;
}

// Format dates for client consumption
function formatDateForClient(date: Date | string | null): string | null {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString(); // Return full ISO string
}

// Format session balance for client
function formatSessionBalanceForClient(balance: any) {
  if (!balance) return null;
  
  return {
    ...balance,
    expirationDate: formatDateForClient(balance.expirationDate)
  };
}

// Format session transactions for client
function formatSessionTransactionsForClient(transactions: any[]) {
  if (!transactions || !transactions.length) return [];
  
  // Sort transactions by date in descending order
  const sortedTransactions = transactions.sort((a, b) => {
    const dateA = ensureDate(a.date).getTime();
    const dateB = ensureDate(b.date).getTime();
    return dateB - dateA;
  });

  return sortedTransactions.map(transaction => ({
    ...transaction,
    date: formatDateForClient(transaction.date) // This will now use the updated formatDateForClient
  }));
}

interface TeamParams extends ParamsDictionary {
  teamId: string;
}

interface PlayerParams extends TeamParams {
  playerId: string;
}

export function createSessionsRouter(storage: IStorage) {
  const router = Router({ mergeParams: true });

  /**
   * Get session balance for a player
   * 
   * @route GET /api/teams/:teamId/players/:playerId/sessions
   * @param teamId - The team ID
   * @param playerId - The player ID
   * @returns The session balance for the player
   */
  router.get("/:playerId", requireTeamRolePermission(TEAM_PERMISSION_KEYS.VIEW_TEAM), async (req: Request<PlayerParams>, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to view session balances'
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
      
      // Verify player belongs to team
      const player = await storage.getPlayer(playerId);
      if (!player || player.teamId !== teamId) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Player not found in this team'
        });
      }
      
      // Get session balance
      const sessionBalance = await storage.getSessionBalance(playerId, teamId);
      
      // Get session transactions
      const sessionTransactions = await storage.getSessionTransactionsByPlayerId(playerId, teamId);
      
      res.json({
        balance: formatSessionBalanceForClient(sessionBalance),
        transactions: formatSessionTransactionsForClient(sessionTransactions)
      });
    } catch (err) {
      Logger.error('Error fetching session balance:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching session balance'
      });
    }
  });

  /**
   * Get all session balances for a team
   * 
   * @route GET /api/teams/:teamId/sessions
   * @param teamId - The team ID
   * @returns All session balances for the team
   */
  router.get("/", requireTeamRolePermission(TEAM_PERMISSION_KEYS.VIEW_TEAM), async (req: Request<TeamParams>, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to view session balances'
        });
      }

      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(teamId)) {
        return res.status(400).json({
          error: 'Invalid Request',
          message: 'Team ID must be a valid number'
        });
      }
      
      // Get all session balances for the team
      const sessionBalances = await storage.getSessionBalancesByTeamId(teamId);
      
      // Format for client
      const formattedBalances = sessionBalances.map(formatSessionBalanceForClient);
      
      res.json(formattedBalances);
    } catch (err) {
      Logger.error('Error fetching team session balances:', err);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching session balances'
      });
    }
  });

  /**
   * Update session balance for a player
   * 
   * @route PUT /api/teams/:teamId/players/:playerId/sessions
   * @param teamId - The team ID
   * @param playerId - The player ID
   * @param body - The session balance update data
   * @returns The updated session balance
   */
  router.put("/:playerId", requireTeamRolePermission(TEAM_PERMISSION_KEYS.MANAGE_PAYMENTS), async (req: Request<PlayerParams>, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to update session balances'
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
      
      // Verify player belongs to team
      const player = await storage.getPlayer(playerId);
      if (!player || player.teamId !== teamId) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Player not found in this team'
        });
      }
      
      // Validate expiration date format if provided
      if (req.body.expirationDate && !isValidDateFormat(req.body.expirationDate)) {
        return res.status(400).json({
          error: 'Invalid Format',
          message: 'Expiration date must be in YYYY-MM-DD format'
        });
      }
      
      // Get existing session balance
      const existingBalance = await storage.getSessionBalance(playerId, teamId);
      
      if (!existingBalance) {
        // Create new balance if it doesn't exist
        const newBalance = insertSessionBalanceSchema.parse({
          ...req.body,
          playerId,
          teamId
        });
        
        const sessionBalance = await storage.createSessionBalance(newBalance, { currentUserId: req.user.id });
        
        // Record transaction if session count changed
        if (newBalance.totalSessions > 0) {
          await storage.addSessionTransaction({
            playerId,
            teamId,
            date: new Date(),
            sessionChange: newBalance.totalSessions,
            reason: 'adjustment',
            notes: `Manual adjustment: Added ${newBalance.totalSessions} sessions`
          }, { currentUserId: req.user.id });
        }
        
        res.status(201).json(formatSessionBalanceForClient(sessionBalance));
      } else {
        // Calculate session change
        const sessionChange = (req.body.remainingSessions || 0) - existingBalance.remainingSessions;
        
        // Update existing balance
        const updatedBalance = await storage.updateSessionBalance(existingBalance.id, req.body, { currentUserId: req.user.id });
        
        // Record transaction if session count changed
        if (sessionChange !== 0) {
          await storage.addSessionTransaction({
            playerId,
            teamId,
            date: new Date(),
            sessionChange,
            reason: 'adjustment',
            notes: `Manual adjustment: ${sessionChange > 0 ? 'Added' : 'Removed'} ${Math.abs(sessionChange)} sessions`
          }, { currentUserId: req.user.id });
        }
        
        res.json(formatSessionBalanceForClient(updatedBalance));
      }
    } catch (err) {
      handleValidationError(err, res);
    }
  });

  return router;
}
