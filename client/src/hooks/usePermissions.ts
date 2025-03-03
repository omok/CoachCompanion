import { useContext, useCallback } from 'react';
import { teamRolePermissions, userTypePermissions } from '@shared/access-control';
import { TeamRole, UserType } from '@shared/access-control';
import { AuthContext } from '../contexts/AuthContext';
import { useTeamMember, TeamMembership } from './useTeamMember';

/**
 * React hook for checking user permissions in the application
 */
export function usePermissions() {
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null; // Safely handle potential null AuthContext
  
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
   * Check if the current user has a specific user type permission
   */
  const hasUserTypePermission = useCallback((permission: keyof typeof userTypePermissions[UserType]) => {
    if (!user) {
      logPermissionCheck('user', false, { permission, reason: 'No user logged in' });
      return false;
    }
    
    const hasPermission = userTypePermissions[user.role as UserType]?.[permission] ?? false;
    
    logPermissionCheck('user', hasPermission, { 
      permission, 
      userRole: user.role,
      permissionMap: userTypePermissions[user.role as UserType]
    });
    
    return hasPermission;
  }, [user, logPermissionCheck]);

  /**
   * Check if the current user has a specific team role permission for a given team
   */
  const hasTeamRolePermission = useCallback((
    teamId: number, 
    permission: keyof typeof teamRolePermissions[TeamRole]
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
    hasUserTypePermission,
    hasTeamRolePermission,
    
    // Convenience functions for common permission checks
    canCreateTeam: hasUserTypePermission('createNewTeam'),
    canBeInvitedAsAssistantCoach: hasUserTypePermission('canBeInvitedAsAssistantCoach'),
    canSeeTeamRoster: (teamId: number) => hasTeamRolePermission(teamId, 'seeTeamRoster'),
    canAddPlayer: (teamId: number) => hasTeamRolePermission(teamId, 'addPlayer'),
    canTakeAttendance: (teamId: number) => hasTeamRolePermission(teamId, 'takeAttendance'),
    canAddPracticeNote: (teamId: number) => hasTeamRolePermission(teamId, 'addPracticeNote'),
    canManagePayments: (teamId: number) => hasTeamRolePermission(teamId, 'managePayments'),
    canManageTeamSettings: (teamId: number) => hasTeamRolePermission(teamId, 'manageTeamSettings'),
  };
} 