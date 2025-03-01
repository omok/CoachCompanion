import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { TeamRoster } from "@/components/team-roster";
import { AttendanceTracker } from "@/components/attendance-tracker";
import { PracticeNotes } from "@/components/practice-notes";
import { PaymentTracker } from "@/components/payment-tracker";
import { useQuery } from "@tanstack/react-query";
import { Team } from "@shared/schema";
import {
  ClipboardList,
  LogOut,
  Users,
  CalendarCheck,
  Book,
  DollarSign,
  Loader2,
} from "lucide-react";
import { CreateTeamDialog } from "@/components/create-team-dialog";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"roster" | "attendance" | "notes" | "payments">("roster");

  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const selectedTeam = teams?.find((t) => t.id === selectedTeamId);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-card border-r">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold">{user?.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
        </div>

        {/* Team Selection */}
        <div className="p-4 border-b">
          <h2 className="text-sm font-medium mb-2">Teams</h2>
          {isLoadingTeams ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <div className="space-y-1">
              {teams?.map((team) => (
                <Button
                  key={team.id}
                  variant={selectedTeamId === team.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  {team.name}
                </Button>
              ))}
              {user?.role === "coach" && <CreateTeamDialog />}
            </div>
          )}
        </div>

        {/* Navigation */}
        {selectedTeamId && (
          <div className="p-4 border-b">
            <nav className="space-y-1">
              <Button
                variant={activeTab === "roster" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("roster")}
              >
                <Users className="h-4 w-4 mr-2" />
                Team Roster
              </Button>
              <Button
                variant={activeTab === "attendance" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("attendance")}
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
                Attendance
              </Button>
              {user?.role === "coach" && (
                <Button
                  variant={activeTab === "notes" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("notes")}
                >
                  <Book className="h-4 w-4 mr-2" />
                  Practice Notes
                </Button>
              )}
              {user?.role === "coach" && (
                <Button
                  variant={activeTab === "payments" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("payments")}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payments
                </Button>
              )}
            </nav>
          </div>
        )}

        {/* Logout */}
        <div className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {!selectedTeamId ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a team to get started</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">{selectedTeam?.name}</h1>
            {activeTab === "roster" && <TeamRoster teamId={selectedTeamId} />}
            {activeTab === "attendance" && <AttendanceTracker teamId={selectedTeamId} />}
            {activeTab === "notes" && user?.role === "coach" && <PracticeNotes teamId={selectedTeamId} />}
            {activeTab === "payments" && user?.role === "coach" && (
              <PaymentTracker teamId={selectedTeamId} />
            )}
          </>
        )}
      </div>
    </div>
  );
}