import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Player, insertPlayerSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@/components/ui/switch";
import { usePlayerContext } from "./player-context";
import { Pencil, Loader2, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as z from "zod";

// Schema for updating a player - only including fields we want to update
const updatePlayerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jerseyNumber: z.string().optional(),
  active: z.boolean().default(true)
});

type UpdatePlayerFormData = z.infer<typeof updatePlayerSchema>;

interface PlayerListProps {
  teamId: number;
  showEditControls?: boolean;
}

export function PlayerList({ teamId, showEditControls = false }: PlayerListProps) {
  const { user } = useAuth();
  const { showPlayerDetails } = usePlayerContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  const form = useForm({
    resolver: zodResolver(insertPlayerSchema.omit({ teamId: true })),
    defaultValues: {
      name: "",
      parentId: 0,
      jerseyNumber: "",
      active: true
    }
  });

  const editForm = useForm<UpdatePlayerFormData>({
    resolver: zodResolver(updatePlayerSchema),
    defaultValues: {
      name: "",
      jerseyNumber: "",
      active: true
    }
  });

  // Fetch players
  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });
  
  // Add player mutation
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

  // Update player mutation
  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: UpdatePlayerFormData }) => {
      try {
        setUpdateError(null);
        
        // Log what we're sending to the server for debugging
        console.log("Updating player with data:", data);
        
        // Format the data specifically for the backend
        // Make sure to include all required fields and proper types
        const processedData = {
          name: data.name,
          jerseyNumber: data.jerseyNumber === "" ? null : data.jerseyNumber, // Convert empty string to null
          active: Boolean(data.active),
          teamId: teamId, // Make sure teamId is included
        };
        
        console.log("Processed data for update:", processedData);
        
        // First fetch the current player to see the exact data structure
        const currentResponse = await fetch(`/api/teams/${teamId}/players/${id}`, {
          credentials: "include"
        });
        
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          console.log("Current player data from server:", currentData);
        }
        
        // Use fetch directly for more control
        const res = await fetch(`/api/teams/${teamId}/players/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(processedData)
        });
        
        // Check content type
        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        
        // Get response text for debugging regardless of success/failure
        const responseText = await res.text();
        console.log(`Server response (${res.status}):`, responseText);
        
        if (!res.ok) {
          // If it's HTML (unexpected), provide a clear error
          if (responseText.includes("<!DOCTYPE html>") || responseText.includes("<html>")) {
            console.error("Received HTML response instead of JSON:", responseText.substring(0, 200));
            throw new Error("Received unexpected HTML response. You may need to log in again.");
          }
          
          // Try to parse as JSON if it looks like JSON
          if (isJson || responseText.startsWith("{")) {
            try {
              const errorData = JSON.parse(responseText);
              throw new Error(errorData.message || errorData.error || "Failed to update player");
            } catch (e) {
              // If JSON parsing failed, use the text directly
              throw new Error(`Update failed: ${responseText.substring(0, 100)}`);
            }
          }
          
          // Default error
          throw new Error(`Failed to update player: ${res.status}`);
        }
        
        // If we received a JSON response, parse it
        let parsedResponse;
        if (responseText && (isJson || responseText.startsWith("{"))) {
          try {
            parsedResponse = JSON.parse(responseText);
          } catch (e) {
            console.warn("Could not parse JSON response", e);
            parsedResponse = { success: true };
          }
        } else {
          parsedResponse = { success: true };
        }
        
        return parsedResponse;
      } catch (error) {
        console.error("Player update error:", error);
        setUpdateError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    onSuccess: () => {
      // Force a complete refresh of player data
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/players`] });
      setEditDialogOpen(false);
      setCurrentPlayer(null);
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

  // Function to handle opening the edit dialog with player data
  const handleEditPlayer = (player: Player) => {
    console.log("Editing player:", player);
    setCurrentPlayer(player);
    setUpdateError(null);
    editForm.reset({
      name: player.name,
      jerseyNumber: player.jerseyNumber || "",
      active: player.active
    });
    setEditDialogOpen(true);
  };

  // Function to handle submitting the edit form
  const handleUpdatePlayer = (data: UpdatePlayerFormData) => {
    if (!currentPlayer) return;
    updatePlayerMutation.mutate({ id: currentPlayer.id, data });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No players in this team yet.</p>
          {showEditControls && user?.role === "coach" && (
            <div className="flex justify-center mt-4">
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
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {showEditControls && user?.role === "coach" && (
        <div className="flex justify-end mb-4">
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
        </div>
      )}
      
      {/* Update Player Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Player</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(handleUpdatePlayer)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="edit-name">Player Name</Label>
              <Input id="edit-name" {...editForm.register("name")} />
              {editForm.formState.errors.name && (
                <p className="text-red-500 text-sm">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-jerseyNumber">Jersey Number (Optional)</Label>
              <Input
                id="edit-jerseyNumber"
                {...editForm.register("jerseyNumber")}
                placeholder="#"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Player Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={editForm.watch("active")}
                    onCheckedChange={(checked) => editForm.setValue("active", checked)}
                  />
                  <Label htmlFor="edit-active" className="text-sm">
                    {editForm.watch("active") ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>
            
            {updateError && (
              <div className="text-red-500 text-sm p-2 border border-red-200 bg-red-50 rounded">
                {updateError}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlayerMutation.isPending}>
                {updatePlayerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Player"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Jersey #</TableHead>
            <TableHead>Status</TableHead>
            {showEditControls && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
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
                <span className={`px-2 py-1 rounded-full text-xs ${
                  player.active 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {player.active ? "Active" : "Inactive"}
                </span>
              </TableCell>
              {showEditControls && (
                <TableCell className="text-right">
                  <div className="flex justify-end">
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
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 