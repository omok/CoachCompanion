import { Response } from "express";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { Player } from "@shared/schema";

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
export const handleValidationError = (err: unknown, res: Response) => {
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
    message: 'An unexpected error occurred'
  });
};

/**
 * Checks if a user has access to a team
 * 
 * This function determines if a user has access to a team based on their role:
 * - Coaches can access teams they coach
 * - Normal users can access teams their children are on
 * 
 * @param userId - The user's ID
 * @param teamId - The team's ID
 * @param userRole - The user's role (Coach or Normal)
 * @param storage - The storage interface for database access
 * @returns Promise resolving to a boolean indicating if the user has access
 */
export const hasTeamAccess = async (
  userId: number,
  teamId: number,
  userRole: string,
  storage: any
): Promise<boolean> => {
  if (userRole === "Coach") {
    const team = await storage.getTeamById(teamId);
    return team?.coachId === userId;
  } else if (userRole === "Normal") {
    const children = await storage.getPlayersByParentId(userId);
    return children.some((child: Player) => child.teamId === teamId);
  }
  return false;
};

/**
 * Gets the teams that a user has access to based on their role
 * 
 * This is a helper function to determine which teams a user can access:
 * - Coaches can access teams they coach
 * - Normal users can access teams their children are on
 * 
 * @param userId - The ID of the user
 * @param userRole - The user's role (Coach or Normal)
 * @param storage - The storage interface for database operations
 * @returns Promise resolving to an array of team IDs
 */
export async function getUserTeamIds(
  userId: number,
  userRole: string,
  storage: IStorage
): Promise<number[]> {
  try {
    let teamIds: number[] = [];
    
    if (userRole === "Coach") {
      const teams = await storage.getTeamsByCoachId(userId);
      teamIds = teams.map(team => team.id);
    } else if (userRole === "Normal") {
      const children = await storage.getPlayersByParentId(userId);
      const childTeamIds = children.map(child => child.teamId);
      teamIds = [...new Set(childTeamIds)];
    }
    
    return teamIds;
  } catch (error) {
    Logger.error('Error getting user team IDs', { userId, userRole, error });
    return [];
  }
} 