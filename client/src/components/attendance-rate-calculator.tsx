import React, { useState, useMemo } from 'react';

interface AttendanceRateCalculatorProps {
  teamId: number;
}

// Sample Data
const allPlayers = [
  { id: 1, name: 'Player Aris' },
  { id: 2, name: 'Player Bea' },
  { id: 3, name: 'Player Cy' },
];

// { playerId: number, date: string (YYYY-MM-DD), attended: boolean }
const sampleAttendanceHistory = [
  // Last Month (assume current month is 2023-12)
  { playerId: 1, date: '2023-11-01', attended: true }, { playerId: 1, date: '2023-11-03', attended: true },
  { playerId: 1, date: '2023-11-05', attended: false },{ playerId: 1, date: '2023-11-08', attended: true },
  { playerId: 2, date: '2023-11-01', attended: true }, { playerId: 2, date: '2023-11-03', attended: false },
  { playerId: 2, date: '2023-11-05', attended: true },{ playerId: 2, date: '2023-11-08', attended: false },
  { playerId: 3, date: '2023-11-01', attended: true }, { playerId: 3, date: '2023-11-03', attended: true },
  { playerId: 3, date: '2023-11-05', attended: true },{ playerId: 3, date: '2023-11-08', attended: true },
  // Older data
  { playerId: 1, date: '2023-10-02', attended: true }, { playerId: 1, date: '2023-10-04', attended: true },
  { playerId: 2, date: '2023-10-02', attended: false }, { playerId: 2, date: '2023-10-04', attended: true },
  { playerId: 3, date: '2023-10-02', attended: true }, { playerId: 3, date: '2023-10-04', attended: false },
  { playerId: 1, date: '2023-10-06', attended: true }, { playerId: 1, date: '2023-10-09', attended: false },
  { playerId: 2, date: '2023-10-06', attended: true }, { playerId: 2, date: '2023-10-09', attended: true },
  { playerId: 3, date: '2023-10-06', attended: true }, { playerId: 3, date: '2023-10-09', attended: true },
];

type TimePeriod = 'allTime' | 'lastMonth';

const AttendanceRateCalculator: React.FC<AttendanceRateCalculatorProps> = ({ teamId }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('allTime');

  // TODO: Fetch real attendance data and player list based on teamId

  const filteredAttendance = useMemo(() => {
    if (timePeriod === 'lastMonth') {
      // Assuming current date is fixed for stable sample processing, e.g., 2023-12-XX
      const lastMonthStartDate = new Date(2023, 10, 1); // November 1st, 2023
      const lastMonthEndDate = new Date(2023, 10, 30);   // November 30th, 2023
      return sampleAttendanceHistory.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= lastMonthStartDate && recordDate <= lastMonthEndDate;
      });
    }
    return sampleAttendanceHistory;
  }, [timePeriod]);

  const overallTeamRate = useMemo(() => {
    if (filteredAttendance.length === 0) return { rate: 0, attended: 0, total: 0 };
    const attendedCount = filteredAttendance.filter(r => r.attended).length;
    const totalSessions = filteredAttendance.length; // This assumes each record is a unique session for a player
    // For a true team rate, you'd count unique team sessions and how many players attended each.
    // This simplified version calculates overall percentage of "attended" marks.
    return {
      rate: totalSessions > 0 ? parseFloat(((attendedCount / totalSessions) * 100).toFixed(1)) : 0,
      attended: attendedCount,
      total: totalSessions,
    };
  }, [filteredAttendance]);

  const playerRates = useMemo(() => {
    return allPlayers.map(player => {
      const playerRecords = filteredAttendance.filter(r => r.playerId === player.id);
      if (playerRecords.length === 0) return { id: player.id, name: player.name, rate: 0, attended: 0, total: 0 };
      const attendedCount = playerRecords.filter(r => r.attended).length;
      const totalSessions = playerRecords.length;
      return {
        id: player.id,
        name: player.name,
        rate: totalSessions > 0 ? parseFloat(((attendedCount / totalSessions) * 100).toFixed(1)) : 0,
        attended: attendedCount,
        total: totalSessions,
      };
    }).sort((a,b) => b.rate - a.rate);
  }, [filteredAttendance]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Attendance Rates</h3>
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="allTime">All Time</option>
          <option value="lastMonth">Last Month (Nov 2023)</option>
        </select>
      </div>
      <p className="text-sm text-gray-500 mb-1">Team ID: {teamId}</p>

      <div className="mb-6 p-3 bg-gray-50 rounded">
        <h4 className="text-md font-medium text-gray-700">Overall Team Summary ({timePeriod === 'allTime' ? 'All Time' : 'Last Month'})</h4>
        <p className="text-2xl font-bold text-indigo-600">{overallTeamRate.rate}%</p>
        <p className="text-xs text-gray-500">({overallTeamRate.attended} attended instances out of {overallTeamRate.total} recorded instances)</p>
         <p className="text-xs text-gray-400 mt-1">Note: Simplified calculation. For a precise team rate, define unique team sessions.</p>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-700 mb-2">Player Specific Rates ({timePeriod === 'allTime' ? 'All Time' : 'Last Month'})</h4>
        {playerRates.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {playerRates.map(player => (
              <li key={player.id} className="py-3">
                <div className="flex justify-between items-center">
                  <span className="text-md font-medium">{player.name}</span>
                  <span className={`text-lg font-semibold ${player.rate >= 75 ? 'text-green-600' : player.rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {player.rate}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">({player.attended} attended / {player.total} sessions)</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-5">No attendance data for selected period.</p>
        )}
      </div>
    </div>
  );
};

export default AttendanceRateCalculator;
