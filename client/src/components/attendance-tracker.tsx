import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Player, Attendance, insertAttendanceSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { AttendanceStats } from "./attendance-stats";

export function AttendanceTracker({ teamId }: { teamId: number }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceState, setAttendanceState] = useState<Record<number, boolean>>({});

  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  const { data: attendance, isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/teams/${teamId}/attendance`],
  });

  // Update attendance state when date changes or new attendance data is loaded
  useEffect(() => {
    if (attendance && players) {
      // Reset all players to not present
      const newState: Record<number, boolean> = {};
      players.forEach(player => {
        newState[player.id] = false;
      });

      // Find attendance records for the selected date
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      attendance.forEach(record => {
        const recordDateStr = new Date(record.date).toISOString().split('T')[0];
        if (recordDateStr === selectedDateStr) {
          newState[record.playerId] = record.present;
        }
      });

      setAttendanceState(newState);
    }
  }, [selectedDate, attendance, players]);

  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      // Format date as YYYY-MM-DD
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Collect all attendance records
      const records = Object.entries(attendanceState).map(([playerId, present]) => ({
        playerId: parseInt(playerId),
        teamId,
        date: dateStr,
        present,
      }));

      const res = await apiRequest("POST", `/api/teams/${teamId}/attendance`, {
        date: dateStr,
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

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Take Attendance</h2>
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
              </div>

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
                      <TableCell>{player.name}</TableCell>
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