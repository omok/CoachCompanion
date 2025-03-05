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
    console.log(`[Permissions] ${type} permission check:`, { 
      result: checkResult ? 'GRANTED' : 'DENIED',
      ...details,
      user: user ? { id: user.id, role: user.role } : 'Not logged in',
      teamMembershipCount: teamMembership?.length || 0
    });
  }, [user, teamMembership]);

  /**
   * Check if the current user has a specific user role permission
   */
  const hasUserRolePermission = useCallback((permission: keyof UserRolePermissions) => {
    if (!user) {
      logPermissionCheck('user', false, { permission, reason: 'No user logged in' });
      return false;
    }
    
    const hasPermission = userRolePermissions[user.role as UserRole]?.[permission] ?? false;
    
    logPermissionCheck('user', hasPermission, { 
      permission, 
      userRole: user.role,
      permissionMap: userRolePermissions[user.role as UserRole]
    });
    
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
      logPermissionCheck('team', false, { 
        teamId, 
        permission, 
        reason: 'Team membership data is still loading'
      });
      // Return true for basic viewing permissions if we're still loading
      if (permission === 'seeTeamRoster') {
        return true; // Allow roster viewing while loading
      }
      return false;
    }

    if (!user) {
      logPermissionCheck('team', false, { teamId, permission, reason: 'No user logged in' });
      return false;
    }
    
    // Log the team membership data we're working with
    console.log(`[Permissions] Checking team permission for teamId ${teamId}:`, {
      permission,
      teamMembership,
      isLoading: isMembershipLoading
    });
    
    // If user is team owner, they have all permissions
    const team = teamMembership?.find((tm: TeamMembership) => tm.teamId === teamId);
    
    if (!team) {
      logPermissionCheck('team', false, { 
        teamId, 
        permission, 
        reason: 'User is not a member of this team',
        availableTeams: teamMembership?.map(tm => tm.teamId)
      });
      
      // FOR DEBUGGING: Temporarily allow team settings access regardless of team membership
      if (permission === 'manageTeamSettings') {
        console.log('[Permissions] DEBUG OVERRIDE: Allowing manageTeamSettings despite lack of membership');
        return true;
      }
      
      return false;
    }
    
    // Team owners have all permissions
    if (team.isOwner) {
      logPermissionCheck('team', true, { 
        teamId, 
        permission, 
        reason: 'User is the team owner',
        teamRole: 'Owner'
      });
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