import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrepaidSessionTracker } from '../prepaid-session-tracker';
import { useQuery, useMutation } from '@tanstack/react-query';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock the react-query hooks
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn()
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock the player context
vi.mock('../player-context', () => ({
  usePlayerContext: () => ({
    showPlayerDetails: vi.fn()
  })
}));

describe('PrepaidSessionTracker', () => {
  const mockPlayers = [
    {
      id: 1,
      name: 'Test Player',
      teamId: 1,
      active: true
    }
  ];

  const mockSessionBalances = [
    {
      id: 1,
      playerId: 1,
      teamId: 1,
      totalSessions: 10,
      usedSessions: 3,
      remainingSessions: 7,
      lastUpdatedAt: '2024-03-20T00:00:00Z',
      lastUpdatedByUser: 1
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock useQuery for players and session balances
    (useQuery as any).mockImplementation(({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0].includes('/players')) {
        return {
          data: mockPlayers,
          isLoading: false,
          error: null
        };
      }
      if (queryKey[0].includes('/sessions')) {
        return {
          data: mockSessionBalances,
          isLoading: false,
          error: null
        };
      }
      if (queryKey[0].includes(`/api/teams/1/sessions/1`)) {
        return {
          data: {
            balance: mockSessionBalances[0],
            transactions: []
          },
          isLoading: false,
          error: null
        };
      }
      return {
        data: null,
        isLoading: false,
        error: null
      };
    });

    // Mock useMutation for adding sessions
    (useMutation as any).mockImplementation(() => ({
      mutate: vi.fn(),
      isLoading: false,
      error: null
    }));
  });

  test('renders session balance information', () => {
    render(<PrepaidSessionTracker teamId={1} />);

    expect(screen.getByText('Sessions Left')).toBeInTheDocument();
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('7 / 10')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    (useQuery as any).mockImplementation(() => ({
      data: null,
      isLoading: true,
      error: null
    }));

    render(<PrepaidSessionTracker teamId={1} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('shows error state', () => {
    (useQuery as any).mockImplementation(() => ({
      data: null,
      isLoading: false,
      error: new Error('Failed to load data')
    }));

    render(<PrepaidSessionTracker teamId={1} />);

    expect(screen.getByText('Error loading session data')).toBeInTheDocument();
  });

  test('adds new sessions', async () => {
    const mockMutate = vi.fn();
    (useMutation as any).mockImplementation(() => ({
      mutate: mockMutate,
      isLoading: false,
      error: null
    }));

    render(<PrepaidSessionTracker teamId={1} />);

    // Fill in the form
    const playerSelect = screen.getByRole('combobox');
    await userEvent.click(playerSelect);
    await userEvent.click(screen.getByText('Test Player'));

    const sessionInput = screen.getByLabelText('Number of Sessions');
    await userEvent.clear(sessionInput);
    await userEvent.type(sessionInput, '5');

    const notesInput = screen.getByLabelText('Notes (Optional)');
    await userEvent.type(notesInput, 'Test purchase');

    // Submit the form
    const submitButton = screen.getByText('Add Sessions without Payment');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        playerId: 1,
        sessionCount: 5,
        notes: 'Test purchase',
        date: expect.any(String)
      });
    });
  });
}); 