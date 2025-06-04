import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';

interface TeamAttendanceTrendChartProps {
  teamId: number;
  // TODO: Add more props for data, time period selection, and chart configuration
}

// Sample data - replace with actual data fetching
const generateTeamTrendData = () => {
  return Array.from({ length: 12 }, (_, i) => { // Monthly data for a year
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    date.setDate(1); // Start of the month
    return {
      month: date.toISOString().split('T')[0].substring(0, 7), // YYYY-MM
      averageAttendance: Math.floor(Math.random() * 50 + 40), // Avg attendance % (40-90)
      totalSessions: Math.floor(Math.random() * 10 + 5), // 5-15 sessions per month
    };
  });
};

const teamTrendData = generateTeamTrendData();

const TeamAttendanceTrendChart: React.FC<TeamAttendanceTrendChartProps> = ({ teamId }) => {
  // TODO: Fetch attendance data for the team (aggregated by month/week)
  // TODO: Process data to identify trends

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Team Attendance Trends</h3>
      <p className="text-sm text-gray-500 mb-2">Team ID: {teamId}</p>
      {/* TODO: Add time period selector (e.g., last 6 months, last year) */}

      {teamTrendData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={teamTrendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(monthStr) => {
                const [year, month] = monthStr.split('-');
                return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
            />
            <YAxis
              yAxisId="left"
              label={{ value: 'Avg Attendance %', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Sessions', angle: 90, position: 'insideRight' }}
              domain={[0, Math.max(...teamTrendData.map(d => d.totalSessions)) + 5]}
            />
            <Tooltip content={<CustomTooltipTeam />} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="averageAttendance"
              stroke="#82ca9d"
              fillOpacity={1}
              fill="url(#colorAttendance)"
              name="Average Attendance"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalSessions"
              stroke="#ffc658"
              name="Total Sessions"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-400 pt-20">Team attendance trend data will be here.</p>
      )}
      <p className="text-xs text-gray-400 mt-2">Note: Statistical significance indicators for trends are not yet implemented.</p>
    </div>
  );
};

const CustomTooltipTeam: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const [year, month] = label.split('-');
    const displayDate = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold">{`Month: ${displayDate}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.stroke || pld.fill }}>
            {`${pld.name}: ${pld.value}${pld.dataKey === 'averageAttendance' ? '%' : ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


export default TeamAttendanceTrendChart;
