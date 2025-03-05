import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../contexts/AuthContext';
import { apiRequest } from '../lib/queryClient';

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
  // Safely access AuthContext - handle potential null value
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const userLoading = authContext?.isLoading || false;
  
  const [requestLogs, setRequestLogs] = useState<any[]>([]);
  const logRef = useRef<any[]>([]);

  // Use React Query for team memberships
  const { 
    data: teamMembership = [],
    isLoading,
    error,
    refetch
  } = useQuery<TeamMembership[]>({
    queryKey: ['/api/user/teams'],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      try {
        
        const response = await fetch('/api/user/teams', { 
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch team memberships: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load team memberships';
        console.error('Error fetching team memberships:', err);
        throw err;
      }
    },
    enabled: !!user && !userLoading, // Only run when user is available
    retry: 3, // Retry failed requests up to 3 times
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Force refresh team memberships when user changes
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  return {
    teamMembership,
    isLoading,
    error,
    refetch,
    requestLogs: logRef.current // Expose logs
  };
} 