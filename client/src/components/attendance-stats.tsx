import { useQuery } from "@tanstack/react-query";
import { Attendance, Player } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

type AttendanceStats = {
  totalSessions: number;
  averageAttendance: number;
  playerStats: {
    playerId: number;
    playerName: string;
    attendanceRate: number;
    totalPresent: number;
  }[];
};

function calculateAttendanceStats(
  attendance: Attendance[],
  players: Player[],
): AttendanceStats {
  // Group attendance by date to count unique sessions
  const uniqueDates = new Set(attendance.map((a) => a.date.toString()));
  const totalSessions = uniqueDates.size;

  // Calculate player-specific stats
  const playerAttendance = new Map<number, number>();
  attendance.forEach((a) => {
    if (a.present) {
      playerAttendance.set(
        a.playerId,
        (playerAttendance.get(a.playerId) || 0) + 1,
      );
    }
  });

  const playerStats = players.map((player) => {
    const totalPresent = playerAttendance.get(player.id) || 0;
    return {
      playerId: player.id,
      playerName: player.name,
      attendanceRate: totalSessions ? (totalPresent / totalSessions) * 100 : 0,
      totalPresent,
    };
  });

  const averageAttendance =
    playerStats.reduce((sum, stat) => sum + stat.attendanceRate, 0) /
    (players.length || 1);

  return {
    totalSessions,
    averageAttendance,
    playerStats,
  };
}

export function AttendanceStats({ teamId }: { teamId: number }) {
  const { data: attendance, isLoading: isLoadingAttendance } = useQuery<
    Attendance[]
  >({
    queryKey: [`/api/teams/${teamId}/attendance`],
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  if (isLoadingAttendance || isLoadingPlayers) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!attendance || !players) return null;

  const stats = calculateAttendanceStats(attendance, players);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Attendance Overview</CardTitle>
          <CardDescription>
            Based on {stats.totalSessions} practice sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Team Average Attendance</span>
              <span className="font-medium">
                {stats.averageAttendance.toFixed(1)}%
              </span>
            </div>
            <Progress value={stats.averageAttendance} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.playerStats
              .sort((a, b) => b.attendanceRate - a.attendanceRate)
              .map((stat) => (
                <div key={stat.playerId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>{stat.playerName}</span>
                    <span className="font-medium">
                      {stat.attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={stat.attendanceRate} />
                  <p className="text-sm text-muted-foreground">
                    Present: {stat.totalPresent} / {stats.totalSessions} sessions
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
