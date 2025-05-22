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

describe('Payment and Session Integration', () => {
  let storage: Storage;
  const mockContext = { currentUserId: 1 };
  
  beforeEach(() => {
    storage = new Storage();
    vi.clearAllMocks();
  });
  
  describe('createPayment with prepaid sessions', () => {
    it('should create payment and add sessions for new player', async () => {
      // Mock payment data
      const mockPayment = {
        playerId: 1,
        teamId: 1,
        amount: '100',
        date: new Date(),
        notes: 'Test payment',
        addPrepaidSessions: true,
        sessionCount: 10
      };
      
      // Mock created payment
      const mockCreatedPayment = {
        id: 1,
        playerId: 1,
        teamId: 1,
        amount: '100',
        date: new Date(),
        notes: 'Test payment',
        lastUpdatedByUser: 1
      };
      
      // Mock session balance check (no existing balance)
      (db.select as any).mockImplementation(() => {
        (db.returning as any).mockResolvedValueOnce([mockCreatedPayment]); // For payment creation
        (db.returning as any).mockResolvedValueOnce([]); // For session balance check
        return db;
      });
      
      // Set up the rest of the mocks
      (db.insert as any).mockReturnThis();
      (db.values as any).mockReturnThis();
      (db.update as any).mockReturnThis();
      (db.set as any).mockReturnThis();
      (db.where as any).mockReturnThis();
      
      // Mock session balance creation
      const mockCreatedBalance = {
        id: 1,
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 10,
        expirationDate: null,
        lastUpdatedByUser: 1
      };
      
      // Mock session transaction
      const mockCreatedTransaction = {
        id: 1,
        playerId: 1,
        teamId: 1,
        date: new Date(),
        sessionChange: 10,
        reason: 'purchase',
        notes: `Added 10 sessions with payment #1`,
        paymentId: 1,
        lastUpdatedByUser: 1
      };
      
      // Set up the mock returns for session balance and transaction
      (db.returning as any)
        .mockResolvedValueOnce([mockCreatedPayment]) // Initial payment creation
        .mockResolvedValueOnce([]) // Session balance check
        .mockResolvedValueOnce([mockCreatedBalance]) // Session balance creation
        .mockResolvedValueOnce([mockCreatedTransaction]) // Session transaction creation
        .mockResolvedValueOnce([{...mockCreatedPayment, notes: 'Test payment (Added 10 prepaid sessions)'}]); // Payment notes update
      
      // Call the method
      const result = await storage.createPayment(mockPayment, mockContext);
      
      // Verify payment was created
      expect(db.insert).toHaveBeenCalledTimes(3); // Payment, session balance, and session transaction
      
      // Verify session balance was created
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 10,
        lastUpdatedByUser: 1
      }));
      
      // Verify session transaction was created
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        playerId: 1,
        teamId: 1,
        sessionChange: 10,
        reason: 'purchase',
        paymentId: 1,
        lastUpdatedByUser: 1
      }));
    });
    
    it('should create payment and update existing session balance', async () => {
      // Mock payment data
      const mockPayment = {
        playerId: 1,
        teamId: 1,
        amount: '100',
        date: new Date(),
        notes: 'Test payment',
        addPrepaidSessions: true,
        sessionCount: 5
      };
      
      // Mock created payment
      const mockCreatedPayment = {
        id: 1,
        playerId: 1,
        teamId: 1,
        amount: '100',
        date: new Date(),
        notes: 'Test payment',
        lastUpdatedByUser: 1
      };
      
      // Mock existing session balance
      const mockExistingBalance = {
        id: 1,
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 5,
        remainingSessions: 5,
        expirationDate: null,
        lastUpdatedByUser: 1
      };
      
      // Mock updated session balance
      const mockUpdatedBalance = {
        ...mockExistingBalance,
        totalSessions: 15,
        remainingSessions: 10,
        lastUpdatedByUser: 1
      };
      
      // Mock session transaction
      const mockCreatedTransaction = {
        id: 1,
        playerId: 1,
        teamId: 1,
        date: new Date(),
        sessionChange: 5,
        reason: 'purchase',
        notes: `Added 5 sessions with payment #1`,
        paymentId: 1,
        lastUpdatedByUser: 1
      };
      
      // Set up the mock returns
      (db.select as any).mockImplementation(() => {
        (db.returning as any).mockResolvedValueOnce([mockCreatedPayment]); // For payment creation
        (db.returning as any).mockResolvedValueOnce([mockExistingBalance]); // For session balance check
        return db;
      });
      
      // Set up the rest of the mocks
      (db.insert as any).mockReturnThis();
      (db.values as any).mockReturnThis();
      (db.update as any).mockReturnThis();
      (db.set as any).mockReturnThis();
      (db.where as any).mockReturnThis();
      
      // Set up the mock returns for session balance update and transaction
      (db.returning as any)
        .mockResolvedValueOnce([mockCreatedPayment]) // Initial payment creation
        .mockResolvedValueOnce([mockExistingBalance]) // Session balance check
        .mockResolvedValueOnce([mockUpdatedBalance]) // Session balance update
        .mockResolvedValueOnce([mockCreatedTransaction]) // Session transaction creation
        .mockResolvedValueOnce([{...mockCreatedPayment, notes: 'Test payment (Added 5 prepaid sessions)'}]); // Payment notes update
      
      // Call the method
      const result = await storage.createPayment(mockPayment, mockContext);
      
      // Verify payment was created
      expect(db.insert).toHaveBeenCalledTimes(2); // Payment and session transaction
      
      // Verify session balance was updated
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
        lastUpdatedByUser: 1
      }));
      
      // Verify session transaction was created
      expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
        playerId: 1,
        teamId: 1,
        sessionChange: 5,
        reason: 'purchase',
        paymentId: 1,
        lastUpdatedByUser: 1
      }));
    });
  });
});
