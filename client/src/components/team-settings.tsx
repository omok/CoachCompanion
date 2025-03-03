import React, { useState, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from "wouter";
import { useForm } from 'react-hook-form';
import { usePermissions } from '../hooks/usePermissions';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PlayerForm } from "@/components/player-form";
import { PlayerList } from "@/components/player-list";
import { AuthContext } from "../contexts/AuthContext";
import { useTeamMember } from '../hooks/useTeamMember';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/use-auth';

type TeamSettings = {
  name: string;
  description: string;
  seasonStartDate: string;
  seasonEndDate: string;
  teamFee: string;
};

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

  // IMPORTANT: All hooks must be called unconditionally before any conditional logic
  // Fetch team data - call useQuery unconditionally
  const { 
    data: team, 
    isLoading: isTeamLoading 
  } = useQuery({
    queryKey: [`/api/teams/${teamId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/teams/${teamId}`);
        if (!response.ok) throw new Error('Failed to fetch team');
        return response.json();
      } catch (error) {
        console.error(`Error fetching team ${teamId}:`, error);
        return null; // Return null instead of throwing to avoid React Query retries
      }
    },
    // Only enable this query if the user has permission
    enabled: canManageTeamSettings(teamId),
  });

  // Setup the form - must be called unconditionally
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
      reset({
        name: team.name || '',
        description: team.description || '',
        seasonStartDate: team.seasonStartDate ? format(new Date(team.seasonStartDate), 'yyyy-MM-dd') : '',
        seasonEndDate: team.seasonEndDate ? format(new Date(team.seasonEndDate), 'yyyy-MM-dd') : '',
        teamFee: team.teamFee?.toString() || '',
      });
    }
  }, [team, reset]);

  // Update team settings mutation - must be called unconditionally
  const updateTeamMutation = useMutation({
    mutationFn: async (data: TeamSettings) => {
      if (!canManageTeamSettings(teamId)) {
        throw new Error('Permission denied to update team settings');
      }
      
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}`] });
      setSuccess('Team settings updated successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: Error) => {
      setError(error.message);
      setSuccess(null);
    },
  });

  // On mount, refresh auth and team membership data
  useEffect(() => {
    console.log(`[TeamSettings] Component mounted for teamId: ${teamId}`);
    const refreshData = async () => {
      try {
        await refreshUser();
        await refetchTeamMembership();
        console.log(`[TeamSettings] Auth and team data refreshed for teamId: ${teamId}`);
      } catch (err) {
        console.error(`[TeamSettings] Error refreshing data:`, err);
      }
    };
    
    refreshData();
  }, [teamId, refreshUser, refetchTeamMembership]);

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
      
      setSuccess('Auth data refreshed. Check console for details.');
      console.log('[TeamSettings] Auth check:', authCheckData);
      console.log('[TeamSettings] Current user:', user);
      console.log('[TeamSettings] Team memberships:', teamMembership);
    } catch (err) {
      setError('Failed to refresh auth data');
      console.error('[TeamSettings] Auth refresh error:', err);
    }
  };

  // Log whenever permission check result changes
  useEffect(() => {
    const hasPermission = canManageTeamSettings(teamId);
    console.log(`[TeamSettings] Permission check for teamId ${teamId}: ${hasPermission ? 'GRANTED' : 'DENIED'}`);
  }, [canManageTeamSettings, teamId, user, teamMembership]);

  // Submit handler
  const onSubmit = (data: TeamSettings) => {
    updateTeamMutation.mutate(data);
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
                <div>
                  <strong>Request Logs:</strong> <pre>{JSON.stringify(requestLogs, null, 2)}</pre>
                </div>
                <div className="mt-4 space-x-2">
                  <Button onClick={refreshUserData}>Refresh Auth Data</Button>
                  <Button onClick={() => setShowDebug(false)}>Hide Debug</Button>
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="players">Player Management</TabsTrigger>
          </TabsList>
          
          {/* General Team Settings */}
          <TabsContent value="general">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input 
                  id="name" 
                  {...register('name', { required: "Team name is required" })} 
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Team Description</Label>
                <Textarea 
                  id="description" 
                  {...register('description')} 
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
                  {...register('teamFee')} 
                />
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
          </TabsContent>
          
          {/* Player Management */}
          <TabsContent value="players">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Add New Player</h3>
                <PlayerForm teamId={teamId} />
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Manage Players</h3>
                <PlayerList teamId={teamId} showEditControls={true} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 