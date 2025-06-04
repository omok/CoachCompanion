import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';

interface CalendarHeatmapProps {
  teamId: number;
  // TODO: Add more props for data and configuration
}

// Sample data - replace with actual data fetching
const today = new Date();
const sampleData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(today);
  date.setDate(today.getDate() - i);
  return {
    date: date.toISOString().split('T')[0], // YYYY-MM-DD
    dayOfWeek: date.getDay(), // 0 (Sun) - 6 (Sat)
    weekOfYear: Math.floor(i / 7), // Simple week grouping for Y-axis
    attendance: Math.floor(Math.random() * 101), // Attendance percentage
  };
}).reverse(); // Show most recent dates at the end

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekCount = Math.max(...sampleData.map(d => d.weekOfYear)) + 1;


const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ teamId }) => {
  // TODO: Fetch attendance data for the team
  // TODO: Process data to calculate attendance density

  const getColor = (value: number) => {
    if (value > 80) return 'rgba(76, 175, 80, 0.8)'; // Green
    if (value > 60) return 'rgba(139, 195, 74, 0.7)';
    if (value > 40) return 'rgba(205, 220, 57, 0.6)';
    if (value > 20) return 'rgba(255, 235, 59, 0.5)'; // Yellow
    if (value > 0) return 'rgba(255, 193, 7, 0.4)';
    return 'rgba(224, 224, 224, 0.3)'; // Grey for no/low attendance
  };

  // For a true calendar heatmap, we'd need a more complex layout.
  // This is a simplified scatter plot representation.
  // X-axis: Day of the week, Y-axis: Week of the year (inverted)
  // Size of the cell: constant, Color: based on attendance

  return (
    <div className="bg-white shadow rounded-lg p-4 h-full">
      <h3 className="text-lg font-semibold mb-2">Monthly Attendance Heatmap</h3>
      <p className="text-sm text-gray-500 mb-2">Team ID: {teamId}</p>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <XAxis
            type="number"
            dataKey="dayOfWeek"
            name="Day of Week"
            interval={0}
            tickFormatter={(tick) => weekDays[tick]}
            domain={[0, 6]}
            tickCount={7}
          />
          <YAxis
            type="number"
            dataKey="weekOfYear"
            name="Week"
            reversed // Show recent weeks at the top
            interval={0}
            tickFormatter={(tick) => `W${tick + 1}`}
            domain={[0, weekCount -1]}
            width={80}
          />
          <ZAxis type="number" dataKey="attendance" name="Attendance" unit="%" range={[100, 1000]} /> {/* Size of points */}
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Scatter name="Attendance" data={sampleData} shape="square">
            {sampleData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.attendance)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2">Note: This is a simplified representation. A true "calendar heatmap" layout would require specific day cells arranged in a calendar grid. Weeks start from the oldest data point in this view.</p>
    </div>
  );
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold">{`Date: ${data.date}`}</p>
        <p>{`Day: ${weekDays[data.dayOfWeek]}`}</p>
        <p>{`Attendance: ${data.attendance}%`}</p>
      </div>
    );
  }
  return null;
};

export default CalendarHeatmap;
