import { useQuery, useMutation } from "@tanstack/react-query";
import { Payment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

interface PlayerPaymentRecordsProps {
  teamId: number;
  playerId: number;
}

// Helper function to format dates
function formatDisplayDate(dateString: string | Date): string {
  if (!dateString) return '';
  
  if (dateString instanceof Date) {
    try {
      return format(dateString, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting Date object:', err);
      return dateString.toLocaleDateString();
    }
  }
  
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date string:', err);
      return dateString;
    }
  }
  
  try {
    return format(new Date(String(dateString)), 'MMM d, yyyy');
  } catch (err) {
    console.error('Error formatting date:', err);
    return String(dateString);
  }
}

export function PlayerPaymentRecords({ teamId, playerId }: PlayerPaymentRecordsProps) {
  const { user } = useAuth();
  const { canManagePayments } = usePermissions();
  const hasPaymentPermissions = canManagePayments(teamId);
  
  // We'll use the team-wide payment endpoint and filter client-side
  // This works around the server-side user role check in the player-specific endpoint
  const { data: allTeamPayments, isLoading } = useQuery<Payment[]>({
    queryKey: [`/api/teams/${teamId}/payments`],
    enabled: !!teamId && !!playerId && hasPaymentPermissions,
  });
  
  // Filter payments for this player
  const playerPayments = allTeamPayments?.filter(payment => payment.playerId === playerId) || [];
  
  // Calculate payment total
  const paymentTotal = playerPayments.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold">
              ${paymentTotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base">Payment Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold">
              {playerPayments.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 sm:pb-4 flex flex-row justify-between items-center">
          <CardTitle className="text-lg sm:text-xl">Payment History</CardTitle>
          {/* Payment management UI can be added here */}
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {playerPayments.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-xs sm:text-sm">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playerPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-4">{formatDisplayDate(payment.date)}</TableCell>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-4">${Number(payment.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-xs sm:text-sm py-2 sm:py-4 truncate max-w-[150px] sm:max-w-none">{payment.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground text-sm">No payment records found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 