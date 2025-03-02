import React, { useState } from "react";
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
import { Loader2, UserPlus, EyeIcon } from "lucide-react";
import { usePlayerContext } from "./player-context";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

export function TeamRoster({ teamId }: { teamId: number }) {
  const { user } = useAuth();
  const { showPlayerDetails } = usePlayerContext();
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(insertPlayerSchema.omit({ teamId: true })),
    defaultValues: {
      name: "",
      parentId: 0,
      jerseyNumber: "",
      active: true
    }
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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add player");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/players`] });
      form.reset();
      setDialogOpen(false);
      toast({
        title: "Success",
        description: "Player added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add player",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Filter players based on the toggle state
  const displayedPlayers = showAllPlayers 
    ? players 
    : players?.filter(player => player.active);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Team Roster</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all-players"
              checked={showAllPlayers}
              onCheckedChange={setShowAllPlayers}
            />
            <Label htmlFor="show-all-players">Show All Players</Label>
          </div>
          {user?.role === "coach" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                    <Label htmlFor="parentId">Parent ID (Optional)</Label>
                    <Input
                      id="parentId"
                      type="number"
                      {...form.register("parentId", { 
                        setValueAs: (value) => value === "" ? 0 : parseInt(value, 10) 
                      })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to set as 0</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jerseyNumber">Jersey Number (Optional)</Label>
                    <Input
                      id="jerseyNumber"
                      {...form.register("jerseyNumber")}
                      placeholder="#"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addPlayerMutation.isPending}>
                      {addPlayerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Player"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Jersey #</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedPlayers?.map((player) => (
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
              <TableCell>{player.jerseyNumber || "-"}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
