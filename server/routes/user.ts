import { Router } from "express";
import { updateUserProfileSchema } from "@shared/schema";
import { handleValidationError } from "./utils";
import { IStorage } from "../storage";
import { Logger } from "../logger";

/**
 * Creates and configures the user router
 * 
 * @param storage - The storage interface for database access
 * @returns Express router configured with user routes
 */
export function createUserRouter(storage: IStorage): Router {
  const router = Router();

  /**
   * Update user profile
   * 
   * This endpoint allows users to update their own profile information.
   * Password is only updated if provided in the request.
   * 
   * Authorization:
   * - User must be authenticated
   * 
   * @route PUT /api/user/profile
   * @body name - User's full name
   * @body username - User's username
   * @body password - Optional new password
   * @body role - User's role
   * @returns Updated user object
   */
  router.put("/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({
          error: 'Authentication Required',
          message: 'You must be logged in to update your profile'
        });
      }

      const userId = req.user.id;
      
      // Get current user to validate the request
      const currentUser = await storage.getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }
      
      // Parse and validate the request
      const updateData = { ...req.body, id: userId };
      const result = updateUserProfileSchema.safeParse(updateData);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid profile data',
          details: result.error.errors
        });
      }
      
      // Update the user profile
      const parsed = result.data;
      Logger.info(`Updating user profile for user ${userId}`, { 
        name: parsed.name,
        username: parsed.username,
        hasPassword: !!parsed.password,
        role: parsed.role
      });
      
      // Use the existing password if a new one isn't provided
      if (!parsed.password) {
        delete parsed.password;
      }
      
      const updatedUser = await storage.updateUser(parsed, { currentUserId: userId });
      
      // Return the user without the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (err) {
      Logger.error('Error updating user profile:', err);
      handleValidationError(err, res);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while updating your profile'
      });
    }
  });

  return router;
} 