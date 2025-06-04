import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PlayerAttendanceTimelineProps {
  teamId: number;
  playerId?: number;
}

// Sample data - replace with actual data fetching
const generatePlayerData = (pid: number) => {
  return Array.from({ length: 20 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (20 - i) * 7); // Weekly points for simplicity
    return {
      date: date.toISOString().split('T')[0],
      attendance: Math.floor(Math.random() * 70 + 30), // Random attendance % (30-100)
      playerId: pid,
    };
  });
};

const teamPlayers = [
  { id: 1, name: 'Player Alice' },
  { id: 2, name: 'Player Bob' },
  { id: 3, name: 'Player Charlie' },
];

const PlayerAttendanceTimeline: React.FC<PlayerAttendanceTimelineProps> = ({ teamId, playerId: initialPlayerId }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | undefined>(initialPlayerId ?? teamPlayers[0].id);

  // TODO: Fetch player list for selection if playerId is not provided
  // TODO: Fetch attendance data for the selected player

  const playerData = selectedPlayerId ? generatePlayerData(selectedPlayerId) : [];
  const selectedPlayer = teamPlayers.find(p => p.id === selectedPlayerId);

  const handlePlayerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlayerId(parseInt(event.target.value, 10));
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 h-full">
      <h3 className="text-lg font-semibold mb-2">Attendance Timeline</h3>
      {/* Player selection is handled here if no initialPlayerId is passed */}
      {!initialPlayerId && (
        <div className="mb-4">
          <label htmlFor="player-select" className="block text-sm font-medium text-gray-700 mr-2">
            Select Player:
          </label>
          <select
            id="player-select"
            value={selectedPlayerId || ''}
            onChange={handlePlayerChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {teamPlayers.map(player => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedPlayer && playerData.length > 0 ? (
        <>
          <h4 className="text-md font-medium mb-2">For: {selectedPlayer.name}</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={playerData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft', dy: -10, dx: -5 }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltipPlayer />} />
              <Legend wrapperStyle={{fontSize: "0.8rem"}}/>
              <Line type="monotone" dataKey="attendance" stroke="#8884d8" activeDot={{ r: 8 }} name="Attendance Percentage" />
            </LineChart>
          </ResponsiveContainer>
        </>
      ) : (
        <p className="text-center text-gray-400 pt-10">
          {selectedPlayer ? 'No attendance data available for this player.' : 'Please select a player.'}
        </p>
      )}
    </div>
  );
};

const CustomTooltipPlayer: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold">{`Date: ${new Date(label).toLocaleDateString()}`}</p>
        <p style={{ color: payload[0].stroke }}>{`${payload[0].name}: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

export default PlayerAttendanceTimeline;
