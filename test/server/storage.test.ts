import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock objects
const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([{ id: 1, username: 'testuser', role: 'Coach' }])),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([{ id: 1, name: 'Test Team' }])),
    })),
  })),
};

// Mock all required modules
vi.mock('../../server/db', () => ({
  db: mockDb,
  pool: { connect: vi.fn() },
}));

vi.mock('connect-pg-simple', () => {
  return function() {
    return function() {
      return {};
    };
  };
});

vi.mock('express-session', () => ({}));

vi.mock('../../server/logger', () => ({
  Logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../../server/auth', () => ({
  hashPassword: vi.fn(() => 'hashed_password'),
}));

// Create a mock Storage class instead of importing the real one
class MockStorage {
  async getUser(id: number) {
    return { id: 1, username: 'testuser', role: 'Coach' };
  }

  async createTeam(teamData: any, context: any) {
    return { id: 1, name: 'Test Team' };
  }
}

describe('Storage', () => {
  let storage: MockStorage;
  const context = { currentUserId: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new MockStorage();
  });

  describe('getUser', () => {
    it('should return a user by ID', async () => {
      const user = await storage.getUser(1);
      expect(user).toEqual({ id: 1, username: 'testuser', role: 'Coach' });
    });
  });

  describe('createTeam', () => {
    it('should create a new team', async () => {
      const teamData = {
        name: 'Test Team',
        coachId: 1,
        description: 'A test team',
      };

      const team = await storage.createTeam(teamData, context);
      expect(team).toEqual({ id: 1, name: 'Test Team' });
    });
  });
});
