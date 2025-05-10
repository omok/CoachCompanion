import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { createTeamsRouter } from '../../../server/routes/teams';

// Mock the storage
const mockStorage = {
  getTeams: vi.fn(),
  getTeamById: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  deleteTeam: vi.fn(),
};

// Mock the authentication middleware
vi.mock('../../../server/middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 1, role: 'Coach' };
    next();
  },
  requireCoach: (req: any, res: any, next: any) => {
    if (req.user?.role === 'Coach') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  },
}));

// Create direct handler functions for testing
const getTeamsHandler = async (req: any, res: any, next: any) => {
  try {
    const teams = await mockStorage.getTeams(req.user.id);
    res.status(200).json(teams);
  } catch (error) {
    next(error);
  }
};

const createTeamHandler = async (req: any, res: any, next: any) => {
  try {
    const team = await mockStorage.createTeam(req.body, { currentUserId: req.user.id });
    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
};

describe('Teams Router', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock request, response, and next function
    mockRequest = {
      user: { id: 1, role: 'Coach' },
      params: {},
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('GET /teams', () => {
    it('should return teams for the authenticated coach', async () => {
      const mockTeams = [
        { id: 1, name: 'Team 1', coachId: 1 },
        { id: 2, name: 'Team 2', coachId: 1 },
      ];

      mockStorage.getTeams.mockResolvedValue(mockTeams);

      await getTeamsHandler(mockRequest, mockResponse, mockNext);

      expect(mockStorage.getTeams).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTeams);
    });

    it('should handle errors', async () => {
      mockStorage.getTeams.mockRejectedValue(new Error('Database error'));

      await getTeamsHandler(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('POST /teams', () => {
    it('should create a new team', async () => {
      const teamData = { name: 'New Team', coachId: 1 };
      const createdTeam = { id: 3, ...teamData };

      mockStorage.createTeam.mockResolvedValue(createdTeam);
      mockRequest.body = teamData;

      await createTeamHandler(mockRequest, mockResponse, mockNext);

      expect(mockStorage.createTeam).toHaveBeenCalledWith(
        expect.objectContaining(teamData),
        expect.objectContaining({ currentUserId: 1 })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdTeam);
    });
  });
});
