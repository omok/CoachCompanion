import React, { useMemo } from 'react';

interface DecliningAttendanceDetectorProps {
  teamId: number;
  // TODO: Add props for threshold settings, time period, etc.
}

// Sample Player Data
const allPlayers = [
  { id: 1, name: 'Player Alpha' },
  { id: 2, name: 'Player Bravo' },
  { id: 3, name: 'Player Charlie' },
  { id: 4, name: 'Player Delta' },
];

// Sample Attendance Records: Array of { playerId: number, date: string, attended: boolean }
const sampleAttendanceRecords = [
  // Player Alpha: Consistent
  ...Array.from({ length: 10 }, (_, i) => ({ playerId: 1, date: `2023-10-${i + 1}`, attended: Math.random() > 0.2 })), // 80%
  ...Array.from({ length: 10 }, (_, i) => ({ playerId: 1, date: `2023-11-${i + 1}`, attended: Math.random() > 0.25 })), // 75%

  // Player Bravo: Declining
  ...Array.from({ length: 10 }, (_, i) => ({ playerId: 2, date: `2023-10-${i + 1}`, attended: Math.random() > 0.1 })), // 90%
  ...Array.from({ length: 10 }, (_, i) => ({ playerId: 2, date: `2023-11-${i + 1}`, attended: Math.random() > 0.6 })), // 40%

  // Player Charlie: Improving
  ...Array.from({ length: 10 }, (_, i) => ({ playerId: 3, date: `2023-10-${i + 1}`, attended: Math.random() > 0.7 })), // 30%
  ...Array.from({ length: 10 }, (_, i) => ({ playerId: 3, date: `2023-11-${i + 1}`, attended: Math.random() > 0.2 })), // 80%

  // Player Delta: Fluctuating but not clearly declining for this simple logic
  ...Array.from({ length: 5 }, (_, i) => ({ playerId: 4, date: `2023-10-${i + 1}`, attended: true })),
  ...Array.from({ length: 5 }, (_, i) => ({ playerId: 4, date: `2023-10-${i + 6}`, attended: false })),
  ...Array.from({ length: 5 }, (_, i) => ({ playerId: 4, date: `2023-11-${i + 1}`, attended: true })),
  ...Array.from({ length: 5 }, (_, i) => ({ playerId: 4, date: `2023-11-${i + 6}`, attended: true })),
];

const DECLINE_THRESHOLD_PERCENTAGE_DROP = 30; // Minimum 30% drop to be flagged

const DecliningAttendanceDetector: React.FC<DecliningAttendanceDetectorProps> = ({ teamId }) => {
  // TODO: Fetch attendance data for all players in the team
  // TODO: Implement more sophisticated logic (e.g., regression, consider number of sessions)

  const decliningPlayers = useMemo(() => {
    const playersData: { [key: number]: { name: string, periods: { [key: string]: { attended: number, total: number } } } } = {};

    allPlayers.forEach(p => {
      playersData[p.id] = { name: p.name, periods: {} };
    });

    sampleAttendanceRecords.forEach(record => {
      const month = record.date.substring(0, 7); // YYYY-MM as period
      if (!playersData[record.playerId].periods[month]) {
        playersData[record.playerId].periods[month] = { attended: 0, total: 0 };
      }
      playersData[record.playerId].periods[month].total++;
      if (record.attended) {
        playersData[record.playerId].periods[month].attended++;
      }
    });

    const flaggedPlayers: { name: string; oldRate: number; newRate: number; drop: number }[] = [];

    Object.values(playersData).forEach(player => {
      const periodKeys = Object.keys(player.periods).sort();
      if (periodKeys.length < 2) return; // Need at least two periods to compare

      // Simple comparison: first available period vs last available period
      const firstPeriodKey = periodKeys[0];
      const lastPeriodKey = periodKeys[periodKeys.length - 1];

      // Ensure we are comparing distinct periods if more than 2 exist.
      // For this example, we'll just use the first and last sorted.

      const oldPeriod = player.periods[firstPeriodKey];
      const newPeriod = player.periods[lastPeriodKey];

      if (oldPeriod.total === 0 || newPeriod.total === 0) return; // Avoid division by zero

      const oldRate = (oldPeriod.attended / oldPeriod.total) * 100;
      const newRate = (newPeriod.attended / newPeriod.total) * 100;
      const drop = oldRate - newRate;

      if (drop >= DECLINE_THRESHOLD_PERCENTAGE_DROP && oldRate > 0) { // also ensure old rate was not zero
        flaggedPlayers.push({ name: player.name, oldRate: parseFloat(oldRate.toFixed(1)), newRate: parseFloat(newRate.toFixed(1)), drop: parseFloat(drop.toFixed(1)) });
      }
    });
    return flaggedPlayers;
  }, [teamId]); // teamId would be used in actual data fetching

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Players with Declining Attendance</h3>
      <p className="text-sm text-gray-500 mb-1">Team ID: {teamId}</p>
      <p className="text-xs text-gray-500 mb-3">Identifies players whose attendance rate dropped by at least {DECLINE_THRESHOLD_PERCENTAGE_DROP}% between the earliest and latest recorded monthly periods.</p>

      {decliningPlayers.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {decliningPlayers.map(player => (
            <li key={player.name} className="py-3">
              <p className="text-md font-medium text-red-600">{player.name}</p>
              <p className="text-sm text-gray-700">
                Attendance changed from {player.oldRate}% to {player.newRate}% (Drop: {player.drop}%)
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-10">No players with significant attendance decline detected.</p>
      )}
    </div>
  );
};

export default DecliningAttendanceDetector;
