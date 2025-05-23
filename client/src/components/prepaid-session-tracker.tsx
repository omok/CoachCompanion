import React, { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Player, SessionBalance } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { usePlayerContext } from "./player-context";
import { useLocation } from "wouter";



// Helper function to get today's date in YYYY-MM-DD format
function getTodayInYYYYMMDD(): string {
  return new Date().toISOString().split('T')[0];
}

// Form schema for adding prepaid sessions
const formSchema = z.object({
  playerId: z.coerce.number().positive("Please select a player"),
  sessionCount: z.coerce.number().int().positive("Session count must be a positive integer"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PrepaidSessionTrackerProps {
  teamId: number;
}

export function PrepaidSessionTracker({ teamId }: PrepaidSessionTrackerProps) {
  const { toast } = useToast();
  const { showPlayerDetails } = usePlayerContext();
  const [location] = useLocation();

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: getTodayInYYYYMMDD(),
      sessionCount: 10,
    },
  });

  // Fetch players
  const { data: players, isLoading: isLoadingPlayers, refetch: refetchPlayers } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
    refetchOnWindowFocus: false, // We'll handle focus manually
  });

  // Fetch session balances
  const { data: sessionBalances, isLoading: isLoadingSessionBalances, refetch: refetchSessionBalances } = useQuery<SessionBalance[]>({
    queryKey: [`/api/teams/${teamId}/sessions`],
    initialData: [],
    retry: false,
    refetchOnWindowFocus: false, // We'll handle focus manually
  });

  // Refetch data on window focus (navigation back, tab focus, etc)
  useEffect(() => {
    const handleFocus = () => {
      refetchPlayers();
      refetchSessionBalances();
      // Invalidate all per-player session queries for active players
      if (players) {
        players.filter(p => p.active).forEach(player => {
          queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/sessions/${player.id}`] });
        });
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchPlayers, refetchSessionBalances, players, teamId]);

  // Refetch data on navigation to the Prepaid page
  useEffect(() => {
    // Adjust this path to match your actual Prepaid page route
    const isPrepaidPage = location.includes("prepaid");
    if (isPrepaidPage) {
      refetchPlayers();
      refetchSessionBalances();
      if (players) {
        players.filter(p => p.active).forEach(player => {
          queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/sessions/${player.id}`] });
        });
      }
    }
  }, [location, refetchPlayers, refetchSessionBalances, players, teamId]);

  // Mutation for adding prepaid sessions
  const addSessionsMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { playerId, sessionCount, notes } = data;
      let currentBalanceData: any = null;

      try {
        // First, get the current session balance
        const currentBalanceResponse = await fetch(`/api/teams/${teamId}/sessions/${playerId}`);
        if (!currentBalanceResponse.ok) {
          throw new Error('Failed to fetch current session balance');
        }
        currentBalanceData = await currentBalanceResponse.json();

        // Calculate new totals
        const newTotalSessions = sessionCount;
        const usedSessions = currentBalanceData.balance?.usedSessions || 0;
        const newRemainingSessions = Math.max(newTotalSessions - usedSessions, 0);

        // Call the API to update session balance
        const response = await fetch(`/api/teams/${teamId}/sessions/${playerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            totalSessions: newTotalSessions,
            usedSessions: usedSessions,
            remainingSessions: newRemainingSessions,
            notes: notes || `Set prepaid session balance to ${sessionCount} without payment`
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add prepaid sessions');
        }

        return { result: await response.json(), currentBalance: currentBalanceData };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: ({ result, currentBalance }) => {
      // Update the cache with the new session balance
      queryClient.setQueryData([`/api/teams/${teamId}/sessions`], (oldData: any) => {
        if (!oldData) return [result];
        
        const index = oldData.findIndex((b: any) => b.playerId === result.playerId);
        if (index >= 0) {
          const newData = [...oldData];
          newData[index] = result;
          return newData;
        }
        return [...oldData, result];
      });

      // Invalidate queries to refresh 'Sessions Left' for all users
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/sessions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/sessions/${result.playerId}`] });
      // Invalidate all per-player session queries for active players
      if (players) {
        players.filter(p => p.active).forEach(player => {
          queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/sessions/${player.id}`] });
        });
      }

      // Reset form
      form.reset({
        date: getTodayInYYYYMMDD(),
        sessionCount: 10,
      });

      // Show success message
      toast({
        title: "Session Balance Set",
        description: `Prepaid session balance has been set to ${result.totalSessions} sessions.`,
      });
    },
    onError: (error) => {
      // Show a more user-friendly error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was a problem adding prepaid sessions. Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormData) => {
    // Validate the data
    if (!data.playerId) {
      toast({
        title: "Error",
        description: "Please select a player",
        variant: "destructive",
      });
      return;
    }

    if (!data.sessionCount || data.sessionCount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of sessions",
        variant: "destructive",
      });
      return;
    }

    // Submit the mutation
    addSessionsMutation.mutate(data);
  };

  // Filter and sort active players
  const activePlayers = (players?.filter(player => player.active) || []).sort((a, b) => a.name.localeCompare(b.name));

  // Loading state
  if (isLoadingPlayers || isLoadingSessionBalances) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" role="status" />
      </div>
    );
  }

  // Format session balances for display
  const sessionBalancesWithNames = (sessionBalances ?? [])
    .map((balance: SessionBalance) => {
      const player = players?.find((p) => p.id === balance.playerId);

      return {
        ...balance,
        playerName: player?.name || "Unknown Player",
        isActive: player?.active || false
      };
    })
    .filter((balance: any) => balance.isActive)
    .sort((a: any, b: any) => a.playerName.localeCompare(b.playerName));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sessions Left - now shown first */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions Left</CardTitle>
            <CardDescription>
              Remaining prepaid sessions for each player
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activePlayers.length > 0 ? (
              <div className="space-y-2">
                {activePlayers.map((player) => {
                  // Get session balance for this player
                  const { data: sessionData } = useQuery<{
                    balance: SessionBalance | null;
                    transactions: any[];
                  }>({
                    queryKey: [`/api/teams/${teamId}/sessions/${player.id}`],
                    enabled: !!teamId && !!player.id,
                  });

                  const balance = sessionData?.balance;
                  const remainingSessions = balance?.remainingSessions || 0;
                  const totalSessions = balance?.totalSessions || 0;

                  return (
                    <div
                      key={player.id}
                      className="flex justify-between items-center border-b pb-2"
                    >
                      <div
                        className="font-medium text-primary hover:text-primary/80 cursor-pointer"
                        onClick={() => showPlayerDetails(teamId, player.id)}
                      >
                        {player.name}
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-md ${
                          remainingSessions <= 2 ? 'bg-red-100 text-red-700' :
                          remainingSessions <= 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {remainingSessions} / {totalSessions}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                No active players found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Add Prepaid Sessions Form - now second, date input removed */}
        <Card>
          <CardHeader>
            <CardTitle>Set Prepaid Session Balance</CardTitle>
            <CardDescription>
              This will <span className="font-semibold text-red-600">override</span> the player's current prepaid session balance. Enter the total number of sessions the player should have after this update.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="playerId" className="text-sm font-medium">
                  Player
                </label>
                <Controller
                  control={form.control}
                  name="playerId"
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a player" />
                      </SelectTrigger>
                      <SelectContent>
                        {activePlayers.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.playerId && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.playerId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="sessionCount" className="text-sm font-medium">
                  Prepaid Session Balance
                </label>
                <Input
                  id="sessionCount"
                  type="number"
                  min={0}
                  {...form.register("sessionCount", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  This will <span className="font-semibold text-red-600">set</span> the player's prepaid session balance to this value, overriding any previous balance.
                </p>
                {form.formState.errors.sessionCount && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.sessionCount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes (Optional)
                </label>
                <Input
                  id="notes"
                  {...form.register("notes")}
                  placeholder="Session notes..."
                />
              </div>

              <Button
                type="submit"
                disabled={addSessionsMutation.isPending}
                className="w-full"
              >
                {addSessionsMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Set Session Balance
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
