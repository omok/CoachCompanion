/**
 * Access Control Configuration
 * 
 * This module defines the permissions for different user types and team roles.
 * It serves as the SINGLE SOURCE OF TRUTH for all permission-related data in the application.
 * 
 * IMPORTANT: When updating permissions, ONLY this file needs to be modified.
 * All application components using these permissions will automatically reflect the changes.
 */

/**
 * User Types in the system
 */
export type UserType = 'Coach' | 'Parent';

/**
 * Roles a user can have within a team
 */
export type TeamRole = 'Owner' | 'AssistantCoach' | 'TeamManager' | 'Parent';

/**
 * Permissions available to different user types
 */
export interface UserTypePermissions {
  /** Can create a new team (and become its owner) */
  createNewTeam: boolean;
  /** Can be invited to join a team as an assistant coach */
  canBeInvitedAsAssistantCoach: boolean;
}

/**
 * Permissions available to different team roles
 */
export interface TeamRolePermissions {
  /** Can view the team's roster of players */
  seeTeamRoster: boolean;
  /** Can add new players to the team */
  addPlayer: boolean;
  /** Can record attendance for practice sessions */
  takeAttendance: boolean;
  /** Can add practice notes for the team or individual players */
  addPracticeNote: boolean;
  /** Can manage payments and financial records */
  managePayments: boolean;
  /** Can invite new members to the team (coaches, managers, etc.) */
  inviteTeamMembers: boolean;
  /** Can remove members from the team */
  removeTeamMembers: boolean;
  /** Can delete the entire team */
  deleteTeam: boolean;
  /** Can access and modify team settings (name, dates, fees, etc.) */
  manageTeamSettings: boolean;
}

/**
 * Permission configuration for User Types
 * 
 * This object defines what permissions each user type has in the system.
 * 
 * ---------------------------------------------------------
 * | Permission                 | Coach | Parent           |
 * ---------------------------------------------------------
 * | createNewTeam              |   ✓   |   ✗              |
 * | canBeInvitedAsAssistantCoach |   ✓   |   ✗            |
 * ---------------------------------------------------------
 */
export const userTypePermissions: Record<UserType, UserTypePermissions> = {
  Coach: {
    createNewTeam: true,
    canBeInvitedAsAssistantCoach: true,
  },
  Parent: {
    createNewTeam: false,
    canBeInvitedAsAssistantCoach: false,
  },
};

/**
 * Permission configuration for Team Roles
 * 
 * This object defines what permissions each team role has within a team.
 * 
 * ------------------------------------------------------------------------------------
 * | Permission        | Owner | AssistantCoach | TeamManager | Parent               |
 * ------------------------------------------------------------------------------------
 * | seeTeamRoster     |   ✓   |       ✓        |      ✓      |   ✓                  |
 * | addPlayer         |   ✓   |       ✓        |      ✓      |   ✗                  |
 * | takeAttendance    |   ✓   |       ✓        |      ✓      |   ✗                  |
 * | addPracticeNote   |   ✓   |       ✓        |      ✗      |   ✗                  |
 * | managePayments    |   ✓   |       ✗        |      ✓      |   ✗                  |
 * | inviteTeamMembers |   ✓   |       ✗        |      ✗      |   ✗                  |
 * | removeTeamMembers |   ✓   |       ✗        |      ✗      |   ✗                  |
 * | deleteTeam        |   ✓   |       ✗        |      ✗      |   ✗                  |
 * | manageTeamSettings|   ✓   |       ✗        |      ✓      |   ✗                  |
 * ------------------------------------------------------------------------------------
 */
export const teamRolePermissions: Record<TeamRole, TeamRolePermissions> = {
  Owner: {
    seeTeamRoster: true,
    addPlayer: true,
    takeAttendance: true,
    addPracticeNote: true,
    managePayments: true,
    inviteTeamMembers: true,
    removeTeamMembers: true,
    deleteTeam: true,
    manageTeamSettings: true,
  },
  AssistantCoach: {
    seeTeamRoster: true,
    addPlayer: true,
    takeAttendance: true,
    addPracticeNote: true,
    managePayments: false,
    inviteTeamMembers: false,
    removeTeamMembers: false,
    deleteTeam: false,
    manageTeamSettings: false,
  },
  TeamManager: {
    seeTeamRoster: true,
    addPlayer: true,
    takeAttendance: true,
    addPracticeNote: false,
    managePayments: true,
    inviteTeamMembers: false,
    removeTeamMembers: false,
    deleteTeam: false,
    manageTeamSettings: true,
  },
  Parent: {
    seeTeamRoster: true,
    addPlayer: false,
    takeAttendance: false,
    addPracticeNote: false,
    managePayments: false,
    inviteTeamMembers: false,
    removeTeamMembers: false,
    deleteTeam: false,
    manageTeamSettings: false,
  },
};

/**
 * Check if a user type has a specific permission
 * 
 * @param userType The type of user (Coach or Parent)
 * @param permission The permission to check
 * @returns Whether the user type has the requested permission
 */
export function userTypeHasPermission(userType: UserType, permission: keyof UserTypePermissions): boolean {
  return userTypePermissions[userType][permission];
}

/**
 * Check if a team role has a specific permission
 * 
 * @param role The team role (Owner, AssistantCoach, TeamManager, or Parent)
 * @param permission The permission to check
 * @returns Whether the team role has the requested permission
 */
export function teamRoleHasPermission(role: TeamRole, permission: keyof TeamRolePermissions): boolean {
  return teamRolePermissions[role][permission];
}

/**
 * How to Update Permissions:
 * 
 * To update a permission:
 * 1. Find the appropriate object (userTypePermissions or teamRolePermissions)
 * 2. Locate the user type or team role you want to modify
 * 3. Change the boolean value for the permission
 * 
 * Example:
 * ```
 * // To allow AssistantCoach to manage payments:
 * export const teamRolePermissions: Record<TeamRole, TeamRolePermissions> = {
 *   // ...other roles
 *   AssistantCoach: {
 *     // ...other permissions
 *     managePayments: true, // Changed from false to true
 *   },
 *   // ...other roles
 * };
 * ```
 * 
 * All components using this permission system will automatically reflect this change.
 */ 