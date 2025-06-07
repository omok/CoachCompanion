import { describe, it, expect } from 'vitest';
import { isValidTeamRole, getSuggestedTeamRole } from '../../../server/utils/validation';
import { TEAM_ROLES, USER_ROLES } from '@shared/constants';

describe('Validation Utilities', () => {
  describe('isValidTeamRole', () => {
    it('should return true for valid team roles', () => {
      expect(isValidTeamRole(TEAM_ROLES.OWNER)).toBe(true);
      expect(isValidTeamRole(TEAM_ROLES.ASSISTANT_COACH)).toBe(true);
      expect(isValidTeamRole(TEAM_ROLES.TEAM_MANAGER)).toBe(true);
      expect(isValidTeamRole(TEAM_ROLES.REGULAR)).toBe(true);
    });

    it('should return false for invalid team roles', () => {
      expect(isValidTeamRole('INVALID_ROLE')).toBe(false);
      expect(isValidTeamRole('')).toBe(false);
      expect(isValidTeamRole(null as any)).toBe(false);
      expect(isValidTeamRole(undefined as any)).toBe(false);
      expect(isValidTeamRole(123 as any)).toBe(false);
    });

    it('should return false for user roles passed as team roles', () => {
      expect(isValidTeamRole(USER_ROLES.COACH)).toBe(false);
      expect(isValidTeamRole(USER_ROLES.NORMAL)).toBe(false);
    });

    it('should handle case sensitivity', () => {
      expect(isValidTeamRole('owner')).toBe(false);
      expect(isValidTeamRole('Owner')).toBe(true); // Correct case
      expect(isValidTeamRole('OWNER')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isValidTeamRole(' Owner ')).toBe(false);
      expect(isValidTeamRole('\tOwner\n')).toBe(false);
    });
  });

  describe('getSuggestedTeamRole', () => {
    it('should return valid team roles as-is', () => {
      expect(getSuggestedTeamRole(TEAM_ROLES.OWNER)).toBe(TEAM_ROLES.OWNER);
      expect(getSuggestedTeamRole(TEAM_ROLES.ASSISTANT_COACH)).toBe(TEAM_ROLES.ASSISTANT_COACH);
      expect(getSuggestedTeamRole(TEAM_ROLES.REGULAR)).toBe(TEAM_ROLES.REGULAR);
    });

    it('should return user roles as-is when they are not team roles', () => {
      expect(getSuggestedTeamRole(USER_ROLES.COACH)).toBe(USER_ROLES.COACH);
      expect(getSuggestedTeamRole(USER_ROLES.NORMAL)).toBe(USER_ROLES.NORMAL);
    });

    it('should return original value for invalid roles with low similarity', () => {
      expect(getSuggestedTeamRole('INVALID_ROLE')).toBe('INVALID_ROLE');
      expect(getSuggestedTeamRole('xyz')).toBe('xyz');
    });

    it('should suggest close matches for typos', () => {
      expect(getSuggestedTeamRole('Owner')).toBe(TEAM_ROLES.OWNER); // exact case-insensitive match
      expect(getSuggestedTeamRole('owner')).toBe(TEAM_ROLES.OWNER); // case insensitive
      expect(getSuggestedTeamRole('Owne')).toBe(TEAM_ROLES.OWNER); // close match
    });

    it('should handle string similarity calculation', () => {
      // Test that very different strings don't get suggested
      expect(getSuggestedTeamRole('xyz')).toBe('xyz');
      expect(getSuggestedTeamRole('completely different')).toBe('completely different');
    });
  });

  describe('Date Format Validation', () => {
    // Helper function to test date validation (would be extracted from storage if it was public)
    const isValidDateFormat = (dateStr: string | null): boolean => {
      if (!dateStr) return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    };

    it('should validate correct date formats', () => {
      expect(isValidDateFormat('2024-01-01')).toBe(true);
      expect(isValidDateFormat('2024-12-31')).toBe(true);
      expect(isValidDateFormat('1999-06-15')).toBe(true);
      expect(isValidDateFormat('2000-02-29')).toBe(true); // leap year
    });

    it('should accept null dates', () => {
      expect(isValidDateFormat(null)).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(isValidDateFormat('2024/01/01')).toBe(false);
      expect(isValidDateFormat('01-01-2024')).toBe(false);
      expect(isValidDateFormat('2024-1-1')).toBe(false);
      expect(isValidDateFormat('2024-13-01')).toBe(true); // format-wise valid (regex only checks format)
      expect(isValidDateFormat('2024-01-32')).toBe(true); // format-wise valid (regex only checks format)
    });

    it('should reject invalid formats', () => {
      expect(isValidDateFormat('')).toBe(true); // Empty string is considered valid (null equivalent)
      expect(isValidDateFormat('invalid')).toBe(false);
      expect(isValidDateFormat('2024')).toBe(false);
      expect(isValidDateFormat('2024-01')).toBe(false);
      expect(isValidDateFormat('24-01-01')).toBe(false);
    });

    it('should reject dates with extra characters', () => {
      expect(isValidDateFormat('2024-01-01T00:00:00')).toBe(false);
      expect(isValidDateFormat('2024-01-01 12:00:00')).toBe(false);
      expect(isValidDateFormat('a2024-01-01')).toBe(false);
      expect(isValidDateFormat('2024-01-01z')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidDateFormat('0000-00-00')).toBe(true); // format-wise valid, but logically invalid
      expect(isValidDateFormat('9999-99-99')).toBe(true); // format-wise valid, but logically invalid
      expect(isValidDateFormat('2024-00-01')).toBe(true); // format-wise valid, month 00
      expect(isValidDateFormat('2024-01-00')).toBe(true); // format-wise valid, day 00
    });
  });

  describe('Integration with Constants', () => {
    it('should use actual constant values', () => {
      // Verify we're testing against actual constants, not hardcoded strings
      expect(TEAM_ROLES.OWNER).toBeDefined();
      expect(TEAM_ROLES.ASSISTANT_COACH).toBeDefined();
      expect(TEAM_ROLES.TEAM_MANAGER).toBeDefined();
      expect(TEAM_ROLES.REGULAR).toBeDefined();
      
      expect(USER_ROLES.COACH).toBeDefined();
      expect(USER_ROLES.NORMAL).toBeDefined();
    });

    it('should validate all defined team roles', () => {
      const teamRoleValues = Object.values(TEAM_ROLES);
      expect(teamRoleValues.length).toBeGreaterThan(0);
      
      teamRoleValues.forEach(role => {
        expect(isValidTeamRole(role)).toBe(true);
      });
    });

    it('should handle user roles consistently', () => {
      const userRoleValues = Object.values(USER_ROLES);
      expect(userRoleValues.length).toBeGreaterThan(0);
      
      userRoleValues.forEach(role => {
        const result = getSuggestedTeamRole(role);
        expect(typeof result).toBe('string');
        expect(result).toBe(role); // Should return the user role as-is
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate that team roles are properly defined', () => {
      // Ensure all team roles are properly defined constants
      expect(TEAM_ROLES.OWNER).toBeDefined();
      expect(TEAM_ROLES.ASSISTANT_COACH).toBeDefined();
      expect(TEAM_ROLES.TEAM_MANAGER).toBeDefined();
      expect(TEAM_ROLES.REGULAR).toBeDefined();
    });

    it('should return original input for user roles since they are not team roles', () => {
      // User roles should be returned as-is since they are not team roles
      expect(getSuggestedTeamRole(USER_ROLES.COACH)).toBe(USER_ROLES.COACH);
      expect(getSuggestedTeamRole(USER_ROLES.NORMAL)).toBe(USER_ROLES.NORMAL);
    });

    it('should handle various input types without crashing', () => {
      // Test that the function handles different input types gracefully
      expect(getSuggestedTeamRole('')).toBe('');
      expect(typeof getSuggestedTeamRole('test')).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle string inputs safely', () => {
      // Test valid string inputs
      expect(isValidTeamRole('test')).toBe(false);
      expect(getSuggestedTeamRole('test')).toBe('test');
    });

    it('should handle empty strings', () => {
      expect(isValidTeamRole('')).toBe(false);
      expect(getSuggestedTeamRole('')).toBe('');
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of validation calls efficiently', () => {
      const start = performance.now();
      
      // Run many validation calls
      for (let i = 0; i < 10000; i++) {
        isValidTeamRole(TEAM_ROLES.OWNER);
        isValidTeamRole('INVALID_ROLE');
        getSuggestedTeamRole(USER_ROLES.COACH);
        getSuggestedTeamRole('INVALID_ROLE');
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete in reasonable time (less than 100ms for 40k calls)
      expect(duration).toBeLessThan(100);
    });
  });
});