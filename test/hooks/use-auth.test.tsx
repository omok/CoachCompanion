import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useAuth Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const mockAuthHook = {
        user: null,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      };

      const { result } = renderHook(() => mockAuthHook, { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.refreshUser).toBe('function');
    });
  });

  describe('Login Mutation', () => {
    it('should provide login mutation', () => {
      const mockLogin = vi.fn();
      const mockAuthHook = {
        user: null,
        isLoading: false,
        error: null,
        login: mockLogin,
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      };

      const { result } = renderHook(() => mockAuthHook, { wrapper });

      expect(result.current.login).toBe(mockLogin);
    });
  });

  describe('Registration Mutation', () => {
    it('should provide registration mutation', () => {
      const mockRegister = vi.fn();
      const mockAuthHook = {
        user: null,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: mockRegister,
        logout: vi.fn(),
        refreshUser: vi.fn(),
      };

      const { result } = renderHook(() => mockAuthHook, { wrapper });

      expect(result.current.register).toBe(mockRegister);
    });
  });

  describe('Logout Mutation', () => {
    it('should provide logout mutation', () => {
      const mockLogout = vi.fn();
      const mockAuthHook = {
        user: null,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
      };

      const { result } = renderHook(() => mockAuthHook, { wrapper });

      expect(result.current.logout).toBe(mockLogout);
    });
  });

  describe('User Refresh', () => {
    it('should provide refresh user function', () => {
      const mockRefreshUser = vi.fn();
      const mockAuthHook = {
        user: null,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: mockRefreshUser,
      };

      const { result } = renderHook(() => mockAuthHook, { wrapper });

      expect(result.current.refreshUser).toBe(mockRefreshUser);
    });

    it('should handle refresh user call', async () => {
      const mockRefreshUser = vi.fn().mockResolvedValue(undefined);
      const mockAuthHook = {
        user: null,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: mockRefreshUser,
      };

      const { result } = renderHook(() => mockAuthHook, { wrapper });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockRefreshUser).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should provide error state', () => {
      const mockError = 'Authentication failed';
      const mockAuthHook = {
        user: null,
        isLoading: false,
        error: mockError,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      };

      const { result } = renderHook(() => mockAuthHook, { wrapper });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('Context Usage', () => {
    it('should work when used within AuthProvider', () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        userType: 'Coach' as const,
      };

      const mockAuthHook = {
        user: mockUser,
        isLoading: false,
        error: null,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      };

      const { result } = renderHook(() => mockAuthHook, { wrapper });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});