import { useQuery, useMutation } from "@tanstack/react-query";
import { Payment, Player, insertPaymentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";

type PaymentFormData = {
  playerId: number;
  amount: string;
  date: string;
  notes?: string;
};

type PaymentTotalWithPlayer = {
  playerId: number;
  playerName: string;
  total: number;
};

export function PaymentTracker({ teamId }: { teamId: number }) {
  const { toast } = useToast();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(
      insertPaymentSchema.extend({
        amount: z.string().min(1, "Amount is required"),
        date: z.string(),
      }),
    ),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
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
    { playerId: number; total: number }[]
  >({
    queryKey: [`/api/teams/${teamId}/payments/totals`],
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      console.log("Making payment API request with data:", data);
      const response = await apiRequest("POST", `/api/teams/${teamId}/payments`, {
        ...data,
        teamId,
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/payments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/payments/totals`] });
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        amount: "",
      });
      toast({
        title: "Payment Added",
        description: "The payment has been recorded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const paymentTotalsWithNames: PaymentTotalWithPlayer[] =
    paymentTotals?.map((total) => ({
      ...total,
      playerName:
        players?.find((p) => p.id === total.playerId)?.name || "Unknown Player",
    })) || [];

  if (isLoadingPlayers || isLoadingPayments || isLoadingTotals) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!players) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Payment</CardTitle>
          <CardDescription>Record a new payment for a player</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit((data) => {
                console.log("Form submitted with data:", data);
                addPaymentMutation.mutate(data);
              })} 
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="playerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player</FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border p-2"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value))
                        }
                      >
                        <option value="">Select a player</option>
                        {players.map((player) => (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Enter the payment amount (e.g., 10.00)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Payment notes..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Totals</CardTitle>
          <CardDescription>Total payments by player</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentTotalsWithNames
              .sort((a, b) => b.total - a.total)
              .map((total) => (
                <div
                  key={total.playerId}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <span className="font-medium">{total.playerName}</span>
                  <span className="text-lg">
                    ${total.total.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}