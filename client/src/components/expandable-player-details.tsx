import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { PlayerDetails } from "./player-details";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ExpandablePlayerDetailsProps {
  teamId: number;
  playerId: number;
  onClose: () => void;
  colSpan?: number;
}

export function ExpandablePlayerDetails({ 
  teamId, 
  playerId, 
  onClose,
  colSpan = 4
}: ExpandablePlayerDetailsProps) {
  return (
    <TableRow className="expanded-details-row">
      <TableCell colSpan={colSpan} className="p-0 border-t-0">
        <div className="bg-muted/30 p-4 rounded-md m-2 border border-border">
          <div className="flex justify-end mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <PlayerDetails 
            teamId={teamId} 
            playerId={playerId} 
            showBackButton={false}
          />
        </div>
      </TableCell>
    </TableRow>
  );
} 