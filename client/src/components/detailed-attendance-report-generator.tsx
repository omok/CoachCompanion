import React, { useState, useMemo } from 'react';

interface DetailedAttendanceReportGeneratorProps {
  teamId: number;
}

// Sample Data (already used in calculator, re-using for consistency)
const allPlayers = [
  { id: 1, name: 'Player Aris' },
  { id: 2, name: 'Player Bea' },
  { id: 3, name: 'Player Cy' },
];

// { playerId: number, date: string (YYYY-MM-DD), attended: boolean, sessionName?: string }
const sampleAttendanceHistoryForReport = [
  { playerId: 1, date: '2023-11-01', attended: true, sessionName: 'Morning Drill' },
  { playerId: 1, date: '2023-11-03', attended: true, sessionName: 'Strategy Sesh' },
  { playerId: 1, date: '2023-11-05', attended: false, sessionName: 'Speed Training' },
  { playerId: 1, date: '2023-11-08', attended: true, sessionName: 'Game Review' },
  { playerId: 2, date: '2023-11-01', attended: true, sessionName: 'Morning Drill' },
  { playerId: 2, date: '2023-11-03', attended: false, sessionName: 'Strategy Sesh' },
  { playerId: 2, date: '2023-11-05', attended: true, sessionName: 'Speed Training' },
  { playerId: 2, date: '2023-11-08', attended: false, sessionName: 'Game Review' },
  { playerId: 3, date: '2023-11-01', attended: true, sessionName: 'Morning Drill' },
  { playerId: 3, date: '2023-11-03', attended: true, sessionName: 'Strategy Sesh' },
  { playerId: 3, date: '2023-11-05', attended: true, sessionName: 'Speed Training' },
  { playerId: 3, date: '2023-11-08', attended: true, sessionName: 'Game Review' },
  { playerId: 1, date: '2023-10-02', attended: true, sessionName: 'Skills Practice' },
  { playerId: 1, date: '2023-10-04', attended: true, sessionName: 'Conditioning' },
  { playerId: 2, date: '2023-10-02', attended: false, sessionName: 'Skills Practice' },
  { playerId: 2, date: '2023-10-04', attended: true, sessionName: 'Conditioning' },
  { playerId: 3, date: '2023-10-02', attended: true, sessionName: 'Skills Practice' },
  { playerId: 3, date: '2023-10-04', attended: false, sessionName: 'Conditioning' },
];

const today = new Date(2023, 11, 15); // Mock current date for stable samples: Dec 15, 2023
const lastMonthFirstDay = new Date(today.getFullYear(), today.getMonth() -1, 1).toISOString().split('T')[0];
const lastMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];


const DetailedAttendanceReportGenerator: React.FC<DetailedAttendanceReportGeneratorProps> = ({ teamId }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all'); // 'all' or player ID
  const [startDate, setStartDate] = useState<string>(lastMonthFirstDay);
  const [endDate, setEndDate] = useState<string>(lastMonthLastDay);
  const [reportData, setReportData] = useState<any[]>([]);
  const [showReport, setShowReport] = useState<boolean>(false);

  // TODO: Fetch real data

  const handleGenerateReport = () => {
    let filtered = sampleAttendanceHistoryForReport;

    if (selectedPlayerId !== 'all') {
      filtered = filtered.filter(r => r.playerId === parseInt(selectedPlayerId, 10));
    }

    if (startDate) {
      filtered = filtered.filter(r => r.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(r => r.date <= endDate);
    }

    const dataWithPlayerNames = filtered.map(r => ({
        ...r,
        playerName: allPlayers.find(p => p.id === r.playerId)?.name || 'Unknown Player'
    })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.playerName.localeCompare(b.playerName));

    setReportData(dataWithPlayerNames);
    setShowReport(true);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Detailed Attendance Reports</h3>
      <p className="text-sm text-gray-500 mb-4">Team ID: {teamId}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="player-filter" className="block text-sm font-medium text-gray-700">Player</label>
          <select
            id="player-filter"
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Players</option>
            {allPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"/>
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"/>
        </div>
      </div>

      <button
        onClick={handleGenerateReport}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 mb-4"
      >
        Generate Report
      </button>

      {showReport && (
        reportData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((record, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{record.playerName}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{record.sessionName || 'N/A'}</td>
                    <td className={`px-4 py-2 whitespace-nowrap text-sm font-semibold ${record.attended ? 'text-green-600' : 'text-red-600'}`}>
                      {record.attended ? 'Attended' : 'Absent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-5">No data found for the selected criteria.</p>
        )
      )}
    </div>
  );
};

export default DetailedAttendanceReportGenerator;
