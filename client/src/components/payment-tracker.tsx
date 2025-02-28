import { useQuery, useMutation } from "@tanstack/react-query";
import { Payment, Player, insertPaymentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";
import { Link } from "wouter";

const formSchema = z.object({
  playerId: z.coerce.number().positive("Please select a player"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: "Amount must be a positive number" }
  ),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function PaymentTracker({ teamId }: { teamId: number }) {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/payments`, {
        ...data,
        teamId,
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
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

  const paymentTotalsWithNames = paymentTotals?.map((total) => ({
    ...total,
    playerName: players?.find((p) => p.id === total.playerId)?.name || "Unknown Player",
  })) || [];

  return (
    <div className="space-y-6">
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
              <select
                id="playerId"
                {...form.register("playerId", { valueAsNumber: true })}
                className="w-full rounded-md border p-2"
              >
                <option value="">Select a player</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
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
                  <div 
                    className="font-medium text-primary hover:text-primary/80 cursor-pointer"
                    onClick={() => window.location.href = `/player/${teamId}/${total.playerId}`}
                  >
                    {total.playerName}
                  </div>
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