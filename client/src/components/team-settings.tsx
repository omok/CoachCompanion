import React, { useState, useContext, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from "wouter";
import { useForm } from 'react-hook-form';
import { usePermissions } from '../hooks/usePermissions';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PlayerList } from "@/components/player-list";
import { AuthContext } from "../contexts/AuthContext";
import { useTeamMember } from '../hooks/useTeamMember';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/use-auth';

// Define TeamSettings type with proper validation markers
type TeamSettings = {
  name: string;           // Required
  description: string;    // Optional
  seasonStartDate: string; // Optional
  seasonEndDate: string;  // Optional
  teamFee: string;        // Optional
};

// For processed form data that can have nulls
interface ProcessedTeamSettings {
  name: string;
  description: string | null;
  seasonStartDate: string | null;
  seasonEndDate: string | null;
  teamFee: string | null;
}

interface TeamSettingsProps {
  teamId: number;
}

export const TeamSettings = ({ teamId }: TeamSettingsProps) => {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { teamMembership, isLoading: isTeamMembershipLoading, requestLogs, refetch: refetchTeamMembership } = useTeamMember();
  const { canManageTeamSettings } = usePermissions();
  const [activeTab, setActiveTab] = useState('general');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(true);
  const [debugResponse, setDebugResponse] = useState<any>(null);
  const initialLoadAttempted = useRef(false);
  const [directFetchResponse, setDirectFetchResponse] = useState<any>(null);
  const [directFetchError, setDirectFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // IMPORTANT: All hooks must be called unconditionally before any conditional logic
  // Fetch team data - call useQuery unconditionally - don't disable based on permissions
  const { 
    data: team, 
    isLoading: isTeamLoading,
    error: teamError,
    refetch: refetchTeam
  } = useQuery({
    queryKey: [`team-${teamId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          credentials: 'include' // Ensure cookies are sent
        });
        
        // Check content type to detect HTML responses
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        
        if (!response.ok) {
          // Try to safely get response text - could be HTML or JSON
          const responseText = await response.text();
          
          // Log the full response for debugging
          console.error(`[TeamSettings] Error fetching team ${teamId}:`, {
            status: response.status,
            contentType,
            responseText: responseText.substring(0, 200) + '...' // Show first 200 chars
          });
          
          // If it's HTML, provide a more helpful error
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            throw new Error(`Server returned HTML instead of JSON (${response.status}). You may need to log in again.`);
          }
          
          // Try to parse as JSON if it looks like JSON
          let errorMessage = `Failed to fetch team: ${response.status}`;
          if (isJson || responseText.trim().startsWith('{')) {
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              // If parsing fails, use the text directly
              errorMessage = `${errorMessage} - ${responseText.substring(0, 100)}`;
            }
          } else {
            // Use plain text error
            errorMessage = `${errorMessage} - ${responseText.substring(0, 100)}`;
          }
          
          throw new Error(errorMessage);
        }
        
        // Check if response is actually JSON
        if (!isJson) {
          const text = await response.text();
          console.error('[TeamSettings] Received non-JSON response:', text.substring(0, 200));
          throw new Error('Server returned non-JSON response. You may need to log in again.');
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`[TeamSettings] Error fetching team ${teamId}:`, error);
        throw error; // Let React Query handle the error
      }
    },
    retry: 1, // Only retry once
    staleTime: 300000, // 5 minutes
  });

  // Setup the form with validation
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TeamSettings>({
    defaultValues: {
      name: '',
      description: '',
      seasonStartDate: '',
      seasonEndDate: '',
      teamFee: '',
    },
  });

  // Update form values when team data loads - must be after form setup
  useEffect(() => {
    if (team) {
      
      // For date fields, just set the YYYY-MM-DD strings directly
      // If they're already in that format, no need to parse and reformat
      let startDate = '';
      let endDate = '';
      
      if (team.seasonStartDate) {
        // The date should already be in YYYY-MM-DD format from the server
        // Just use it directly to avoid timezone issues
        if (typeof team.seasonStartDate === 'string') {
          // Check if already in YYYY-MM-DD format
          if (/^\d{4}-\d{2}-\d{2}$/.test(team.seasonStartDate)) {
            startDate = team.seasonStartDate;
          } else {
            // For compatibility with other date formats, use date-fns carefully
            try {
              // Parse the date in UTC to avoid timezone shifts
              const parsedDate = new Date(team.seasonStartDate);
              startDate = format(parsedDate, 'yyyy-MM-dd');
            } catch (err) {
              console.error('[TeamSettings] Error formatting start date:', err);
            }
          }
        }
      }
      
      if (team.seasonEndDate) {
        // Same approach for end date
        if (typeof team.seasonEndDate === 'string') {
          // Check if already in YYYY-MM-DD format
          if (/^\d{4}-\d{2}-\d{2}$/.test(team.seasonEndDate)) {
            endDate = team.seasonEndDate;
          } else {
            // For compatibility with other date formats, use date-fns carefully
            try {
              // Parse the date in UTC to avoid timezone shifts
              const parsedDate = new Date(team.seasonEndDate);
              endDate = format(parsedDate, 'yyyy-MM-dd');
            } catch (err) {
              console.error('[TeamSettings] Error formatting end date:', err);
            }
          }
        }
      }
      
      reset({
        name: team.name || '',
        description: team.description || '',
        seasonStartDate: startDate,
        seasonEndDate: endDate,
        teamFee: team.teamFee?.toString() || '',
      });
    }
  }, [team, reset]);

  // Update team settings mutation - must be called unconditionally
  const updateTeamMutation = useMutation({
    mutationFn: async (data: ProcessedTeamSettings) => {
      
      if (!canManageTeamSettings(teamId)) {
        console.error(`[TeamSettings] Permission denied for user ${user?.id} to update team ${teamId}`);
        throw new Error('Permission denied to update team settings');
      }
      
      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Ensure cookies are sent
          body: JSON.stringify(data),
        });
        
        
        // Get response as text first
        const responseText = await response.text();
        
        // Try to parse as JSON if it looks like JSON
        let responseData;
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            console.error('[TeamSettings] Failed to parse response as JSON:', e);
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
          }
        } else {
          console.error('[TeamSettings] Non-JSON response:', responseText.substring(0, 100));
          throw new Error(`Non-JSON response: ${responseText.substring(0, 100)}`);
        }
        
        if (!response.ok) {
          console.error('[TeamSettings] Error updating team:', responseData);
          throw new Error(responseData.error || 'Failed to update team settings');
        }
        
        return responseData;
      } catch (error) {
        console.error('[TeamSettings] Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`team-${teamId}`] });
      setSuccess('Team settings updated successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: Error) => {
      console.error('[TeamSettings] Update error:', error);
      setError(error.message);
      setSuccess(null);
    },
  });

  // On mount, refresh auth and team membership data
  useEffect(() => {
    const refreshData = async () => {
      if (initialLoadAttempted.current) return;
      initialLoadAttempted.current = true;
      
      try {
        await refreshUser();
        await refetchTeamMembership();
        await refetchTeam(); // Also explicitly refetch team data
      } catch (err) {
        console.error(`[TeamSettings] Error refreshing data:`, err);
      }
    };
    
    refreshData();
  }, [teamId, refreshUser, refetchTeamMembership, refetchTeam]);

  // Force refresh user data
  const refreshUserData = async () => {
    try {
      // First check auth state on server
      const authCheckResponse = await fetch('/api/debug/auth', { credentials: 'include' });
      const authCheckData = await authCheckResponse.json();
      setDebugResponse(authCheckData);
      
      // Then force refresh the user data in React Query cache
      await refreshUser();
      
      // Then force refresh team memberships
      await refetchTeamMembership();
      
      // Also refresh team data
      await refetchTeam();
      
      setSuccess('Auth data refreshed. Check console for details.');
    } catch (err) {
      setError('Failed to refresh auth data');
      console.error('[TeamSettings] Auth refresh error:', err);
    }
  };

  // Log whenever permission check result changes
  useEffect(() => {
    const hasPermission = canManageTeamSettings(teamId);
  }, [canManageTeamSettings, teamId, user, teamMembership]);

  // Helper to process form data before submission
  const processFormData = (data: TeamSettings): ProcessedTeamSettings => {
    
    // For date fields, just pass through the YYYY-MM-DD strings directly
    // Date inputs in HTML already use ISO format (YYYY-MM-DD)
    // Don't use Date objects to avoid timezone issues
    const seasonStartDate = data.seasonStartDate ? data.seasonStartDate.trim() : null;
    const seasonEndDate = data.seasonEndDate ? data.seasonEndDate.trim() : null;
    
    return {
      // Always include required fields
      name: data.name.trim(),
      
      // For optional fields, convert empty strings to null
      description: data.description.trim() || null,
      seasonStartDate,
      seasonEndDate,
      
      // Special handling for numeric field
      teamFee: data.teamFee.trim() === '' ? null : data.teamFee,
    };
  };

  // Submit handler with enhanced validation
  const onSubmit = (data: TeamSettings) => {
    try {
      // Basic validation
      if (!data.name.trim()) {
        setError('Team name is required');
        return;
      }
      
      // Validate teamFee - must be a valid number or empty string
      if (data.teamFee !== '' && isNaN(Number(data.teamFee))) {
        setError('Team fee must be a valid number');
        return;
      }
      
      // Process the data to handle null values
      const processedData = processFormData(data);
      
      // Submit the processed data
      updateTeamMutation.mutate(processedData);
    } catch (err) {
      console.error('[TeamSettings] Error in form submission:', err);
      setError(String(err));
    }
  };

  // Test direct fetch to team endpoint
  const testDirectFetch = async () => {
    setIsFetching(true);
    setDirectFetchError(null);
    try {
      
      // First test auth endpoint to confirm we're logged in
      const authResponse = await fetch('/api/debug/auth', { credentials: 'include' });
      const authData = await authResponse.json();
      
      // Then test team memberships endpoint
      const membershipsResponse = await fetch('/api/user/teams', { credentials: 'include' });
      const membershipsData = await membershipsResponse.json();
      
      // Finally test the team endpoint directly
      const response = await fetch(`/api/teams/${teamId}`, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Log headers safely using forEach instead of entries()
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      // Get the raw response text first
      const responseText = await response.text();
      
      // Try to parse as JSON if it looks like JSON
      let data;
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          data = JSON.parse(responseText);
          setDirectFetchResponse(data);
        } catch (e) {
          console.error('[DirectFetch] Failed to parse response as JSON:', e);
          setDirectFetchError(`Response is not valid JSON: ${responseText.substring(0, 200)}`);
        }
      } else {
        setDirectFetchError(`Response is not JSON: ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.error('[DirectFetch] Error:', error);
      setDirectFetchError(String(error));
    } finally {
      setIsFetching(false);
    }
  };

  // NOW we can use conditional rendering - AFTER all hooks have been called
  const hasPermission = canManageTeamSettings(teamId);
  
  // If no permission, render permission denied card
  if (!hasPermission) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTitle>Permission Denied</AlertTitle>
            <AlertDescription>You don't have permission to access team settings.</AlertDescription>
          </Alert>

          {showDebug && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h3 className="text-lg font-bold mb-2">Debug Information</h3>
              <div className="text-xs font-mono overflow-auto">
                <div className="mb-2">
                  <strong>Team ID:</strong> {teamId}
                </div>
                <div className="mb-2">
                  <strong>Current User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}
                </div>
                <div className="mb-2">
                  <strong>Team Membership Loading:</strong> {isTeamMembershipLoading ? 'Yes' : 'No'}
                </div>
                <div className="mb-2">
                  <strong>Team Memberships:</strong> {teamMembership ? JSON.stringify(teamMembership, null, 2) : 'No memberships'}
                </div>
                <div className="mb-2">
                  <strong>Server Auth Debug:</strong> {debugResponse ? JSON.stringify(debugResponse, null, 2) : 'Not checked yet'}
                </div>
                <div className="mb-2">
                  <strong>Team Data:</strong> {team ? JSON.stringify(team, null, 2) : 'No team data'} 
                </div>
                <div className="mb-2">
                  <strong>Team Error:</strong> {teamError ? String(teamError) : 'None'}
                </div>
                <div>
                  <strong>Request Logs:</strong> <pre>{JSON.stringify(requestLogs, null, 2)}</pre>
                </div>
                <div className="mt-4 space-x-2">
                  <Button onClick={refreshUserData} className="mt-2">Refresh Auth Data</Button>
                  <Button onClick={testDirectFetch} className="mt-2" disabled={isFetching}>
                    {isFetching ? 'Testing...' : 'Test API Endpoints'}
                  </Button>
                  <Button onClick={() => setShowDebug(false)} className="mt-2">Hide Debug</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // If loading, show loading state
  if (isTeamLoading) {
    return <div>Loading team settings...</div>;
  }

  // If we have an error loading team data
  if (teamError && !team) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTitle>Error Loading Team Data</AlertTitle>
            <AlertDescription>{String(teamError)}</AlertDescription>
          </Alert>
          <div className="mt-4 space-x-2">
            <Button onClick={() => refetchTeam()} className="mt-2">Retry</Button>
            <Button onClick={() => setLocation('/login')} className="mt-2" variant="outline">
              Go to Login
            </Button>
            <Button onClick={testDirectFetch} className="mt-2" disabled={isFetching}>
              {isFetching ? 'Testing...' : 'Test Direct Fetch'}
            </Button>
          </div>

          {showDebug && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h3 className="text-lg font-bold mb-2">Debug Information</h3>
              <div className="text-xs font-mono overflow-auto">
                <div className="mb-2">
                  <strong>Team ID:</strong> {teamId}
                </div>
                <div className="mb-2">
                  <strong>Error Details:</strong> {String(teamError)}
                </div>
                <div className="mb-2">
                  <strong>Current User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}
                </div>
                <div className="mb-2">
                  <strong>Authentication Status:</strong> {user ? 'Logged in' : 'Not logged in'}
                </div>
                
                {directFetchError && (
                  <div className="mb-2 text-red-500">
                    <strong>Direct Fetch Error:</strong> {directFetchError}
                  </div>
                )}
                
                {directFetchResponse && (
                  <div className="mb-2">
                    <strong>Direct Fetch Response:</strong> {JSON.stringify(directFetchResponse, null, 2)}
                  </div>
                )}
                
                <div className="mt-4 space-x-2">
                  <Button onClick={refreshUserData} className="mt-2">Refresh Auth Data</Button>
                  <Button onClick={testDirectFetch} className="mt-2" disabled={isFetching}>
                    {isFetching ? 'Testing...' : 'Test API Endpoints'}
                  </Button>
                  <Button onClick={() => setShowDebug(false)} className="mt-2">Hide Debug</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Otherwise render the team settings form
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-8">
          {/* General Team Settings Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input 
                  id="name" 
                  {...register('name', { 
                    required: "Team name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" }
                  })} 
                  aria-invalid={errors.name ? "true" : "false"}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Team Description</Label>
                <Textarea 
                  id="description" 
                  {...register('description')} 
                  placeholder="Optional description" 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seasonStartDate">Season Start Date</Label>
                  <Input 
                    id="seasonStartDate" 
                    type="date" 
                    {...register('seasonStartDate')} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seasonEndDate">Season End Date</Label>
                  <Input 
                    id="seasonEndDate" 
                    type="date" 
                    {...register('seasonEndDate')} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teamFee">Team Fee ($)</Label>
                <Input 
                  id="teamFee" 
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('teamFee', {
                    validate: value => value === '' || !isNaN(Number(value)) || "Must be a valid number"
                  })} 
                  placeholder="Leave empty for no fee"
                />
                {errors.teamFee && <p className="text-red-500 text-sm">{errors.teamFee.message}</p>}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation(`/teams/${teamId}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTeamMutation.isPending}
                >
                  {updateTeamMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </div>
          
          <Separator className="my-8" />
          
          {/* Player Management Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Player Management</h2>
            
            <div>
              <PlayerList teamId={teamId} showEditControls={true} />
            </div>
          </div>
        </div>

        {/* Add debug toggle button to the bottom */}
        {!showDebug && (
          <div className="mt-6">
            <Button onClick={() => setShowDebug(true)} variant="outline" size="sm">
              Show Debug Panel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};