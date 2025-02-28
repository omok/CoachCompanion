import { createContext, useContext, useState, ReactNode } from "react";

interface PlayerContextType {
  selectedPlayer: { teamId: number; playerId: number } | null;
  showPlayerDetails: (teamId: number, playerId: number) => void;
  hidePlayerDetails: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [selectedPlayer, setSelectedPlayer] = useState<{ teamId: number; playerId: number } | null>(null);

  const showPlayerDetails = (teamId: number, playerId: number) => {
    setSelectedPlayer({ teamId, playerId });
  };

  const hidePlayerDetails = () => {
    setSelectedPlayer(null);
  };

  return (
    <PlayerContext.Provider value={{ selectedPlayer, showPlayerDetails, hidePlayerDetails }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayerContext must be used within a PlayerProvider");
  }
  return context;
} 