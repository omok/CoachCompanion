import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Player, Attendance } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save, ExternalLink, Check, X } from "lucide-react";
import { AttendanceStats } from "./attendance-stats";
import { usePlayerContext } from "./player-context";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export function AttendanceTracker({ teamId }: { teamId: number }) {
  const { user } = useAuth();
  const { showPlayerDetails } = usePlayerContext();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceState, setAttendanceState] = useState<Record<number, boolean>>({});
  const isCoach = user?.role === "coach";

  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  const { data: attendance, isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/teams/${teamId}/attendance`],
  });

  // Helper function to format date to YYYY-MM-DD
  function formatDateString(date: Date): string {
    return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
  }

  useEffect(() => {
    if (attendance && players) {
      // Reset all players to not present
      const newState: Record<number, boolean> = {};
      players.forEach(player => {
        newState[player.id] = false;
      });

      // Find attendance records for the selected date
      const selectedDateStr = formatDateString(selectedDate);
      attendance.forEach(record => {
        const recordDateStr = formatDateString(new Date(record.date));
        if (recordDateStr === selectedDateStr) {
          newState[record.playerId] = record.present;
        }
      });

      setAttendanceState(newState);
    }
  }, [selectedDate, attendance, players]);

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

      const res = await apiRequest("POST", `/api/teams/${teamId}/attendance`, {
        date: localDate.toISOString(),
        records: records
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/attendance`] });
    },
  });

  if (isLoadingPlayers || isLoadingAttendance) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Get present players for the selected date
  const presentPlayers = players?.filter(player => attendanceState[player.id]) || [];
  const absentPlayers = players?.filter(player => !attendanceState[player.id]) || [];

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
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Attendance for {selectedDate.toLocaleDateString()}
                </h3>
                {isCoach && (
                  <Button 
                    onClick={() => saveAttendanceMutation.mutate()}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead className="w-24">Present</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players?.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div 
                            className="font-medium text-primary hover:text-primary/80 cursor-pointer"
                            onClick={() => showPlayerDetails(teamId, player.id)}
                          >
                            {player.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={attendanceState[player.id] ?? false}
                            onCheckedChange={(checked) =>
                              setAttendanceState((prev) => ({
                                ...prev,
                                [player.id]: checked === true,
                              }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Present ({presentPlayers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {presentPlayers.length > 0 ? (
                        presentPlayers.map(player => (
                          <Badge key={player.id} variant="outline" className="cursor-pointer hover:bg-muted">
                            <div 
                              className="font-medium"
                              onClick={() => showPlayerDetails(teamId, player.id)}
                            >
                              {player.name}
                            </div>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No players marked as present</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <X className="h-4 w-4 mr-2 text-red-500" />
                      Absent ({absentPlayers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {absentPlayers.length > 0 ? (
                        absentPlayers.map(player => (
                          <Badge key={player.id} variant="outline" className="cursor-pointer hover:bg-muted">
                            <div 
                              className="font-medium"
                              onClick={() => showPlayerDetails(teamId, player.id)}
                            >
                              {player.name}
                            </div>
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No players marked as absent</p>
                      )}
                    </div>
                  </div>
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