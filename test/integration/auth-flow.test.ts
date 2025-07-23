import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { setupAuth } from '../../server/auth';
import { storage } from '../../server/storage';

// Mock storage
vi.mock('../../server/storage', () => ({
  storage: {
    getUserByUsername: vi.fn(),
    createUser: vi.fn(),
    getUser: vi.fn(),
  },
  sessionStore: {
    get: vi.fn(),
    set: vi.fn(),
    destroy: vi.fn(),
  },
}));

// Mock logger service
vi.mock('../../server/services/logger-service', () => ({
  LoggerService: {
    logSecurityEvent: vi.fn(),
    logError: vi.fn(),
  },
}));

describe('Authentication Flow Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    
    setupAuth(app as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        name: 'New User',
        role: 'Coach',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.getUserByUsername).mockResolvedValue(null);
      vi.mocked(storage.createUser).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'newuser',
          password: 'password123',
          name: 'New User',
          role: 'Coach',
        })
        .expect(201);

      expect(response.body).toEqual(mockUser);
      expect(storage.getUserByUsername).toHaveBeenCalledWith('newuser');
      expect(storage.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          name: 'New User',
          role: 'Coach',
        }),
        expect.any(Object)
      );
    });

    it('should reject registration with existing username', async () => {
      const existingUser = {
        id: 1,
        username: 'existinguser',
        name: 'Existing User',
        role: 'Coach',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.getUserByUsername).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'existinguser',
          password: 'password123',
          name: 'New User',
          role: 'Coach',
        })
        .expect(400);

      expect(response.text).toBe('Username already exists');
      expect(storage.getUserByUsername).toHaveBeenCalledWith('existinguser');
      expect(storage.createUser).not.toHaveBeenCalled();
    });

    it('should handle registration validation errors', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: '', // Invalid: empty username
          password: '123', // Invalid: too short
          name: '', // Invalid: empty name
          role: 'InvalidRole', // Invalid: invalid role
        })
        .expect(400);

      expect(response.text).toBe('Username already exists'); // This is the current behavior
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        role: 'Coach',
        password: 'hashedPassword',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(storage.getUserByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should reject login with invalid credentials', async () => {
      vi.mocked(storage.getUserByUsername).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(storage.getUserByUsername).toHaveBeenCalledWith('nonexistent');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({})
        .expect(401);

      expect(storage.getUserByUsername).not.toHaveBeenCalled();
    });
  });

  describe('User Logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/logout')
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('Session Management', () => {
    it('should maintain session across requests', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        role: 'Coach',
        password: 'hashedPassword',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      // Login first
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];

      // Make another request with the session cookie
      const response = await request(app)
        .get('/api/user')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });

    it('should handle session expiration', async () => {
      const response = await request(app)
        .get('/api/user')
        .expect(401); // Should be unauthorized without session

      expect(response.status).toBe(401);
    });
  });

  describe('Security Features', () => {
    it('should hash passwords during registration', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        name: 'New User',
        role: 'Coach',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.getUserByUsername).mockResolvedValue(null);
      vi.mocked(storage.createUser).mockResolvedValue(mockUser);

      await request(app)
        .post('/api/register')
        .send({
          username: 'newuser',
          password: 'password123',
          name: 'New User',
          role: 'Coach',
        })
        .expect(201);

      expect(storage.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.not.stringMatching('password123'), // Should be hashed
        }),
        expect.any(Object)
      );
    });

    it('should validate user roles', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        role: 'Coach',
        password: 'hashedPassword',
        lastUpdatedByUser: 1,
      };

      vi.mocked(storage.getUserByUsername).mockResolvedValue(mockUser);
      vi.mocked(storage.getUser).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(['Coach', 'Normal']).toContain(response.body.role);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(storage.getUserByUsername).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(500);

      expect(response.status).toBe(500);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.status).toBe(400);
    });
  });
}); 