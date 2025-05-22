import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createSessionsRouter } from '../routes/sessions';

// Mock storage
const mockStorage = {
  getPlayer: vi.fn(),
  getSessionBalance: vi.fn(),
  getSessionBalancesByTeamId: vi.fn(),
  getSessionTransactionsByPlayerId: vi.fn(),
  createSessionBalance: vi.fn(),
  updateSessionBalance: vi.fn(),
  addSessionTransaction: vi.fn()
};

// Mock authorization middleware
vi.mock('../utils/authorization', () => ({
  requireTeamRolePermission: () => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  }
}));

describe('Session Routes', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authenticated user
    app.use((req, res, next) => {
      req.user = { id: 1, role: 'Coach' };
      req.isAuthenticated = () => true;
      next();
    });
    
    // Mount the sessions router
    app.use('/api/teams/:teamId/sessions', createSessionsRouter(mockStorage));
    
    // Reset mocks
    vi.resetAllMocks();
  });
  
  describe('GET /api/teams/:teamId/sessions', () => {
    it('should return all session balances for a team', async () => {
      const mockBalances = [
        {
          id: 1,
          playerId: 1,
          teamId: 1,
          totalSessions: 10,
          usedSessions: 2,
          remainingSessions: 8,
          expirationDate: '2023-12-31'
        },
        {
          id: 2,
          playerId: 2,
          teamId: 1,
          totalSessions: 5,
          usedSessions: 1,
          remainingSessions: 4,
          expirationDate: null
        }
      ];
      
      mockStorage.getSessionBalancesByTeamId.mockResolvedValue(mockBalances);
      
      const response = await request(app).get('/api/teams/1/sessions');
      
      expect(response.status).toBe(200);
      expect(mockStorage.getSessionBalancesByTeamId).toHaveBeenCalledWith(1);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe(1);
      expect(response.body[1].id).toBe(2);
    });
    
    it('should handle invalid team ID', async () => {
      const response = await request(app).get('/api/teams/invalid/sessions');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid Request');
    });
  });
  
  describe('GET /api/teams/:teamId/sessions/:playerId', () => {
    it('should return session balance and transactions for a player', async () => {
      const mockPlayer = { id: 1, teamId: 1, name: 'Test Player' };
      const mockBalance = {
        id: 1,
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 2,
        remainingSessions: 8,
        expirationDate: '2023-12-31'
      };
      const mockTransactions = [
        {
          id: 1,
          playerId: 1,
          teamId: 1,
          date: '2023-01-01',
          sessionChange: 10,
          reason: 'purchase',
          notes: 'Initial purchase'
        },
        {
          id: 2,
          playerId: 1,
          teamId: 1,
          date: '2023-01-15',
          sessionChange: -1,
          reason: 'attendance',
          notes: 'Used 1 session'
        }
      ];
      
      mockStorage.getPlayer.mockResolvedValue(mockPlayer);
      mockStorage.getSessionBalance.mockResolvedValue(mockBalance);
      mockStorage.getSessionTransactionsByPlayerId.mockResolvedValue(mockTransactions);
      
      const response = await request(app).get('/api/teams/1/sessions/1');
      
      expect(response.status).toBe(200);
      expect(mockStorage.getPlayer).toHaveBeenCalledWith(1);
      expect(mockStorage.getSessionBalance).toHaveBeenCalledWith(1, 1);
      expect(mockStorage.getSessionTransactionsByPlayerId).toHaveBeenCalledWith(1, 1);
      expect(response.body.balance).toEqual(expect.objectContaining({
        id: 1,
        remainingSessions: 8
      }));
      expect(response.body.transactions).toHaveLength(2);
    });
    
    it('should handle player not found', async () => {
      mockStorage.getPlayer.mockResolvedValue(null);
      
      const response = await request(app).get('/api/teams/1/sessions/1');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  });
  
  describe('PUT /api/teams/:teamId/sessions/:playerId', () => {
    it('should update session balance for a player', async () => {
      const mockPlayer = { id: 1, teamId: 1, name: 'Test Player' };
      const mockExistingBalance = {
        id: 1,
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 2,
        remainingSessions: 8,
        expirationDate: null
      };
      const mockUpdatedBalance = {
        ...mockExistingBalance,
        remainingSessions: 10,
        totalSessions: 12
      };
      
      mockStorage.getPlayer.mockResolvedValue(mockPlayer);
      mockStorage.getSessionBalance.mockResolvedValue(mockExistingBalance);
      mockStorage.updateSessionBalance.mockResolvedValue(mockUpdatedBalance);
      mockStorage.addSessionTransaction.mockResolvedValue({});
      
      const response = await request(app)
        .put('/api/teams/1/sessions/1')
        .send({
          remainingSessions: 10,
          totalSessions: 12
        });
      
      expect(response.status).toBe(200);
      expect(mockStorage.getPlayer).toHaveBeenCalledWith(1);
      expect(mockStorage.getSessionBalance).toHaveBeenCalledWith(1, 1);
      expect(mockStorage.updateSessionBalance).toHaveBeenCalled();
      expect(mockStorage.addSessionTransaction).toHaveBeenCalled();
      expect(response.body).toEqual(expect.objectContaining({
        remainingSessions: 10,
        totalSessions: 12
      }));
    });
    
    it('should create new session balance if none exists', async () => {
      const mockPlayer = { id: 1, teamId: 1, name: 'Test Player' };
      const mockNewBalance = {
        id: 1,
        playerId: 1,
        teamId: 1,
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 10,
        expirationDate: null
      };
      
      mockStorage.getPlayer.mockResolvedValue(mockPlayer);
      mockStorage.getSessionBalance.mockResolvedValue(null);
      mockStorage.createSessionBalance.mockResolvedValue(mockNewBalance);
      mockStorage.addSessionTransaction.mockResolvedValue({});
      
      const response = await request(app)
        .put('/api/teams/1/sessions/1')
        .send({
          totalSessions: 10,
          remainingSessions: 10
        });
      
      expect(response.status).toBe(201);
      expect(mockStorage.getPlayer).toHaveBeenCalledWith(1);
      expect(mockStorage.getSessionBalance).toHaveBeenCalledWith(1, 1);
      expect(mockStorage.createSessionBalance).toHaveBeenCalled();
      expect(mockStorage.addSessionTransaction).toHaveBeenCalled();
      expect(response.body).toEqual(expect.objectContaining({
        totalSessions: 10,
        remainingSessions: 10
      }));
    });
  });
});
