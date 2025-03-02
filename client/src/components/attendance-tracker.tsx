import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Player, Attendance } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Save, ArrowRightIcon, ArrowLeftIcon, Check, X } from "lucide-react";
import { AttendanceStats } from "./attendance-stats";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define a logger function to help with debugging
const logEvent = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data ? data : '');
};

export function AttendanceTracker({ teamId }: { teamId: number }) {
  const logger = (action: string, data?: any) => logEvent('AttendanceTracker', action, data);
  
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceState, setAttendanceState] = useState<Record<number, boolean>>({});
  // Track which players are currently being updated to prevent double-toggles
  const [updatingPlayers, setUpdatingPlayers] = useState<Set<number>>(new Set());
  const isCoach = user?.role === "coach";

  // Keep track of previous attendance state for logging changes
  const prevAttendanceStateRef = useRef<Record<number, boolean>>({});

  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  // Filter to only show active players - memoized to prevent infinite loops
  const activePlayers = useMemo(() => 
    players?.filter(player => player.active) || [],
    [players]
  );

  const { data: attendance, isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/teams/${teamId}/attendance`],
  });

  // Add effect to handle success and error of attendance query
  useEffect(() => {
    if (attendance) {
      logger('Attendance data fetched', { 
        count: attendance.length, 
        firstFew: attendance.slice(0, 3) 
      });
    }
  }, [attendance]);

  // Helper function to format date to YYYY-MM-DD
  function formatDateString(date: Date): string {
    return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
  }

  // Reset attendance state when date or data changes
  useEffect(() => {
    if (!attendance || !activePlayers.length) return; // Early return if data isn't loaded
    
    // Reset all active players to not present
    const newState: Record<number, boolean> = {};
    activePlayers.forEach(player => {
      newState[player.id] = false;
    });

    // Find attendance records for the selected date
    const selectedDateStr = formatDateString(selectedDate);
    
    // Ensure attendance is used correctly
    attendance.forEach((record: Attendance) => {
      const recordDateStr = formatDateString(new Date(record.date));
      if (recordDateStr === selectedDateStr) {
        newState[record.playerId] = record.present;
      }
    });
    
    setAttendanceState(newState);
  }, [selectedDate, attendance, activePlayers]);

  // Memoize presentPlayers and absentPlayers to prevent recalculation on every render
  const presentPlayers = useMemo(() => 
    activePlayers.filter(player => attendanceState[player.id]) || [],
    [activePlayers, attendanceState]
  );
  
  const absentPlayers = useMemo(() => 
    activePlayers.filter(player => !attendanceState[player.id]) || [],
    [activePlayers, attendanceState]
  );

  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      // Get the date string in YYYY-MM-DD format
      const dateStr = formatDateString(selectedDate);

      // Create date at noon to avoid timezone issues
      const localDate = new Date(dateStr + 'T12:00:00');

      // Collect all attendance records
      const records = Object.entries(attendanceState).map(([playerId, present]) => ({
        playerId: parseInt(playerId),
        teamId,
        date: localDate.toISOString(),
        present,
      }));

      logger('Saving attendance', { 
        date: localDate.toISOString(), 
        recordCount: records.length,
        presentPlayers: records.filter(r => r.present).length,
        absentPlayers: records.filter(r => !r.present).length
      });

      try {
        const res = await apiRequest("POST", `/api/teams/${teamId}/attendance`, {
          date: localDate.toISOString(),
          records: records
        });
        
        logger('Attendance API response', { 
          status: res.status,
          statusText: res.statusText
        });
        
        return res.json();
      } catch (error) {
        logger('Error saving attendance', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      logger('Successfully saved attendance', data);
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/attendance`] });
    },
    onError: (error) => {
      logger('Error in saveAttendanceMutation', error);
    }
  });

  if (isLoadingPlayers || isLoadingAttendance) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Simplified function to toggle player attendance without complex event loop
  const toggleAttendance = (playerId: number, e: React.MouseEvent) => {
    // Stop event propagation to prevent any parent handlers from firing
    e.stopPropagation();
    e.preventDefault();
    
    logger('Toggle attendance clicked', { 
      playerId, 
      currentStatus: attendanceState[playerId] ? 'Present' : 'Absent',
      isAlreadyUpdating: updatingPlayers.has(playerId)
    });
    
    // If the player is already being updated, don't do anything
    if (updatingPlayers.has(playerId)) {
      logger('Ignoring click - player update already in progress', { playerId });
      return;
    }

    // Add player to updating set to prevent double-clicks
    setUpdatingPlayers(prev => {
      const newSet = new Set(prev);
      newSet.add(playerId);
      return newSet;
    });

    // Update attendance state
    setAttendanceState(prev => {
      const newState = { ...prev, [playerId]: !prev[playerId] };
      
      // Remove player from updating set after a short delay
      setTimeout(() => {
        setUpdatingPlayers(current => {
          const newSet = new Set(current);
          newSet.delete(playerId);
          return newSet;
        });
      }, 300); // Reduced delay time
      
      return newState;
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {isCoach ? "Take Attendance" : "Attendance Record"}
          </h2>
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  logger('Date changed', { 
                    from: selectedDate.toLocaleDateString(),
                    to: date.toLocaleDateString()
                  });
                  setSelectedDate(date);
                }
              }}
              className="rounded-md border"
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Attendance for {selectedDate.toLocaleDateString()}
                </h3>
                {isCoach && (
                  <Button 
                    onClick={() => {
                      logger('Save attendance button clicked');
                      saveAttendanceMutation.mutate();
                    }}
                    disabled={saveAttendanceMutation.isPending}
                  >
                    {saveAttendanceMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Attendance
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isCoach ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Absent Players List */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center text-red-500">
                        <X className="h-4 w-4 mr-2" />
                        Absent ({absentPlayers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {absentPlayers.length > 0 ? (
                        <ul className="space-y-1">
                          {absentPlayers.map(player => (
                            <li key={player.id} className="flex items-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full justify-between text-left font-normal h-auto py-1"
                                onClick={(e) => toggleAttendance(player.id, e)}
                                disabled={updatingPlayers.has(player.id)}
                              >
                                {player.name}
                                {updatingPlayers.has(player.id) ? (
                                  <Loader2 className="h-3 w-3 ml-2 animate-spin" />
                                ) : (
                                  <ArrowRightIcon className="h-4 w-4 ml-2 text-green-500" />
                                )}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">No absent players</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Present Players List */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center text-green-500">
                        <Check className="h-4 w-4 mr-2" />
                        Present ({presentPlayers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {presentPlayers.length > 0 ? (
                        <ul className="space-y-1">
                          {presentPlayers.map(player => (
                            <li key={player.id} className="flex items-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full justify-between text-left font-normal h-auto py-1"
                                onClick={(e) => toggleAttendance(player.id, e)}
                                disabled={updatingPlayers.has(player.id)}
                              >
                                {updatingPlayers.has(player.id) ? (
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                ) : (
                                  <ArrowLeftIcon className="h-4 w-4 mr-2 text-red-500" />
                                )}
                                {player.name}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">No present players</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Absent Players List (Read-only) */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center text-red-500">
                        <X className="h-4 w-4 mr-2" />
                        Absent ({absentPlayers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {absentPlayers.length > 0 ? (
                        <ul className="space-y-1">
                          {absentPlayers.map(player => (
                            <li key={player.id} className="py-1 px-2 text-sm">
                              {player.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">No absent players</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Present Players List (Read-only) */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center text-green-500">
                        <Check className="h-4 w-4 mr-2" />
                        Present ({presentPlayers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {presentPlayers.length > 0 ? (
                        <ul className="space-y-1">
                          {presentPlayers.map(player => (
                            <li key={player.id} className="py-1 px-2 text-sm">
                              {player.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">No present players</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Attendance Statistics</h2>
          <AttendanceStats teamId={teamId} />
        </div>
      </div>
    </div>
  );
}