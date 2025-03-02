import { useContext } from 'react';
import { teamRolePermissions, userTypePermissions } from '@shared/access-control';
import { TeamRole, UserType } from '@shared/access-control';
import { AuthContext } from '../contexts/AuthContext';
import { useTeamMember, TeamMembership } from './useTeamMember';

/**
 * React hook for checking user permissions in the application
 */
export function usePermissions() {
  const { user } = useContext(AuthContext);
  const { teamMembership } = useTeamMember();

  /**
   * Check if the current user has a specific user type permission
   */
  const hasUserTypePermission = (permission: keyof typeof userTypePermissions[UserType]) => {
    if (!user) return false;
    return userTypePermissions[user.role as UserType]?.[permission] ?? false;
  };

  /**
   * Check if the current user has a specific team role permission for a given team
   */
  const hasTeamRolePermission = (
    teamId: number, 
    permission: keyof typeof teamRolePermissions[TeamRole]
  ) => {
    if (!user) return false;
    
    // If user is team owner, they have all permissions
    const team = teamMembership?.find((tm: TeamMembership) => tm.teamId === teamId);
    if (!team) return false;
    
    // Team owners have all permissions
    if (team.isOwner) return true;
    
    // Otherwise, check the specific permission for their role
    return teamRolePermissions[team.role as TeamRole]?.[permission] ?? false;
  };

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
  };
} 