import { usePlayerContext } from "./player-context";
import { PlayerDetails } from "./player-details";
import { 
  Dialog, 
  DialogContent,
  DialogClose
} from "@/components/ui/dialog";
import { X } from "lucide-react";

export function PlayerDetailsModal() {
  const { selectedPlayer, hidePlayerDetails } = usePlayerContext();

  if (!selectedPlayer) return null;

  return (
    <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && hidePlayerDetails()}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <div className="mt-2">
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