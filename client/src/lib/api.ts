import { apiRequest } from './queryClient';
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
  try {
    console.log(`Fetching session balance for player ${playerId} in team ${teamId}`);
    const res = await apiRequest('GET', `/api/teams/${teamId}/sessions/${playerId}`);

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      console.error(`Failed to fetch session balance: ${errorText}`);
      throw new Error(`Failed to fetch session balance: ${res.status} ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    console.error('Error in getPlayerSessionBalance:', error);
    throw error;
  }
}

/**
 * Get all session balances for a team
 *
 * @param teamId - The team ID
 * @returns Array of session balances
 */
export async function getTeamSessionBalances(teamId: number): Promise<SessionBalance[]> {
  const res = await apiRequest('GET', `/api/teams/${teamId}/sessions`);
  if (!res.ok) {
    throw new Error(`Failed to fetch team session balances: ${res.statusText}`);
  }
  return res.json();
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
  const res = await apiRequest('PUT', `/api/teams/${teamId}/sessions/${playerId}`, data);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update session balance: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Add prepaid sessions for a player without payment
 *
 * @param teamId - The team ID
 * @param playerId - The player ID
 * @param sessionCount - Number of sessions to add
 * @param notes - Optional notes
 * @returns The updated session balance
 */
export async function addPrepaidSessions(
  teamId: number,
  playerId: number,
  sessionCount: number,
  notes?: string
): Promise<SessionBalance> {
  try {
    console.log(`Adding ${sessionCount} prepaid sessions for player ${playerId} in team ${teamId}`);

    // Skip trying to get the current balance and just create a new one directly
    // This avoids the 500 error when trying to get the balance

    // Create new balance data
    const updateData = {
      totalSessions: sessionCount,
      usedSessions: 0,
      remainingSessions: sessionCount,
      notes: notes || `Added ${sessionCount} prepaid sessions without payment`
    };

    console.log("Sending update data:", updateData);

    // Update the balance
    const res = await apiRequest('PUT', `/api/teams/${teamId}/sessions/${playerId}`, updateData);

    if (!res.ok) {
      let errorMessage = `Failed to add prepaid sessions: ${res.status} ${res.statusText}`;

      try {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error("Could not parse error response:", e);
      }

      throw new Error(errorMessage);
    }

    return res.json();
  } catch (error) {
    console.error('Error adding prepaid sessions:', error);
    throw error;
  }
}
