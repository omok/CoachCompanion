import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { TeamRoster } from "@/components/team-roster";
import { AttendanceTracker } from "@/components/attendance-tracker";
import { PracticeNotes } from "@/components/practice-notes";
import { PaymentTracker } from "@/components/payment-tracker";
import { TeamSettings } from "@/components/team-settings";
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
  Settings,
} from "lucide-react";
import { CreateTeamDialog } from "@/components/create-team-dialog";
import { USER_ROLES, type UserRole } from '@shared/constants';
import { userRoleHasPermission, USER_ROLE_PERMISSIONS } from '@shared/access-control';
import { usePermissions } from "@/hooks/usePermissions";
import { useTeamMember, type TeamMembership } from "@/hooks/useTeamMember";
import { useMemo } from "react";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { 
    canSeeTeamRoster,
    canTakeAttendance,
    canAddPracticeNote,
    canManagePayments,
    canManageTeamSettings
  } = usePermissions();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"roster" | "attendance" | "notes" | "payments" | "settings">("roster");

  // Fetch teams data
  const { data: teams, isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Fetch team memberships for the current user
  const { teamMembership, isLoading: isLoadingMemberships } = useTeamMember();

  // Create a map of teamId -> role for quick lookup
  const teamRoleMap = useMemo(() => {
    const map = new Map<number, string>();
    teamMembership.forEach(membership => {
      map.set(membership.teamId, membership.role);
    });
    return map;
  }, [teamMembership]);

  // Sort teams by name and attach role information
  const sortedTeamsWithRoles = useMemo(() => {
    if (!teams) return [];
    
    return [...teams]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(team => ({
        ...team,
        userRole: teamRoleMap.get(team.id) || ""
      }));
  }, [teams, teamRoleMap]);

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
          {isLoadingTeams || isLoadingMemberships ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <div className="space-y-1">
              {sortedTeamsWithRoles.map((team) => (
                <Button
                  key={team.id}
                  variant={selectedTeamId === team.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTeamId(team.id)}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  <span className="text-left truncate">
                    {team.name}
                    {team.userRole && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({team.userRole})
                      </span>
                    )}
                  </span>
                </Button>
              ))}
              {user?.role && userRoleHasPermission(user.role as UserRole, USER_ROLE_PERMISSIONS.CREATE_NEW_TEAM) && <CreateTeamDialog />}
            </div>
          )}
        </div>

        {/* Navigation */}
        {selectedTeamId && (
          <div className="p-4 border-b">
            <nav className="space-y-1">
              {canSeeTeamRoster(selectedTeamId) && (
                <Button
                  variant={activeTab === "roster" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("roster")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team Roster
                </Button>
              )}
              {canTakeAttendance(selectedTeamId) && (
                <Button
                  variant={activeTab === "attendance" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("attendance")}
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Attendance
                </Button>
              )}
              {canAddPracticeNote(selectedTeamId) && (
                <Button
                  variant={activeTab === "notes" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("notes")}
                >
                  <Book className="h-4 w-4 mr-2" />
                  Practice Notes
                </Button>
              )}
              {canManagePayments(selectedTeamId) && (
                <Button
                  variant={activeTab === "payments" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("payments")}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payments
                </Button>
              )}
              {canManageTeamSettings(selectedTeamId) && (
                <Button
                  variant={activeTab === "settings" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
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
            {activeTab === "roster" && canSeeTeamRoster(selectedTeamId) && <TeamRoster teamId={selectedTeamId} />}
            {activeTab === "attendance" && canTakeAttendance(selectedTeamId) && <AttendanceTracker teamId={selectedTeamId} />}
            {activeTab === "notes" && canAddPracticeNote(selectedTeamId) && <PracticeNotes teamId={selectedTeamId} />}
            {activeTab === "payments" && canManagePayments(selectedTeamId) && <PaymentTracker teamId={selectedTeamId} />}
            {activeTab === "settings" && canManageTeamSettings(selectedTeamId) && <TeamSettings teamId={selectedTeamId} />}
          </>
        )}
      </div>
    </div>
  );
}