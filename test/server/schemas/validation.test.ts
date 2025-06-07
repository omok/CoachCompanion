import { describe, it, expect } from 'vitest';
import {
  insertUserSchema,
  insertTeamSchema,
  insertTeamMemberSchema,
  insertPlayerSchema,
  insertAttendanceSchema,
  insertPracticeNoteSchema,
  insertPaymentSchema,
  insertSessionBalanceSchema,
  insertSessionTransactionSchema,
  updateUserProfileSchema
} from '../../../shared/schema';
import { USER_ROLES, TEAM_ROLES } from '../../../shared/constants';

describe('Schema Validation Tests', () => {
  describe('insertUserSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        role: USER_ROLES.COACH
      };

      const result = insertUserSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it('should reject invalid role', () => {
      const invalidUser = {
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        role: 'InvalidRole'
      };

      expect(() => insertUserSchema.parse(invalidUser)).toThrow();
    });

    it('should require minimum username length', () => {
      const invalidUser = {
        username: 'ab', // Too short
        password: 'password123',
        name: 'Test User',
        role: USER_ROLES.COACH
      };

      expect(() => insertUserSchema.parse(invalidUser)).toThrow();
    });

    it('should require minimum password length', () => {
      const invalidUser = {
        username: 'testuser',
        password: '12345', // Too short
        name: 'Test User',
        role: USER_ROLES.COACH
      };

      expect(() => insertUserSchema.parse(invalidUser)).toThrow();
    });

    it('should require name field', () => {
      const invalidUser = {
        username: 'testuser',
        password: 'password123',
        name: '', // Empty name
        role: USER_ROLES.COACH
      };

      expect(() => insertUserSchema.parse(invalidUser)).toThrow();
    });

    it('should accept optional id field', () => {
      const validUser = {
        id: 1,
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        role: USER_ROLES.NORMAL
      };

      const result = insertUserSchema.parse(validUser);
      expect(result.id).toBe(1);
    });
  });

  describe('insertTeamSchema', () => {
    it('should validate correct team data', () => {
      const validTeam = {
        name: 'Test Team',
        coachId: 1,
        description: 'A test team',
        feeType: 'fixed' as const,
        teamFee: '50.00'
      };

      const result = insertTeamSchema.parse(validTeam);
      expect(result.name).toBe('Test Team');
      expect(result.coachId).toBe(1);
      expect(result.feeType).toBe('fixed');
    });

    it('should handle prepaid fee type', () => {
      const validTeam = {
        name: 'Test Team',
        coachId: 1,
        feeType: 'prepaid' as const
      };

      const result = insertTeamSchema.parse(validTeam);
      expect(result.feeType).toBe('prepaid');
    });

    it('should default fee type to fixed', () => {
      const validTeam = {
        name: 'Test Team',
        coachId: 1
      };

      const result = insertTeamSchema.parse(validTeam);
      expect(result.feeType).toBe('fixed');
    });

    it('should transform and validate team fee', () => {
      const validTeam = {
        name: 'Test Team',
        coachId: 1,
        teamFee: '25.50'
      };

      const result = insertTeamSchema.parse(validTeam);
      expect(result.teamFee).toBe(25.50);
    });

    it('should reject negative team fee', () => {
      const invalidTeam = {
        name: 'Test Team',
        coachId: 1,
        teamFee: '-10.00'
      };

      expect(() => insertTeamSchema.parse(invalidTeam)).toThrow();
    });

    it('should handle date transformations', () => {
      const validTeam = {
        name: 'Test Team',
        coachId: 1,
        seasonStartDate: '2024-01-01',
        seasonEndDate: '2024-12-31'
      };

      const result = insertTeamSchema.parse(validTeam);
      expect(result.seasonStartDate).toBeInstanceOf(Date);
      expect(result.seasonEndDate).toBeInstanceOf(Date);
    });

    it('should handle optional fields', () => {
      const minimalTeam = {
        name: 'Test Team',
        coachId: 1
      };

      const result = insertTeamSchema.parse(minimalTeam);
      expect(result.description).toBeUndefined();
      expect(result.seasonStartDate).toBeUndefined();
      expect(result.seasonEndDate).toBeUndefined();
    });
  });

  describe('insertTeamMemberSchema', () => {
    it('should validate correct team member data', () => {
      const validMember = {
        teamId: 1,
        userId: 2,
        role: TEAM_ROLES.ASSISTANT_COACH,
        isOwner: false
      };

      const result = insertTeamMemberSchema.parse(validMember);
      expect(result).toEqual(validMember);
    });

    it('should default isOwner to false', () => {
      const validMember = {
        teamId: 1,
        userId: 2,
        role: TEAM_ROLES.REGULAR
      };

      const result = insertTeamMemberSchema.parse(validMember);
      expect(result.isOwner).toBe(false);
    });

    it('should validate all team roles', () => {
      Object.values(TEAM_ROLES).forEach(role => {
        const validMember = {
          teamId: 1,
          userId: 2,
          role
        };

        const result = insertTeamMemberSchema.parse(validMember);
        expect(result.role).toBe(role);
      });
    });

    it('should reject invalid team role', () => {
      const invalidMember = {
        teamId: 1,
        userId: 2,
        role: 'InvalidRole'
      };

      expect(() => insertTeamMemberSchema.parse(invalidMember)).toThrow();
    });

    it('should validate owner role with isOwner true', () => {
      const validOwner = {
        teamId: 1,
        userId: 2,
        role: TEAM_ROLES.OWNER,
        isOwner: true
      };

      const result = insertTeamMemberSchema.parse(validOwner);
      expect(result.role).toBe(TEAM_ROLES.OWNER);
      expect(result.isOwner).toBe(true);
    });
  });

  describe('insertPlayerSchema', () => {
    it('should validate correct player data', () => {
      const validPlayer = {
        name: 'John Doe',
        teamId: 1,
        parentId: 2,
        active: true,
        jerseyNumber: '10'
      };

      const result = insertPlayerSchema.parse(validPlayer);
      expect(result).toEqual(validPlayer);
    });

    it('should handle optional fields', () => {
      const minimalPlayer = {
        name: 'John Doe',
        teamId: 1,
        parentId: 2
      };

      const result = insertPlayerSchema.parse(minimalPlayer);
      expect(result.active).toBeUndefined();
      expect(result.jerseyNumber).toBeUndefined();
    });

    it('should accept optional id for updates', () => {
      const playerWithId = {
        id: 1,
        name: 'John Doe',
        teamId: 1,
        parentId: 2
      };

      const result = insertPlayerSchema.parse(playerWithId);
      expect(result.id).toBe(1);
    });

    it('should require name field', () => {
      const invalidPlayer = {
        teamId: 1,
        parentId: 2
      };

      expect(() => insertPlayerSchema.parse(invalidPlayer)).toThrow();
    });
  });

  describe('insertAttendanceSchema', () => {
    it('should validate correct attendance data', () => {
      const validAttendance = {
        playerId: 1,
        teamId: 1,
        date: '2024-01-01',
        present: true
      };

      const result = insertAttendanceSchema.parse(validAttendance);
      expect(result.playerId).toBe(1);
      expect(result.teamId).toBe(1);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.present).toBe(true);
    });

    it('should transform date string to Date object', () => {
      const validAttendance = {
        playerId: 1,
        teamId: 1,
        date: '2024-06-15T10:30:00.000Z',
        present: false
      };

      const result = insertAttendanceSchema.parse(validAttendance);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.present).toBe(false);
    });

    it('should accept optional id field', () => {
      const attendanceWithId = {
        id: 1,
        playerId: 1,
        teamId: 1,
        date: '2024-01-01',
        present: true
      };

      const result = insertAttendanceSchema.parse(attendanceWithId);
      expect(result.id).toBe(1);
    });

    it('should require all main fields', () => {
      const invalidAttendance = {
        playerId: 1,
        date: '2024-01-01'
        // Missing teamId and present
      };

      expect(() => insertAttendanceSchema.parse(invalidAttendance)).toThrow();
    });
  });

  describe('insertPracticeNoteSchema', () => {
    it('should validate correct practice note data', () => {
      const validNote = {
        teamId: 1,
        coachId: 1,
        practiceDate: '2024-01-01',
        notes: 'Great practice today!',
        playerIds: [1, 2, 3]
      };

      const result = insertPracticeNoteSchema.parse(validNote);
      expect(result.teamId).toBe(1);
      expect(result.coachId).toBe(1);
      expect(result.practiceDate).toBeInstanceOf(Date);
      expect(result.notes).toBe('Great practice today!');
      expect(result.playerIds).toEqual([1, 2, 3]);
    });

    it('should default playerIds to empty array', () => {
      const validNote = {
        teamId: 1,
        coachId: 1,
        practiceDate: '2024-01-01',
        notes: 'Great practice today!'
      };

      const result = insertPracticeNoteSchema.parse(validNote);
      expect(result.playerIds).toEqual([]);
    });

    it('should transform practice date', () => {
      const validNote = {
        teamId: 1,
        coachId: 1,
        practiceDate: '2024-06-15T14:30:00.000Z',
        notes: 'Practice notes'
      };

      const result = insertPracticeNoteSchema.parse(validNote);
      expect(result.practiceDate).toBeInstanceOf(Date);
    });

    it('should require all main fields', () => {
      const invalidNote = {
        teamId: 1,
        practiceDate: '2024-01-01'
        // Missing coachId and notes
      };

      expect(() => insertPracticeNoteSchema.parse(invalidNote)).toThrow();
    });
  });

  describe('insertPaymentSchema', () => {
    it('should validate correct payment data', () => {
      const validPayment = {
        playerId: 1,
        teamId: 1,
        amount: '50.00',
        date: '2024-01-01',
        notes: 'Monthly fee'
      };

      const result = insertPaymentSchema.parse(validPayment);
      expect(result.playerId).toBe(1);
      expect(result.teamId).toBe(1);
      expect(result.amount).toBe(50.00);
      expect(result.notes).toBe('Monthly fee');
    });

    it('should transform amount string to number', () => {
      const validPayment = {
        playerId: 1,
        teamId: 1,
        amount: '25.50',
        date: '2024-01-01'
      };

      const result = insertPaymentSchema.parse(validPayment);
      expect(result.amount).toBe(25.50);
    });

    it('should validate positive amounts only', () => {
      const invalidPayment = {
        playerId: 1,
        teamId: 1,
        amount: '-10.00',
        date: '2024-01-01'
      };

      expect(() => insertPaymentSchema.parse(invalidPayment)).toThrow();
    });

    it('should validate amount precision (cents)', () => {
      const validPayment = {
        playerId: 1,
        teamId: 1,
        amount: '25.99',
        date: '2024-01-01'
      };

      const result = insertPaymentSchema.parse(validPayment);
      expect(result.amount).toBe(25.99);
    });

    it('should reject amounts with too many decimal places', () => {
      const invalidPayment = {
        playerId: 1,
        teamId: 1,
        amount: '25.999', // Too many decimals
        date: '2024-01-01'
      };

      expect(() => insertPaymentSchema.parse(invalidPayment)).toThrow();
    });

    it('should handle prepaid session fields', () => {
      const validPayment = {
        playerId: 1,
        teamId: 1,
        amount: '100.00',
        date: '2024-01-01',
        addPrepaidSessions: true,
        sessionCount: 10
      };

      const result = insertPaymentSchema.parse(validPayment);
      expect(result.addPrepaidSessions).toBe(true);
      expect(result.sessionCount).toBe(10);
    });

    it('should handle Date object for date field', () => {
      const validPayment = {
        playerId: 1,
        teamId: 1,
        amount: '50.00',
        date: new Date('2024-01-01')
      };

      const result = insertPaymentSchema.parse(validPayment);
      expect(result.date).toBeInstanceOf(Date);
    });
  });

  describe('insertSessionBalanceSchema', () => {
    it('should validate correct session balance data', () => {
      const validBalance = {
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 3,
        remainingSessions: 7
      };

      const result = insertSessionBalanceSchema.parse(validBalance);
      expect(result).toEqual(validBalance);
    });

    it('should default usedSessions to undefined when not provided', () => {
      const validBalance = {
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        remainingSessions: 10
      };

      const result = insertSessionBalanceSchema.parse(validBalance);
      expect(result.usedSessions).toBeUndefined();
    });

    it('should require positive totalSessions', () => {
      const invalidBalance = {
        playerId: 1,
        teamId: 1,
        totalSessions: 0, // Must be positive
        remainingSessions: 0
      };

      expect(() => insertSessionBalanceSchema.parse(invalidBalance)).toThrow();
    });

    it('should allow zero remainingSessions', () => {
      const validBalance = {
        playerId: 1,
        teamId: 1,
        totalSessions: 5,
        remainingSessions: 0
      };

      const result = insertSessionBalanceSchema.parse(validBalance);
      expect(result.remainingSessions).toBe(0);
    });

    it('should handle expiration date', () => {
      const validBalance = {
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        remainingSessions: 7,
        expirationDate: '2024-12-31'
      };

      const result = insertSessionBalanceSchema.parse(validBalance);
      expect(result.expirationDate).toBeDefined();
    });
  });

  describe('insertSessionTransactionSchema', () => {
    it('should validate correct session transaction data', () => {
      const validTransaction = {
        playerId: 1,
        teamId: 1,
        date: '2024-01-01',
        sessionChange: -1,
        reason: 'attendance',
        notes: 'Present at practice'
      };

      const result = insertSessionTransactionSchema.parse(validTransaction);
      expect(result.playerId).toBe(1);
      expect(result.sessionChange).toBe(-1);
      expect(result.reason).toBe('attendance');
    });

    it('should handle positive session changes', () => {
      const validTransaction = {
        playerId: 1,
        teamId: 1,
        date: '2024-01-01',
        sessionChange: 10,
        reason: 'purchase'
      };

      const result = insertSessionTransactionSchema.parse(validTransaction);
      expect(result.sessionChange).toBe(10);
    });

    it('should handle Date object for date field', () => {
      const validTransaction = {
        playerId: 1,
        teamId: 1,
        date: new Date('2024-01-01'),
        sessionChange: 5,
        reason: 'adjustment'
      };

      const result = insertSessionTransactionSchema.parse(validTransaction);
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should handle optional reference IDs', () => {
      const validTransaction = {
        playerId: 1,
        teamId: 1,
        date: '2024-01-01',
        sessionChange: -1,
        reason: 'attendance',
        paymentId: 123,
        attendanceId: 456
      };

      const result = insertSessionTransactionSchema.parse(validTransaction);
      expect(result.paymentId).toBe(123);
      expect(result.attendanceId).toBe(456);
    });

    it('should require integer session changes', () => {
      const invalidTransaction = {
        playerId: 1,
        teamId: 1,
        date: '2024-01-01',
        sessionChange: 1.5, // Must be integer
        reason: 'purchase'
      };

      expect(() => insertSessionTransactionSchema.parse(invalidTransaction)).toThrow();
    });
  });

  describe('updateUserProfileSchema', () => {
    it('should validate correct user profile update data', () => {
      const validUpdate = {
        id: 1,
        name: 'Updated Name',
        username: 'updated_username',
        role: 'Coach'
      };

      const result = updateUserProfileSchema.parse(validUpdate);
      expect(result).toEqual(validUpdate);
    });

    it('should handle optional password update', () => {
      const validUpdate = {
        id: 1,
        name: 'Updated Name',
        username: 'updated_username',
        password: 'newpassword123',
        role: 'Coach'
      };

      const result = updateUserProfileSchema.parse(validUpdate);
      expect(result.password).toBe('newpassword123');
    });

    it('should enforce minimum lengths', () => {
      const invalidUpdate = {
        id: 1,
        name: 'A', // Too short
        username: 'ab', // Too short
        role: 'Coach'
      };

      expect(() => updateUserProfileSchema.parse(invalidUpdate)).toThrow();
    });

    it('should require all main fields', () => {
      const invalidUpdate = {
        id: 1,
        name: 'Valid Name'
        // Missing username and role
      };

      expect(() => updateUserProfileSchema.parse(invalidUpdate)).toThrow();
    });

    it('should enforce password minimum length when provided', () => {
      const invalidUpdate = {
        id: 1,
        name: 'Updated Name',
        username: 'updated_username',
        password: '12345', // Too short
        role: 'Coach'
      };

      expect(() => updateUserProfileSchema.parse(invalidUpdate)).toThrow();
    });
  });

  describe('Schema Integration Tests', () => {
    it('should validate complex team creation scenario', () => {
      const teamData = {
        name: 'Elite Basketball Team',
        coachId: 1,
        description: 'Competitive basketball team for advanced players',
        seasonStartDate: '2024-09-01',
        seasonEndDate: '2025-06-01',
        feeType: 'prepaid' as const,
        teamFee: '150.00'
      };

      const result = insertTeamSchema.parse(teamData);
      expect(result.name).toBe('Elite Basketball Team');
      expect(result.feeType).toBe('prepaid');
      expect(result.teamFee).toBe(150.00);
      expect(result.seasonStartDate).toBeInstanceOf(Date);
      expect(result.seasonEndDate).toBeInstanceOf(Date);
    });

    it('should validate complete payment with sessions scenario', () => {
      const paymentData = {
        playerId: 1,
        teamId: 1,
        amount: '200.00',
        date: new Date(),
        notes: 'Monthly payment with 20 sessions',
        addPrepaidSessions: true,
        sessionCount: 20
      };

      const result = insertPaymentSchema.parse(paymentData);
      expect(result.amount).toBe(200.00);
      expect(result.addPrepaidSessions).toBe(true);
      expect(result.sessionCount).toBe(20);
    });

    it('should validate team member hierarchy', () => {
      const ownerData = {
        teamId: 1,
        userId: 1,
        role: TEAM_ROLES.OWNER,
        isOwner: true
      };

      const assistantData = {
        teamId: 1,
        userId: 2,
        role: TEAM_ROLES.ASSISTANT_COACH
      };

      const ownerResult = insertTeamMemberSchema.parse(ownerData);
      const assistantResult = insertTeamMemberSchema.parse(assistantData);

      expect(ownerResult.role).toBe(TEAM_ROLES.OWNER);
      expect(ownerResult.isOwner).toBe(true);
      expect(assistantResult.role).toBe(TEAM_ROLES.ASSISTANT_COACH);
      expect(assistantResult.isOwner).toBe(false);
    });
  });
});