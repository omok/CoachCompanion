import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../client/src/hooks/use-auth';
import { AuthProvider } from '../../client/src/contexts/AuthContext';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

// Mock API client
vi.mock('../../client/src/lib/queryClient', () => ({
  getQueryFn: vi.fn(),
  apiRequest: vi.fn(),
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  },
}));

// Mock toast hook
vi.mock('../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBeDefined();
      expect(result.current.error).toBeNull();
      expect(result.current.loginMutation).toBeDefined();
      expect(result.current.logoutMutation).toBeDefined();
      expect(result.current.registerMutation).toBeDefined();
      expect(typeof result.current.refreshUser).toBe('function');
    });
  });

  describe('Login Mutation', () => {
    it('should provide login mutation', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loginMutation).toBeDefined();
      expect(typeof result.current.loginMutation.mutate).toBe('function');
      expect(typeof result.current.loginMutation.isPending).toBe('boolean');
      expect(typeof result.current.loginMutation.isError).toBe('boolean');
      expect(typeof result.current.loginMutation.isSuccess).toBe('boolean');
    });
  });

  describe('Registration Mutation', () => {
    it('should provide registration mutation', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.registerMutation).toBeDefined();
      expect(typeof result.current.registerMutation.mutate).toBe('function');
      expect(typeof result.current.registerMutation.isPending).toBe('boolean');
      expect(typeof result.current.registerMutation.isError).toBe('boolean');
      expect(typeof result.current.registerMutation.isSuccess).toBe('boolean');
    });
  });

  describe('Logout Mutation', () => {
    it('should provide logout mutation', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.logoutMutation).toBeDefined();
      expect(typeof result.current.logoutMutation.mutate).toBe('function');
      expect(typeof result.current.logoutMutation.isPending).toBe('boolean');
      expect(typeof result.current.logoutMutation.isError).toBe('boolean');
      expect(typeof result.current.logoutMutation.isSuccess).toBe('boolean');
    });
  });

  describe('User Refresh', () => {
    it('should provide refresh user function', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(typeof result.current.refreshUser).toBe('function');
    });

    it('should handle refresh user call', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshUser();
      });

      // Should not throw error
      expect(result.current.refreshUser).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should provide error state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.error).toBeDefined();
      expect(result.current.error).toBeNull(); // Initially no error
    });
  });

  describe('Context Usage', () => {
    it('should throw error when used outside of AuthProvider', () => {
      // Test without wrapper
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('should work when used within AuthProvider', () => {
      // Test with wrapper
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.user).toBeDefined();
      expect(result.current.loginMutation).toBeDefined();
    });
  });
});
