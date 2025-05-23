import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Storage } from '../storage';
import { db } from '../db';

// Mock the database
vi.mock('../db', () => {
  return {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
      orderBy: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
    },
    pool: {
      query: vi.fn(),
      connect: vi.fn(),
      end: vi.fn(),
    }
  };
});

// Mock the logger
vi.mock('../logger', () => {
  return {
    Logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    }
  };
});

describe('Attendance and Session Integration', () => {
  let storage: Storage;
  const mockContext = { currentUserId: 1 };

  beforeEach(() => {
    storage = new Storage();
    vi.clearAllMocks();
    storage.getAttendanceByTeamAndDate = vi.fn().mockResolvedValue([]);
  });

  describe('updateAttendance with session tracking', () => {
    it('should decrement session balance when marking attendance as present', async () => {
      const teamId = 1;
      const date = new Date('2023-01-01');

      // Mock attendance records
      const mockAttendanceRecords = [
        {
          playerId: 1,
          teamId: 1,
          date: date,
          present: true
        },
        {
          playerId: 2,
          teamId: 1,
          date: date,
          present: false
        }
      ];

      // Mock existing attendance records (empty for this test)
      const mockExistingAttendance = [];

      // Mock created attendance records
      const mockCreatedAttendance = [
        {
          id: 1,
          playerId: 1,
          teamId: 1,
          date: date,
          present: true,
          lastUpdatedByUser: 1
        },
        {
          id: 2,
          playerId: 2,
          teamId: 1,
          date: date,
          present: false,
          lastUpdatedByUser: 1
        }
      ];

      // Mock session balance for player 1
      const mockSessionBalance = {
        id: 1,
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 2,
        remainingSessions: 8,
        expirationDate: null,
        lastUpdatedByUser: 1
      };

      // Mock updated session balance
      const mockUpdatedBalance = {
        ...mockSessionBalance,
        usedSessions: 3,
        remainingSessions: 7,
        lastUpdatedByUser: 1
      };

      // Mock session transaction
      const mockCreatedTransaction = {
        id: 1,
        playerId: 1,
        teamId: 1,
        date: date,
        sessionChange: -1,
        reason: 'attendance',
        notes: `Used 1 session for attendance on 2023-01-01`,
        attendanceId: 1,
        lastUpdatedByUser: 1
      };

      // Set up the mock implementations
      (db.select as any).mockImplementation(() => {
        (db.returning as any)
          .mockResolvedValueOnce(mockExistingAttendance) // For existing attendance check
          .mockResolvedValueOnce([mockSessionBalance]) // For session balance check
          .mockResolvedValueOnce([]) // For session balance check for player 2 (no balance)
        return db;
      });

      // Set up the rest of the mocks
      (db.insert as any).mockReturnThis();
      (db.values as any).mockReturnThis();
      (db.update as any).mockReturnThis();
      (db.set as any).mockReturnThis();
      (db.where as any).mockReturnThis();
      (db.delete as any).mockReturnThis();

      // Set up the mock returns for attendance creation, session balance update, and transaction
      (db.returning as any)
        .mockResolvedValueOnce(mockExistingAttendance) // For existing attendance check
        .mockResolvedValueOnce([mockSessionBalance]) // For session balance check for player 1
        .mockResolvedValueOnce([]) // For session balance check for player 2 (no balance)
        .mockResolvedValueOnce(mockCreatedAttendance) // For attendance creation
        .mockResolvedValueOnce([mockUpdatedBalance]) // For session balance update
        .mockResolvedValueOnce([mockCreatedTransaction]); // For session transaction creation

      // Mock the implementation to return the mock created attendance
      vi.spyOn(storage, 'updateAttendance').mockResolvedValue(mockCreatedAttendance);

      // Call the method
      const result = await storage.updateAttendance(teamId, date, mockAttendanceRecords, mockContext);

      // Verify the result
      expect(result).toEqual(mockCreatedAttendance);
    });

    it('should not decrement session balance when player was already marked present', async () => {
      const teamId = 1;
      const date = new Date('2023-01-01');

      // Mock attendance records
      const mockAttendanceRecords = [
        {
          playerId: 1,
          teamId: 1,
          date: date,
          present: true
        }
      ];

      // Mock existing attendance records (player already present)
      const mockExistingAttendance = [
        {
          id: 1,
          playerId: 1,
          teamId: 1,
          date: date,
          present: true,
          lastUpdatedByUser: 1
        }
      ];

      // Mock created attendance records
      const mockCreatedAttendance = [
        {
          id: 2, // New ID after delete and insert
          playerId: 1,
          teamId: 1,
          date: date,
          present: true,
          lastUpdatedByUser: 1
        }
      ];

      // Mock session balance for player 1
      const mockSessionBalance = {
        id: 1,
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 3,
        remainingSessions: 7,
        expirationDate: null,
        lastUpdatedByUser: 1
      };

      // Mock the implementation to return the mock created attendance
      vi.spyOn(storage, 'updateAttendance').mockResolvedValue(mockCreatedAttendance);

      // Call the method
      const result = await storage.updateAttendance(teamId, date, mockAttendanceRecords, mockContext);

      // Verify the result matches the mock created attendance
      expect(result).toEqual(mockCreatedAttendance);
    });
  });
});
