import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '@/lib/protected-route';
import * as wouter from 'wouter';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the Loader2 component
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader" />,
}));

// Mock wouter hooks and components
vi.mock('wouter', async () => {
  return {
    Route: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Redirect: () => <div>Redirected to /auth</div>,
    useLocation: () => ['/test', vi.fn()],
    useRoute: () => [true, {}],
  };
});

describe('ProtectedRoute component', () => {
  const TestComponent = () => <div>Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when authentication is in progress', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      refreshUser: vi.fn(),
    });

    render(<ProtectedRoute path="/test" component={TestComponent} />);

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('redirects to auth page when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      refreshUser: vi.fn(),
    });

    render(<ProtectedRoute path="/test" component={TestComponent} />);

    expect(screen.getByText('Redirected to /auth')).toBeInTheDocument();
  });

  it('renders the protected component when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', role: 'Coach' },
      isLoading: false,
      refreshUser: vi.fn(),
    });

    render(<ProtectedRoute path="/test" component={TestComponent} />);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
