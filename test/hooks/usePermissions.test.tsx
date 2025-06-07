import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from '../../client/src/hooks/usePermissions';
import { useAuth } from '../../client/src/hooks/use-auth';
import { useTeamMember } from '../../client/src/hooks/useTeamMember';
import { USER_ROLES, TEAM_ROLES } from '@shared/constants';
import { USER_ROLE_PERMISSIONS, TEAM_ROLE_PERMISSIONS } from '@shared/access-control';

// Mock the auth and team member hooks
vi.mock('../../client/src/hooks/use-auth');
vi.mock('../../client/src/hooks/useTeamMember');

const mockUseAuth = vi.mocked(useAuth);
const mockUseTeamMember = vi.mocked(useTeamMember);

describe('usePermissions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Role Permissions', () => {
    it('should allow coaches to create teams', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'coach', role: USER_ROLES.COACH },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canCreateTeam).toBe(true);
      expect(result.current.hasUserRolePermission(USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM)).toBe(true);
    });

    it('should not allow normal users to create teams', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 2, username: 'parent', role: USER_ROLES.NORMAL },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canCreateTeam).toBe(false);
      expect(result.current.hasUserRolePermission(USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM)).toBe(false);
    });

    it('should handle no user (unauthenticated)', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canCreateTeam).toBe(false);
      expect(result.current.hasUserRolePermission(USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM)).toBe(false);
    });

    it('should allow coaches to be invited as assistant coaches', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'coach', role: USER_ROLES.COACH },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canBeInvitedAsAssistantCoach).toBe(true);
    });
  });

  describe('Team Role Permissions', () => {
    const mockUser = { id: 1, username: 'coach', role: USER_ROLES.COACH };

    it('should give team owners all permissions', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [{
          teamId: 1,
          userId: 1,
          role: TEAM_ROLES.OWNER,
          isOwner: true
        }],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canSeeTeamRoster(1)).toBe(true);
      expect(result.current.canAddPlayer(1)).toBe(true);
      expect(result.current.canTakeAttendance(1)).toBe(true);
      expect(result.current.canAddPracticeNote(1)).toBe(true);
      expect(result.current.canManagePayments(1)).toBe(true);
      expect(result.current.canManageTeamSettings(1)).toBe(true);
    });

    it('should allow assistant coaches appropriate permissions', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [{
          teamId: 1,
          userId: 1,
          role: TEAM_ROLES.ASSISTANT_COACH,
          isOwner: false
        }],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canSeeTeamRoster(1)).toBe(true);
      expect(result.current.canAddPlayer(1)).toBe(true);
      expect(result.current.canTakeAttendance(1)).toBe(true);
      expect(result.current.canAddPracticeNote(1)).toBe(true);
      expect(result.current.canManagePayments(1)).toBe(false);
      expect(result.current.canManageTeamSettings(1)).toBe(false);
    });

    it('should limit regular members to viewing only', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 2, username: 'parent', role: USER_ROLES.NORMAL },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [{
          teamId: 1,
          userId: 2,
          role: TEAM_ROLES.REGULAR,
          isOwner: false
        }],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canSeeTeamRoster(1)).toBe(true);
      expect(result.current.canAddPlayer(1)).toBe(false);
      expect(result.current.canTakeAttendance(1)).toBe(false);
      expect(result.current.canAddPracticeNote(1)).toBe(false);
      expect(result.current.canManagePayments(1)).toBe(false);
      expect(result.current.canManageTeamSettings(1)).toBe(false);
    });

    it('should deny access to users not on the team', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [], // User not on any teams
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canSeeTeamRoster(1)).toBe(false);
      expect(result.current.canAddPlayer(1)).toBe(false);
      expect(result.current.canTakeAttendance(1)).toBe(false);
      expect(result.current.canAddPracticeNote(1)).toBe(false);
      expect(result.current.canManagePayments(1)).toBe(false);
      expect(result.current.canManageTeamSettings(1)).toBe(false);
    });

    it('should handle multiple team memberships correctly', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [
          {
            teamId: 1,
            userId: 1,
            role: TEAM_ROLES.OWNER,
            isOwner: true
          },
          {
            teamId: 2,
            userId: 1,
            role: TEAM_ROLES.ASSISTANT_COACH,
            isOwner: false
          },
          {
            teamId: 3,
            userId: 1,
            role: TEAM_ROLES.REGULAR,
            isOwner: false
          }
        ],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      // Team 1 - Owner permissions
      expect(result.current.canManageTeamSettings(1)).toBe(true);
      expect(result.current.canAddPlayer(1)).toBe(true);

      // Team 2 - Assistant Coach permissions
      expect(result.current.canTakeAttendance(2)).toBe(true);
      expect(result.current.canManageTeamSettings(2)).toBe(false);

      // Team 3 - Regular member permissions
      expect(result.current.canSeeTeamRoster(3)).toBe(true);
      expect(result.current.canAddPlayer(3)).toBe(false);

      // Team 4 - Not a member
      expect(result.current.canSeeTeamRoster(4)).toBe(false);
    });
  });

  describe('Loading States', () => {
    it('should handle loading state for team membership', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'coach', role: USER_ROLES.COACH },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [],
        isLoading: true
      });

      const { result } = renderHook(() => usePermissions());

      // Should allow basic viewing while loading
      expect(result.current.canSeeTeamRoster(1)).toBe(true);
      // Should not allow management actions while loading
      expect(result.current.canAddPlayer(1)).toBe(false);
      expect(result.current.canManageTeamSettings(1)).toBe(false);
    });

    it('should transition from loading to actual permissions', async () => {
      const mockUser = { id: 1, username: 'coach', role: USER_ROLES.COACH };
      
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });

      // Start with loading state
      mockUseTeamMember.mockReturnValue({
        teamMembership: [],
        isLoading: true
      });

      const { result, rerender } = renderHook(() => usePermissions());

      // Initially loading - basic permissions only
      expect(result.current.canSeeTeamRoster(1)).toBe(true);
      expect(result.current.canAddPlayer(1)).toBe(false);

      // Simulate loading complete with team membership
      mockUseTeamMember.mockReturnValue({
        teamMembership: [{
          teamId: 1,
          userId: 1,
          role: TEAM_ROLES.OWNER,
          isOwner: true
        }],
        isLoading: false
      });

      rerender();

      // Now should have full permissions
      expect(result.current.canSeeTeamRoster(1)).toBe(true);
      expect(result.current.canAddPlayer(1)).toBe(true);
      expect(result.current.canManageTeamSettings(1)).toBe(true);
    });
  });

  describe('Direct Permission Methods', () => {
    it('should correctly use hasTeamRolePermission method directly', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'coach', role: USER_ROLES.COACH },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [{
          teamId: 1,
          userId: 1,
          role: TEAM_ROLES.ASSISTANT_COACH,
          isOwner: false
        }],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(
        result.current.hasTeamRolePermission(1, TEAM_ROLE_PERMISSIONS.TAKE_ATTENDANCE)
      ).toBe(true);
      expect(
        result.current.hasTeamRolePermission(1, TEAM_ROLE_PERMISSIONS.MANAGE_TEAM_SETTINGS)
      ).toBe(false);
    });

    it('should correctly use hasUserRolePermission method directly', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'coach', role: USER_ROLES.COACH },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(
        result.current.hasUserRolePermission(USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM)
      ).toBe(true);
      expect(
        result.current.hasUserRolePermission(USER_ROLE_PERMISSIONS.CAN_BE_INVITED_AS_ASSISTANT_COACH)
      ).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined team membership', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'coach', role: USER_ROLES.COACH },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: undefined as any,
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canSeeTeamRoster(1)).toBe(false);
      expect(result.current.canAddPlayer(1)).toBe(false);
    });

    it('should handle invalid user roles gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'user', role: 'INVALID_ROLE' as any },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canCreateTeam).toBe(false);
      expect(result.current.hasUserRolePermission(USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM)).toBe(false);
    });

    it('should handle invalid team roles gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: 'user', role: USER_ROLES.COACH },
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn()
      });
      mockUseTeamMember.mockReturnValue({
        teamMembership: [{
          teamId: 1,
          userId: 1,
          role: 'INVALID_TEAM_ROLE' as any,
          isOwner: false
        }],
        isLoading: false
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.canSeeTeamRoster(1)).toBe(false);
      expect(result.current.canAddPlayer(1)).toBe(false);
    });
  });
});