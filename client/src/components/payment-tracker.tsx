import { useQuery, useMutation } from "@tanstack/react-query";
import { Payment, Player, insertPaymentSchema } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { queryClient } from "@/lib/queryClient";
import { z } from "zod"; // Add this import

type PaymentFormData = {
  playerId: number;
  amount: number;
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
        amount: insertPaymentSchema.shape.amount,
        date: z.string(),
      }),
    ),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
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
      const response = await fetch(`/api/teams/${teamId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          teamId,
          amount: Number(data.amount),
        }),
      });
      if (!response.ok) throw new Error("Failed to add payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/teams/${teamId}/payments`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/teams/${teamId}/payments/totals`],
      });
      form.reset();
      toast({
        title: "Payment Added",
        description: "The payment has been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add payment. Please try again.",
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

  const onSubmit = (data: PaymentFormData) => {
    addPaymentMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Payment</CardTitle>
          <CardDescription>Record a new payment for a player</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
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
                {addPaymentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
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