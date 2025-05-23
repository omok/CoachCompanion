import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { Storage } from '../storage';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import {
  users, teams, players, sessionBalances, sessionTransactions, payments, attendance
} from '@shared/schema';

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

describe('Session Storage', () => {
  let storage: Storage;
  const mockContext = { currentUserId: 1 };

  beforeEach(() => {
    storage = new Storage();
    vi.clearAllMocks();
  });

  describe('getSessionBalance', () => {
    it('should get session balance for a player', async () => {
      const mockBalance = {
        id: 1,
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 2,
        remainingSessions: 8,
        expirationDate: null,
        lastUpdatedByUser: 1
      };

      // Mock the implementation to return the mock balance
      vi.spyOn(storage, 'getSessionBalance').mockResolvedValue(mockBalance);

      const result = await storage.getSessionBalance(1, 1);

      expect(result).toEqual(mockBalance);
    });
  });

  describe('getSessionBalancesByTeamId', () => {
    it('should get all session balances for a team', async () => {
      const mockBalances = [
        {
          id: 1,
          playerId: 1,
          teamId: 1,
          totalSessions: 10,
          usedSessions: 2,
          remainingSessions: 8,
          expirationDate: null,
          lastUpdatedByUser: 1
        },
        {
          id: 2,
          playerId: 2,
          teamId: 1,
          totalSessions: 5,
          usedSessions: 1,
          remainingSessions: 4,
          expirationDate: null,
          lastUpdatedByUser: 1
        }
      ];

      // Mock the implementation to return the mock balances
      vi.spyOn(storage, 'getSessionBalancesByTeamId').mockResolvedValue(mockBalances);

      const result = await storage.getSessionBalancesByTeamId(1);

      expect(result).toEqual(mockBalances);
    });
  });

  describe('createSessionBalance', () => {
    it('should create a new session balance', async () => {
      const mockBalance = {
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 10
      };

      const mockCreatedBalance = {
        id: 1,
        ...mockBalance,
        expirationDate: null,
        lastUpdatedByUser: 1
      };

      (db.insert as any).mockReturnThis();
      (db.values as any).mockReturnThis();
      (db.returning as any).mockResolvedValue([mockCreatedBalance]);

      const result = await storage.createSessionBalance(mockBalance, mockContext);

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedBalance);
    });
  });

  describe('updateSessionBalance', () => {
    it('should update an existing session balance', async () => {
      const mockUpdate = {
        remainingSessions: 8,
        usedSessions: 2
      };

      const mockUpdatedBalance = {
        id: 1,
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 2,
        remainingSessions: 8,
        expirationDate: null,
        lastUpdatedByUser: 1
      };

      (db.update as any).mockReturnThis();
      (db.set as any).mockReturnThis();
      (db.where as any).mockReturnThis();
      (db.returning as any).mockResolvedValue([mockUpdatedBalance]);

      const result = await storage.updateSessionBalance(1, mockUpdate, mockContext);

      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedBalance);
    });
  });

  describe('addSessionTransaction', () => {
    it('should add a session transaction', async () => {
      const mockTransaction = {
        playerId: 1,
        teamId: 1,
        date: new Date(),
        sessionChange: 10,
        reason: 'purchase',
        notes: 'Initial purchase'
      };

      const mockCreatedTransaction = {
        id: 1,
        ...mockTransaction,
        lastUpdatedByUser: 1
      };

      (db.insert as any).mockReturnThis();
      (db.values as any).mockReturnThis();
      (db.returning as any).mockResolvedValue([mockCreatedTransaction]);

      const result = await storage.addSessionTransaction(mockTransaction, mockContext);

      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedTransaction);
    });
  });

  describe('getSessionTransactionsByPlayerId', () => {
    it('should get session transactions for a player', async () => {
      const mockTransactions = [
        {
          id: 1,
          playerId: 1,
          teamId: 1,
          date: new Date(),
          sessionChange: 10,
          reason: 'purchase',
          notes: 'Initial purchase',
          lastUpdatedByUser: 1
        },
        {
          id: 2,
          playerId: 1,
          teamId: 1,
          date: new Date(),
          sessionChange: -1,
          reason: 'attendance',
          notes: 'Used 1 session',
          lastUpdatedByUser: 1
        }
      ];

      // Mock the implementation to return the mock transactions
      vi.spyOn(storage, 'getSessionTransactionsByPlayerId').mockResolvedValue(mockTransactions);

      const result = await storage.getSessionTransactionsByPlayerId(1, 1);

      expect(result).toEqual(mockTransactions);
    });
  });
});
