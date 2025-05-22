import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Payment, Player, insertPaymentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { format, parseISO } from "date-fns";
import { Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { Link } from "wouter";
import { usePlayerContext } from "./player-context";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Helper function for consistent date handling - get today's date in YYYY-MM-DD format
function getTodayInYYYYMMDD(): string {
  return new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
}

// Helper function to format display dates for UI
function formatDisplayDate(dateString: string): string {
  if (!dateString) return '';

  // If it's already in YYYY-MM-DD format, use it directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return dateString;
    }
  }

  // Otherwise try to parse it as an ISO string
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (err) {
    console.error('Error formatting date:', err);
    return dateString;
  }
}

const formSchema = z.object({
  playerId: z.coerce.number().positive("Please select a player"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Amount must be a positive number" }
  ),
  date: z.string().min(1, "Date is required"),
  sessionCount: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function PaymentTracker({ teamId, feeType }: { teamId: number, feeType?: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { showPlayerDetails } = usePlayerContext();
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: getTodayInYYYYMMDD(), // Using our helper function
      amount: "",
    },
  });

  const { data: players, isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: [`/api/teams/${teamId}/payments`],
  });

  const { data: paymentTotals, isLoading: isLoadingTotals } = useQuery<
    { playerId: number; totalAmount: string | null }[]
  >({
    queryKey: [`/api/teams/${teamId}/payments/totals`],
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/payments`, {
        ...data,
        teamId,
        ...(feeType === "prepaid" && data.sessionCount ? { addPrepaidSessions: true, sessionCount: data.sessionCount } : {}),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate team-wide payment queries
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/payments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/payments/totals`] });

      // Also invalidate player-specific payment query to update player details popup
      queryClient.invalidateQueries({
        queryKey: [`/api/teams/${teamId}/payments/player/${variables.playerId}`]
      });

      form.reset({
        date: getTodayInYYYYMMDD(), // Using our helper function
        amount: "",
      });

      toast({
        title: "Payment Added",
        description: "The payment has been recorded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingPlayers || isLoadingPayments || isLoadingTotals) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!players) return null;

  // Filter players based on the toggle state - only for the dropdown
  const displayedPlayers = showAllPlayers
    ? players.sort((a, b) => a.name.localeCompare(b.name))
    : players.filter(player => player.active).sort((a, b) => a.name.localeCompare(b.name));

  // Always show all players in the payment totals
  const paymentTotalsWithNames = paymentTotals
    ?.map((total) => {
      const player = players?.find((p) => p.id === total.playerId);

      return {
        ...total,
        playerName: player?.name || "Unknown Player",
        isActive: player?.active || false
      };
    }) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-all-players-payments"
            checked={showAllPlayers}
            onCheckedChange={setShowAllPlayers}
          />
          <Label htmlFor="show-all-players-payments">Show All Players in Dropdown</Label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Payment</CardTitle>
          <CardDescription>Record a new payment for a player</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((data) => {
              addPaymentMutation.mutate(data);
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="playerId" className="text-sm font-medium">
                Player
              </label>
              <Controller
                control={form.control}
                name="playerId"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {displayedPlayers.map((player) => (
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
              <label htmlFor="amount" className="text-sm font-medium">
                Amount ($)
              </label>
              <Input
                id="amount"
                {...form.register("amount")}
                type="text"
                pattern="\d*\.?\d{0,2}"
                placeholder="0.00"
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium">
                Date
              </label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            {feeType === "prepaid" && (
              <div className="space-y-2">
                <label htmlFor="sessionCount" className="text-sm font-medium">
                  Number of Prepaid Sessions
                </label>
                <Input
                  id="sessionCount"
                  type="number"
                  min={1}
                  {...form.register("sessionCount", { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the number of prepaid sessions included with this payment.
                </p>
                {form.formState.errors.sessionCount && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.sessionCount.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes (Optional)
              </label>
              <Input
                id="notes"
                {...form.register("notes")}
                placeholder="Payment notes..."
              />
            </div>

            <Button
              type="submit"
              disabled={addPaymentMutation.isPending}
              className="w-full"
            >
              {addPaymentMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add Payment
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Totals</CardTitle>
          <CardDescription>Total payments by player (all players)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentTotalsWithNames
              .sort((a, b) => {
                const aTotal = a.totalAmount ? parseFloat(a.totalAmount) : 0;
                const bTotal = b.totalAmount ? parseFloat(b.totalAmount) : 0;
                return bTotal - aTotal;
              })
              .map((total) => (
                <div
                  key={total.playerId}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div className="flex items-center">
                    <div
                      className="font-medium text-primary hover:text-primary/80 cursor-pointer"
                      onClick={() => showPlayerDetails(teamId, total.playerId)}
                    >
                      {total.playerName}
                    </div>
                    {!total.isActive && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        Inactive
                      </span>
                    )}
                  </div>
                  <span className="text-lg">
                    ${total.totalAmount ? parseFloat(total.totalAmount).toFixed(2) : '0.00'}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}