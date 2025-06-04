import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface ComparativeAttendanceAnalysisProps {
  teamId: number;
  // TODO: Add props for selecting comparison targets (e.g., other teams, previous periods)
}

// Sample data - replace with actual data fetching
const playerComparisonData = [
  { name: 'Player A', attendance: 85, teamAverage: 75 },
  { name: 'Player B', attendance: 60, teamAverage: 75 },
  { name: 'Player C', attendance: 92, teamAverage: 75 },
  { name: 'Player D', attendance: 70, teamAverage: 75 },
  { name: 'Player E', attendance: 78, teamAverage: 75 },
];

const ComparativeAttendanceAnalysis: React.FC<ComparativeAttendanceAnalysisProps> = ({ teamId }) => {
  // TODO: Fetch necessary attendance data for comparison (e.g., player averages, team average, league average)
  // TODO: Implement comparative visualization

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Comparative Attendance Analysis</h3>
      <p className="text-sm text-gray-500 mb-2">Team ID: {teamId} (Player vs Team Average)</p>
      {/* TODO: Add selectors for comparison targets (e.g., compare selected players, compare with other teams) */}

      {playerComparisonData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={playerComparisonData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }} domain={[0, 100]}/>
            <Tooltip content={<CustomTooltipCompare />} />
            <Legend />
            <Bar dataKey="attendance" name="Player Attendance">
              {playerComparisonData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.attendance >= entry.teamAverage ? '#82ca9d' : '#ff8042'} />
              ))}
            </Bar>
            <Bar dataKey="teamAverage" name="Team Average" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-400 pt-20">Comparative analysis data will be here.</p>
      )}
       <p className="text-xs text-gray-400 mt-2">Green bars indicate player attendance at or above team average. Orange bars indicate below average.</p>
    </div>
  );
};

const CustomTooltipCompare: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.fill }}>
            {`${pld.name}: ${pld.value}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default ComparativeAttendanceAnalysis;
