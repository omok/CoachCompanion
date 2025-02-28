import { usePlayerContext } from "./player-context";
import { PlayerDetails } from "./player-details";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "./ui/button";

export function PlayerDetailsModal() {
  const { selectedPlayer, hidePlayerDetails } = usePlayerContext();

  if (!selectedPlayer) return null;

  return (
    <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && hidePlayerDetails()}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 sm:p-1">
        <div className="sticky top-0 right-0 flex justify-end p-2 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full" 
            onClick={hidePlayerDetails}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 sm:p-6">
          <PlayerDetails 
            teamId={selectedPlayer.teamId} 
            playerId={selectedPlayer.playerId} 
            showBackButton={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 