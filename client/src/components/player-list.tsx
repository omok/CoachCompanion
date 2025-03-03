import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePlayerContext } from "./player-context";
import { EyeIcon, Pencil, Trash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlayerListProps {
  teamId: number;
  showEditControls?: boolean;
}

export function PlayerList({ teamId, showEditControls = false }: PlayerListProps) {
  const { showPlayerDetails } = usePlayerContext();

  // Fetch players
  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: [`/api/teams/${teamId}/players`],
  });

  if (isLoading) {
    return <div>Loading players...</div>;
  }

  if (!players || players.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No players in this team yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Jersey #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>{player.jerseyNumber || 'N/A'}</TableCell>
              <TableCell>{player.active ? 'Active' : 'Inactive'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => showPlayerDetails(player.id, teamId)}
                    title="View player details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  
                  {showEditControls && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit player"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remove player"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 