import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Interface for team membership data
 */
export interface TeamMembership {
  id: number;
  teamId: number;
  userId: number;
  role: string;
  isOwner: boolean;
  teamName?: string;
}

/**
 * Hook for accessing team membership data
 */
export function useTeamMember() {
  const { user } = useContext(AuthContext);
  const [teamMembership, setTeamMembership] = useState<TeamMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch team memberships when user changes
  useEffect(() => {
    const fetchTeamMemberships = async () => {
      if (!user) {
        setTeamMembership([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/user/teams');
        
        if (!response.ok) {
          throw new Error('Failed to fetch team memberships');
        }
        
        const data = await response.json();
        setTeamMembership(data);
      } catch (err) {
        console.error('Error fetching team memberships:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team memberships');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMemberships();
  }, [user]);

  return {
    teamMembership,
    isLoading,
    error
  };
} 