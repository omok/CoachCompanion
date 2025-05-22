import { fetchWithErrorHandling } from './utils';
import type { SessionBalance, SessionTransaction } from '@shared/schema';

/**
 * Get session balance and transactions for a player
 * 
 * @param teamId - The team ID
 * @param playerId - The player ID
 * @returns The session balance and transactions
 */
export async function getPlayerSessionBalance(teamId: number, playerId: number): Promise<{
  balance: SessionBalance | null;
  transactions: SessionTransaction[];
}> {
  return fetchWithErrorHandling(`/api/teams/${teamId}/sessions/${playerId}`);
}

/**
 * Get all session balances for a team
 * 
 * @param teamId - The team ID
 * @returns Array of session balances
 */
export async function getTeamSessionBalances(teamId: number): Promise<SessionBalance[]> {
  return fetchWithErrorHandling(`/api/teams/${teamId}/sessions`);
}

/**
 * Update session balance for a player
 * 
 * @param teamId - The team ID
 * @param playerId - The player ID
 * @param data - The session balance update data
 * @returns The updated session balance
 */
export async function updateSessionBalance(
  teamId: number,
  playerId: number,
  data: {
    totalSessions?: number;
    usedSessions?: number;
    remainingSessions?: number;
    expirationDate?: string | null;
  }
): Promise<SessionBalance> {
  return fetchWithErrorHandling(`/api/teams/${teamId}/sessions/${playerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
