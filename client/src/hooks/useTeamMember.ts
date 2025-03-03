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
  
  const addLog = useCallback((type: string, data: any) => {
    const timestamp = new Date().toISOString();
    const log = { timestamp, type, data };
    logRef.current = [...logRef.current, log];
    setRequestLogs(prev => [...prev, log]);
    console.log(`[TeamMembership] ${type}:`, data);
  }, []);

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
        addLog('USER_MISSING', { message: 'No user available, skipping fetch' });
        return [];
      }

      try {
        addLog('FETCH_START', { userId: user.id });
        addLog('FETCH_URL', { url: '/api/user/teams' });
        
        const response = await fetch('/api/user/teams', { 
          credentials: 'include'
        });
        
        addLog('FETCH_RESPONSE', { 
          status: response.status, 
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          addLog('FETCH_ERROR_RESPONSE', { 
            status: response.status,
            errorText
          });
          throw new Error(`Failed to fetch team memberships: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        addLog('FETCH_DATA', { data });
        
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load team memberships';
        addLog('FETCH_ERROR', { message: errorMessage });
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