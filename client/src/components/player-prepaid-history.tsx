import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/hooks/use-toast";

interface SessionBalance {
  id: number;
  playerId: number;
  teamId: number;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  expirationDate: string | null;
  lastUpdatedByUser: number;
}

interface SessionTransaction {
  id: number;
  playerId: number;
  teamId: number;
  date: string;
  sessionChange: number;
  reason: string;
  notes: string | null;
}

interface SessionData {
  balance: SessionBalance | null;
  transactions: SessionTransaction[];
}

interface PlayerPrepaidHistoryProps {
  teamId: number;
  playerId: number;
}

export function PlayerPrepaidHistory({ teamId, playerId }: PlayerPrepaidHistoryProps) {
  const { hasTeamRolePermission } = usePermissions();

  const formatDisplayDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Get session balance for this player
  const { data: sessionData, isLoading: isLoadingSessionBalance, error } = useQuery<{
    balance: SessionBalance | null;
    transactions: SessionTransaction[];
  }>({
    queryKey: [`/api/teams/${teamId}/sessions/${playerId}`],
    enabled: !!teamId && !!playerId,
  });

  const isLoading = isLoadingSessionBalance;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Handle errors
  if (error) {
    console.error("Error fetching session data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to load session data";
    
    // Check for specific error types
    if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
      return (
        <div className="text-center py-4 text-red-500">
          You must be logged in to view session data
        </div>
      );
    }
    
    if (errorMessage.includes("403") || errorMessage.includes("Insufficient permissions")) {
      return (
        <div className="text-center py-4 text-red-500">
          You don't have permission to view session data
        </div>
      );
    }
    
    return (
      <div className="text-center py-4 text-red-500">
        {errorMessage}
      </div>
    );
  }

  // If no data is available, show empty state
  if (!sessionData) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No session data available
      </div>
    );
  }

  const hasBalance = sessionData.balance !== null;
  const hasTransactions = sessionData.transactions && sessionData.transactions.length > 0;

  // Calculate session counts
  const totalSessions = hasBalance && sessionData.balance ? sessionData.balance.totalSessions : 0;
  const usedSessions = hasBalance && sessionData.balance ? sessionData.balance.usedSessions : 0;
  const remainingSessions = hasBalance && sessionData.balance ? sessionData.balance.remainingSessions : 0;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold">
              {totalSessions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base">Used Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold">
              {usedSessions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base">Remaining Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold">
              {remainingSessions}
            </div>
            {hasBalance && sessionData.balance?.expirationDate && (
              <div className="text-xs text-muted-foreground mt-1">
                Expires {formatDisplayDate(sessionData.balance.expirationDate)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {hasTransactions ? (
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Session History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date/Time</TableHead>
                    <TableHead className="text-xs sm:text-sm">Change</TableHead>
                    <TableHead className="text-xs sm:text-sm">Reason</TableHead>
                    <TableHead className="text-xs sm:text-sm">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionData.transactions.map((transaction: SessionTransaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{formatDisplayDate(transaction.date)}</TableCell>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-4">
                        <span className={transaction.sessionChange > 0 ? 'text-green-600' : 'text-red-600'}>
                          {transaction.sessionChange > 0 ? '+' : ''}{transaction.sessionChange}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-4 capitalize">{transaction.reason}</TableCell>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-4 truncate max-w-[150px] sm:max-w-none">{transaction.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">No session history available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
