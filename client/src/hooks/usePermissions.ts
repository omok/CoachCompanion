import { useContext, useCallback } from 'react';
import { 
  teamRolePermissions, 
  userRolePermissions, 
  USER_ROLE_PERMISSIONS, 
  TEAM_ROLE_PERMISSIONS,
  type UserRolePermissions,
  type TeamRolePermissions
} from '@shared/access-control';
import { TeamRole, UserRole } from '@shared/constants';
import { AuthContext } from '../contexts/AuthContext';
import { useTeamMember, TeamMembership } from './useTeamMember';

/**
 * React hook for checking user permissions in the application
 */
export function usePermissions() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  
  const { teamMembership, isLoading: isMembershipLoading } = useTeamMember();

  // Log permission check attempts with detailed information
  const logPermissionCheck = useCallback((
    type: 'user' | 'team', 
    checkResult: boolean, 
    details: any
  ) => {
  }, [user, teamMembership]);

  /**
   * Check if the current user has a specific user role permission
   */
  const hasUserRolePermission = useCallback((permission: keyof UserRolePermissions) => {
    if (!user) {
      return false;
    }
    
    const hasPermission = userRolePermissions[user.role as UserRole]?.[permission] ?? false;
    
    return hasPermission;
  }, [user, logPermissionCheck]);

  /**
   * Check if the current user has a specific team role permission for a given team
   */
  const hasTeamRolePermission = useCallback((
    teamId: number, 
    permission: keyof TeamRolePermissions
  ) => {
    // Special handling for when we're still loading team membership data
    if (isMembershipLoading) {
      // Return true for basic viewing permissions if we're still loading
      if (permission === 'seeTeamRoster') {
        return true; // Allow roster viewing while loading
      }
      return false;
    }

    if (!user) {
      return false;
    }
    
    // If user is team owner, they have all permissions
    const team = teamMembership?.find((tm: TeamMembership) => tm.teamId === teamId);
    
    if (!team) {      
      return false;
    }
    
    // Team owners have all permissions
    if (team.isOwner) {
      return true;
    }
    
    // Otherwise, check the specific permission for their role
    const hasPermission = teamRolePermissions[team.role as TeamRole]?.[permission] ?? false;
    
    logPermissionCheck('team', hasPermission, { 
      teamId,
      permission, 
      teamRole: team.role,
      permissionMap: teamRolePermissions[team.role as TeamRole]
    });
    
    return hasPermission;
  }, [user, teamMembership, isMembershipLoading, logPermissionCheck]);

  return {
    hasUserRolePermission,
    hasTeamRolePermission,
    
    // Convenience functions for common permission checks
    canCreateTeam: hasUserRolePermission(USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM),
    canBeInvitedAsAssistantCoach: hasUserRolePermission(USER_ROLE_PERMISSIONS.CAN_BE_INVITED_AS_ASSISTANT_COACH),
    canSeeTeamRoster: (teamId: number) => hasTeamRolePermission(teamId, TEAM_ROLE_PERMISSIONS.SEE_TEAM_ROSTER),
    canAddPlayer: (teamId: number) => hasTeamRolePermission(teamId, TEAM_ROLE_PERMISSIONS.ADD_PLAYER),
    canTakeAttendance: (teamId: number) => hasTeamRolePermission(teamId, TEAM_ROLE_PERMISSIONS.TAKE_ATTENDANCE),
    canAddPracticeNote: (teamId: number) => hasTeamRolePermission(teamId, TEAM_ROLE_PERMISSIONS.ADD_PRACTICE_NOTE),
    canManagePayments: (teamId: number) => hasTeamRolePermission(teamId, TEAM_ROLE_PERMISSIONS.MANAGE_PAYMENTS),
    canManageTeamSettings: (teamId: number) => hasTeamRolePermission(teamId, TEAM_ROLE_PERMISSIONS.MANAGE_TEAM_SETTINGS),
  };
} 