import { usePlayerContext } from "./player-context";
import { PlayerDetails } from "./player-details";
import { Dialog } from "@/components/ui/dialog";
import { X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import React from "react";

// Custom DialogContent without the default close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
CustomDialogContent.displayName = "CustomDialogContent";

export function PlayerDetailsModal() {
  const { selectedPlayer, hidePlayerDetails } = usePlayerContext();

  if (!selectedPlayer) return null;

  return (
    <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && hidePlayerDetails()}>
      <CustomDialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 sm:p-1">
        <div className="sticky top-0 right-0 flex justify-end p-2 z-10">
          <button 
            type="button"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-transparent hover:bg-muted transition-colors"
            onClick={hidePlayerDetails}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <PlayerDetails 
            teamId={selectedPlayer.teamId} 
            playerId={selectedPlayer.playerId} 
            showBackButton={false}
          />
        </div>
      </CustomDialogContent>
    </Dialog>
  );
} 