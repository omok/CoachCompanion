import { useQuery, useMutation } from "@tanstack/react-query";
import { Player, insertPlayerSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { usePlayerContext } from "./player-context";

export function TeamRoster({ teamId }: { teamId: number }) {
  const { user } = useAuth();
  const { showPlayerDetails } = usePlayerContext();
  const form = useForm({
    resolver: zodResolver(insertPlayerSchema.omit({ teamId: true })),
  });

  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  const addPlayerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/teams/${teamId}/players`, {
        ...data,
        teamId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/players`] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Team Roster</h2>
        {user?.role === "coach" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit((data) => addPlayerMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Player Name</Label>
                  <Input id="name" {...form.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent ID</Label>
                  <Input
                    id="parentId"
                    type="number"
                    {...form.register("parentId", { valueAsNumber: true })}
                  />
                </div>
                <Button type="submit" disabled={addPlayerMutation.isPending}>
                  Add Player
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            {user?.role === "coach" && <TableHead>Parent ID</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players?.map((player) => (
            <TableRow 
              key={player.id} 
              className="hover:bg-muted/50 cursor-pointer" 
              onClick={() => showPlayerDetails(teamId, player.id)}
            >
              <TableCell>
                <div className="font-medium text-primary hover:text-primary/80">
                  {player.name}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    player.active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {player.active ? "Active" : "Inactive"}
                </span>
              </TableCell>
              {user?.role === "coach" && (
                <TableCell>{player.parentId}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
