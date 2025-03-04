import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Player, insertPlayerSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
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
import { Loader2, UserPlus, EyeIcon, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { usePlayerContext } from "./player-context";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

type SortField = 'status' | 'name' | 'jerseyNumber';
type SortDirection = 'asc' | 'desc';

export function TeamRoster({ teamId }: { teamId: number }) {
  const { user } = useAuth();
  const { canAddPlayer } = usePermissions();
  const { showPlayerDetails } = usePlayerContext();
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
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

  const updatePlayerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/teams/${teamId}/players/${editingPlayer?.id}`, {
        ...data,
        teamId,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update player");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/players`] });
      form.reset();
      setDialogOpen(false);
      setEditingPlayer(null);
      toast({
        title: "Success",
        description: "Player updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update player",
        variant: "destructive",
      });
    }
  });

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    form.reset({
      name: player.name,
      parentId: player.parentId,
      jerseyNumber: player.jerseyNumber || "",
      active: player.active
    });
    setDialogOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortPlayers = (players: Player[] | undefined) => {
    if (!players) return [];
    
    return [...players].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'status':
          comparison = Number(b.active) - Number(a.active);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'jerseyNumber':
          const aNum = a.jerseyNumber ? parseInt(a.jerseyNumber) : Infinity;
          const bNum = b.jerseyNumber ? parseInt(b.jerseyNumber) : Infinity;
          comparison = aNum - bNum;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Filter and sort players
  const displayedPlayers = sortPlayers(
    showAllPlayers ? players : players?.filter(player => player.active)
  );

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
          {canAddPlayer(teamId) && (
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (open) {
                setEditingPlayer(null);
                form.reset({
                  name: "",
                  parentId: 0,
                  jerseyNumber: "",
                  active: true
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={form.handleSubmit((data) => 
                    editingPlayer 
                      ? updatePlayerMutation.mutate(data)
                      : addPlayerMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Player Name</Label>
                    <Input id="name" {...form.register("name")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jerseyNumber">Jersey Number (Optional)</Label>
                    <Input
                      id="jerseyNumber"
                      {...form.register("jerseyNumber")}
                      placeholder="#"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={form.watch("active")}
                        onCheckedChange={(checked) => form.setValue("active", checked)}
                      />
                      <Label htmlFor="active">Active Player</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setDialogOpen(false);
                      setEditingPlayer(null);
                      form.reset();
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addPlayerMutation.isPending || updatePlayerMutation.isPending}
                    >
                      {(addPlayerMutation.isPending || updatePlayerMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingPlayer ? "Updating..." : "Adding..."}
                        </>
                      ) : (
                        editingPlayer ? "Update Player" : "Add Player"
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
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('name')}
            >
              Name {getSortIcon('name')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('jerseyNumber')}
            >
              Jersey # {getSortIcon('jerseyNumber')}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('status')}
            >
              Status {getSortIcon('status')}
            </TableHead>
            {canAddPlayer(teamId) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedPlayers.map((player) => (
            <TableRow 
              key={player.id} 
              className="hover:bg-muted/50 cursor-pointer"
            >
              <TableCell onClick={() => showPlayerDetails(teamId, player.id)}>
                <div className="font-medium text-primary hover:text-primary/80">
                  {player.name}
                </div>
              </TableCell>
              <TableCell onClick={() => showPlayerDetails(teamId, player.id)}>
                {player.jerseyNumber || "-"}
              </TableCell>
              <TableCell onClick={() => showPlayerDetails(teamId, player.id)}>
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
              {canAddPlayer(teamId) && (
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit player"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPlayer(player);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
