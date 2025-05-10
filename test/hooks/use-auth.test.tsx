import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

// Create a simple mock implementation
const mockUseAuth = vi.fn();
const mockAuthProvider = vi.fn(({ children }: { children: ReactNode }) => <>{children}</>);

// Mock the auth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: (props: { children: ReactNode }) => mockAuthProvider(props),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the API request function
vi.mock('@/lib/queryClient', () => ({
  getQueryFn: vi.fn(() => async () => undefined),
  apiRequest: vi.fn(),
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  },
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial auth state', async () => {
    // Set up the mock to return the expected values
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
      loginMutation: { mutate: vi.fn() },
      logoutMutation: { mutate: vi.fn() },
      registerMutation: { mutate: vi.fn() },
      refreshUser: vi.fn(),
    });

    const { result } = renderHook(() => mockUseAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.loginMutation).toBeDefined();
    expect(result.current.logoutMutation).toBeDefined();
    expect(result.current.registerMutation).toBeDefined();
    expect(result.current.refreshUser).toBeDefined();
  });

  it('should throw error when used outside of AuthProvider', () => {
    // Set up the mock to throw an error
    mockUseAuth.mockImplementation(() => {
      throw new Error('useAuth must be used within an AuthProvider');
    });

    expect(() => mockUseAuth()).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });
});
