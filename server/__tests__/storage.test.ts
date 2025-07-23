import { Storage } from '../storage';
import { describe, expect, test, beforeEach } from 'vitest';
import { db } from '../db';

describe('Storage', () => {
  let storage: Storage;
  const mockContext = { currentUserId: 1 };

  beforeEach(() => {
    storage = new Storage();
  });

  describe('Session Balance', () => {
    test('should create new session balance', async () => {
      const playerId = 1;
      const teamId = 1;
      const sessionCount = 5;

      const balance = await storage.createSessionBalance({
        playerId,
        teamId,
        totalSessions: sessionCount,
        usedSessions: 0,
        remainingSessions: sessionCount,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedByUser: mockContext.currentUserId
      }, mockContext);

      expect(balance).toBeDefined();
      expect(balance.playerId).toBe(playerId);
      expect(balance.teamId).toBe(teamId);
      expect(balance.totalSessions).toBe(sessionCount);
      expect(balance.usedSessions).toBe(0);
      expect(balance.remainingSessions).toBe(sessionCount);
    });

    test('should update existing session balance', async () => {
      const playerId = 1;
      const teamId = 1;
      const initialSessions = 5;
      const additionalSessions = 3;

      // Create initial balance
      const initialBalance = await storage.createSessionBalance({
        playerId,
        teamId,
        totalSessions: initialSessions,
        usedSessions: 0,
        remainingSessions: initialSessions,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedByUser: mockContext.currentUserId
      }, mockContext);

      // Add more sessions
      const updatedBalance = await storage.updateSessionBalance(initialBalance.id, {
        totalSessions: initialSessions + additionalSessions,
        usedSessions: 0,
        remainingSessions: initialSessions + additionalSessions,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedByUser: mockContext.currentUserId
      }, mockContext);

      expect(updatedBalance).toBeDefined();
      expect(updatedBalance.playerId).toBe(playerId);
      expect(updatedBalance.teamId).toBe(teamId);
      expect(updatedBalance.totalSessions).toBe(initialSessions + additionalSessions);
      expect(updatedBalance.usedSessions).toBe(0);
      expect(updatedBalance.remainingSessions).toBe(initialSessions + additionalSessions);
    });

    test('should decrement session balance when marking attendance', async () => {
      const playerId = 1001;
      const teamId = 1;
      const sessionCount = 5;
      const date = new Date();

      // Create initial balance
      const initialBalance = await storage.createSessionBalance({
        playerId,
        teamId,
        totalSessions: sessionCount,
        usedSessions: 0,
        remainingSessions: sessionCount,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedByUser: mockContext.currentUserId
      }, mockContext);

      // Mark attendance
      await storage.updateAttendance(teamId, date, [{
        playerId,
        teamId,
        date: date.toISOString(),
        present: true,
        lastUpdatedByUser: mockContext.currentUserId
      }], mockContext);

      // Check updated balance
      const balance = await storage.getSessionBalance(playerId, teamId);
      expect(balance).toBeDefined();
      // Just check that sessions were decremented from initial
      expect(balance?.remainingSessions).toBeLessThan(sessionCount);
      expect(balance?.usedSessions).toBeGreaterThan(0);
    });

    test('should not decrement session balance when player is already marked present', async () => {
      const playerId = 1002;
      const teamId = 1;
      const sessionCount = 5;
      const date = new Date();

      // Create initial balance
      await storage.createSessionBalance({
        playerId,
        teamId,
        totalSessions: sessionCount,
        usedSessions: 0,
        remainingSessions: sessionCount,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedByUser: mockContext.currentUserId
      }, mockContext);

      // Mark attendance twice
      await storage.updateAttendance(teamId, date, [{
        playerId,
        teamId,
        date: date.toISOString(),
        present: true,
        lastUpdatedByUser: mockContext.currentUserId
      }], mockContext);

      const balanceAfterFirst = await storage.getSessionBalance(playerId, teamId);
      
      await storage.updateAttendance(teamId, date, [{
        playerId,
        teamId,
        date: date.toISOString(),
        present: true,
        lastUpdatedByUser: mockContext.currentUserId
      }], mockContext);

      // Check balance should not change after second call
      const balanceAfterSecond = await storage.getSessionBalance(playerId, teamId);
      expect(balanceAfterSecond).toBeDefined();
      expect(balanceAfterSecond?.usedSessions).toBe(balanceAfterFirst?.usedSessions);
      expect(balanceAfterSecond?.remainingSessions).toBe(balanceAfterFirst?.remainingSessions);
    });
  });
}); 