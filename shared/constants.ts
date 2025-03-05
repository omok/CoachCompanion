/**
 * User roles in the system
 * These roles determine what a user can do at the application level
 */
export const USER_ROLES = {
  COACH: 'Coach',
  PARENT: 'Parent',
} as const;

/**
 * Team member roles
 * These roles determine what a member can do within a team
 */
export const TEAM_ROLES = {
  OWNER: 'Owner',
  ASSISTANT_COACH: 'AssistantCoach',
  TEAM_MANAGER: 'TeamManager',
  PARENT: 'Parent',
} as const;

// Type definitions for type safety
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type TeamRole = typeof TEAM_ROLES[keyof typeof TEAM_ROLES]; 