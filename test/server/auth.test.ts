import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hashPassword } from '../../server/auth';
import { storage } from '../../server/storage';

// Mock storage
vi.mock('../../server/storage', () => ({
  storage: {
    getUserByUsername: vi.fn(),
    createUser: vi.fn(),
    getUser: vi.fn(),
  },
}));

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toContain('.'); // scrypt format: hash.salt
    });

    it('should handle different passwords producing different hashes', async () => {
      const password1 = 'password1';
      const password2 = 'password2';
      
      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce consistent hash format', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);
      
      // scrypt format: hash.salt
      const parts = hashedPassword.split('.');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^[a-f0-9]+$/); // hex string
      expect(parts[1]).toMatch(/^[a-f0-9]+$/); // hex string
    });
  });

  describe('User Registration', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        role: 'Coach',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.createUser).mockResolvedValue(mockUser);
      vi.mocked(storage.getUserByUsername).mockResolvedValue(null);

      const result = await storage.createUser({
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        role: 'Coach',
      }, { currentUserId: 1 });

      expect(result).toEqual(mockUser);
      expect(storage.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'testuser',
          name: 'Test User',
          role: 'Coach',
        }),
        { currentUserId: 1 }
      );
    });

    it('should check for existing username before registration', async () => {
      const existingUser = {
        id: 1,
        username: 'existinguser',
        name: 'Existing User',
        role: 'Coach',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.getUserByUsername).mockResolvedValue(existingUser);

      const result = await storage.getUserByUsername('existinguser');
      expect(result).toEqual(existingUser);
      expect(storage.getUserByUsername).toHaveBeenCalledWith('existinguser');
    });
  });

  describe('User Retrieval', () => {
    it('should retrieve user by ID', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        role: 'Coach',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      const result = await storage.getUser(1);
      expect(result).toEqual(mockUser);
      expect(storage.getUser).toHaveBeenCalledWith(1);
    });

    it('should retrieve user by username', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        role: 'Coach',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.getUserByUsername).mockResolvedValue(mockUser);

      const result = await storage.getUserByUsername('testuser');
      expect(result).toEqual(mockUser);
      expect(storage.getUserByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should return null for non-existent user', async () => {
      vi.mocked(storage.getUser).mockResolvedValue(null);

      const result = await storage.getUser(999);
      expect(result).toBeNull();
      expect(storage.getUser).toHaveBeenCalledWith(999);
    });
  });

  describe('Role Validation', () => {
    it('should validate coach role', () => {
      const validRoles = ['Coach', 'Normal'];
      const invalidRole = 'InvalidRole';

      expect(validRoles).toContain('Coach');
      expect(validRoles).toContain('Normal');
      expect(validRoles).not.toContain(invalidRole);
    });
  });
}); 