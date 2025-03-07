/**
 * Access Control Configuration
 * 
 * This module defines the permissions for different user types and team roles.
 * It serves as the SINGLE SOURCE OF TRUTH for all permission-related data in the application.
 * 
 * IMPORTANT: When updating permissions, ONLY this file needs to be modified.
 * All application components using these permissions will automatically reflect the changes.
 */

import { USER_ROLES, TEAM_ROLES, type UserRole, type TeamRole } from './constants';

/**
 * Constants for user role permissions
 * Use these instead of string literals to prevent typos
 */
export const USER_ROLE_PERMISSIONS = {
  CREATE_NEW_TEAM: 'createNewTeam',
  CAN_BE_INVITED_AS_ASSISTANT_COACH: 'canBeInvitedAsAssistantCoach',
} as const;

/**
 * Constants for team role permission values
 * These are the actual values stored in the database
 */
export const TEAM_ROLE_PERMISSIONS = {
  SEE_TEAM_ROSTER: 'seeTeamRoster',
  ADD_PLAYER: 'addPlayer',
  TAKE_ATTENDANCE: 'takeAttendance',
  ADD_PRACTICE_NOTE: 'addPracticeNote',
  MANAGE_PAYMENTS: 'managePayments',
  INVITE_TEAM_MEMBERS: 'inviteTeamMembers',
  REMOVE_TEAM_MEMBERS: 'removeTeamMembers',
  DELETE_TEAM: 'deleteTeam',
  MANAGE_TEAM_SETTINGS: 'manageTeamSettings',
} as const;

/**
 * Constants for team role permission keys
 * Use these in middleware calls to prevent typos
 */
export const TEAM_PERMISSION_KEYS = {
  SEE_TEAM_ROSTER: 'SEE_TEAM_ROSTER',
  ADD_PLAYER: 'ADD_PLAYER',
  TAKE_ATTENDANCE: 'TAKE_ATTENDANCE',
  ADD_PRACTICE_NOTE: 'ADD_PRACTICE_NOTE',
  MANAGE_PAYMENTS: 'MANAGE_PAYMENTS',
  INVITE_TEAM_MEMBERS: 'INVITE_TEAM_MEMBERS',
  REMOVE_TEAM_MEMBERS: 'REMOVE_TEAM_MEMBERS',
  DELETE_TEAM: 'DELETE_TEAM',
  MANAGE_TEAM_SETTINGS: 'MANAGE_TEAM_SETTINGS',
} as const;

/**
 * Type for team role permission keys
 * Use this type for middleware that expects permission keys
 */
export type TeamRolePermissionKey = keyof typeof TEAM_ROLE_PERMISSIONS;

/**
 * Permissions available to different user roles
 */
export interface UserRolePermissions {
  /** Can create a new team (and become its owner) */
  [USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM]: boolean;
  /** Can be invited to join a team as an assistant coach */
  [USER_ROLE_PERMISSIONS.CAN_BE_INVITED_AS_ASSISTANT_COACH]: boolean;
}

/**
 * Permissions available to different team roles
 */
export interface TeamRolePermissions {
  /** Can view the team's roster of players */
  [TEAM_ROLE_PERMISSIONS.SEE_TEAM_ROSTER]: boolean;
  /** Can add new players to the team */
  [TEAM_ROLE_PERMISSIONS.ADD_PLAYER]: boolean;
  /** Can record attendance for practice sessions */
  [TEAM_ROLE_PERMISSIONS.TAKE_ATTENDANCE]: boolean;
  /** Can add practice notes for the team or individual players */
  [TEAM_ROLE_PERMISSIONS.ADD_PRACTICE_NOTE]: boolean;
  /** Can manage payments and financial records */
  [TEAM_ROLE_PERMISSIONS.MANAGE_PAYMENTS]: boolean;
  /** Can invite new members to the team (coaches, managers, etc.) */
  [TEAM_ROLE_PERMISSIONS.INVITE_TEAM_MEMBERS]: boolean;
  /** Can remove members from the team */
  [TEAM_ROLE_PERMISSIONS.REMOVE_TEAM_MEMBERS]: boolean;
  /** Can delete the entire team */
  [TEAM_ROLE_PERMISSIONS.DELETE_TEAM]: boolean;
  /** Can access and modify team settings (name, dates, fees, etc.) */
  [TEAM_ROLE_PERMISSIONS.MANAGE_TEAM_SETTINGS]: boolean;
}

