import { useState } from "react";
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

  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  const { data: attendance, isLoading: isLoadingAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/teams/${teamId}/attendance`],
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/attendance`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/attendance`] });
    },
  });

  const [attendanceState, setAttendanceState] = useState<Record<number, boolean>>({});

  const handleSaveAttendance = () => {
    Object.entries(attendanceState).forEach(([playerId, present]) => {
      saveAttendanceMutation.mutate({
        playerId: parseInt(playerId),
        teamId,
        date: selectedDate,
        present,
      });
    });
  };

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
                <Button onClick={handleSaveAttendance}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Attendance
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