/**
 * Permission configuration for User Roles
 * 
 * This object defines what permissions each user role has in the system.
 * 
 * ---------------------------------------------------------
 * | Permission                 | Coach | Parent           |
 * ---------------------------------------------------------
 * | createNewTeam              |   ✓   |   ✗              |
 * | canBeInvitedAsAssistantCoach |   ✓   |   ✗            |
 * ---------------------------------------------------------
 */
export const userRolePermissions: Record<UserRole, UserRolePermissions> = {
  [USER_ROLES.COACH]: {
    [USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM]: true,
    [USER_ROLE_PERMISSIONS.CAN_BE_INVITED_AS_ASSISTANT_COACH]: true,
  },
  [USER_ROLES.PARENT]: {
    [USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM]: false,
    [USER_ROLE_PERMISSIONS.CAN_BE_INVITED_AS_ASSISTANT_COACH]: false,
  },
};

/**
 * Permission configuration for Team Roles
 * 
 * This object defines what permissions each team role has within a team.
 * 
 * ------------------------------------------------------------------------------------
 * | Permission        | Owner | AssistantCoach | TeamManager | Regular               |
 * ------------------------------------------------------------------------------------
 * | seeTeamRoster     |   ✓   |       ✓        |      ✓      |   ✓                  |
 * | addPlayer         |   ✓   |       ✓        |      ✓      |   ✗                  |
 * | takeAttendance    |   ✓   |       ✓        |      ✓      |   ✗                  |
 * | addPracticeNote   |   ✓   |       ✓        |      ✗      |   ✗                  |
 * | managePayments    |   ✓   |       ✗        |      ✓      |   ✗                  |
 * | inviteTeamMembers |   ✓   |       ✗        |      ✗      |   ✗                  |
 * | removeTeamMembers |   ✓   |       ✗        |      ✗      |   ✗                  |
 * | deleteTeam        |   ✓   |       ✗        |      ✗      |   ✗                  |
 * | manageTeamSettings|   ✓   |       ✗        |      ✗      |   ✗                  |
 * ------------------------------------------------------------------------------------
 */
export const teamRolePermissions: Record<TeamRole, TeamRolePermissions> = {
  [TEAM_ROLES.OWNER]: {
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
  [TEAM_ROLES.ASSISTANT_COACH]: {
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
  [TEAM_ROLES.TEAM_MANAGER]: {
    seeTeamRoster: true,
    addPlayer: true,
    takeAttendance: true,
    addPracticeNote: false,
    managePayments: true,
    inviteTeamMembers: false,
    removeTeamMembers: false,
    deleteTeam: false,
    manageTeamSettings: false,
  },
  [TEAM_ROLES.REGULAR]: {
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
 * Check if a user role has a specific permission
 * 
 * @param userRole The role of the user (Coach or Parent)
 * @param permission The permission to check from USER_ROLE_PERMISSIONS
 * @returns Whether the user role has the requested permission
 */
export function userRoleHasPermission(
  userRole: UserRole, 
  permission: typeof USER_ROLE_PERMISSIONS[keyof typeof USER_ROLE_PERMISSIONS]
): boolean {
  return userRolePermissions[userRole][permission];
}

/**
 * Check if a team role has a specific permission
 * 
 * @param role The team role (Owner, AssistantCoach, TeamManager, or Regular)
 * @param permission The permission key to check
 * @returns boolean indicating if the role has the permission
 */
export function teamRoleHasPermission(role: TeamRole, permission: keyof TeamRolePermissions): boolean {
  return teamRolePermissions[role][permission];
}

/**
 * How to Update Permissions:
 * 
 * To update a permission:
 * 1. Find the appropriate object (userRolePermissions or teamRolePermissions)
 * 2. Locate the user role or team role you want to modify
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