import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';


interface SeasonalVariationDetectorProps {
  teamId: number;
  // TODO: Add props for defining seasons, comparison periods, etc.
}

// Sample Attendance Data (aggregated monthly for simplicity)
// Format: { month: string (YYYY-MM), averageAttendance: number, totalAttended: number, totalExpected: number }
const sampleMonthlyAttendance = [
  // Year 1
  { month: '2022-09', averageAttendance: 85, totalAttended: 85, totalExpected: 100 }, // Start of season high
  { month: '2022-10', averageAttendance: 80, totalAttended: 80, totalExpected: 100 },
  { month: '2022-11', averageAttendance: 75, totalAttended: 75, totalExpected: 100 },
  { month: '2022-12', averageAttendance: 60, totalAttended: 60, totalExpected: 100 }, // Holiday dip
  { month: '2023-01', averageAttendance: 70, totalAttended: 70, totalExpected: 100 }, // Slight recovery
  { month: '2023-02', averageAttendance: 78, totalAttended: 78, totalExpected: 100 },
  { month: '2023-03', averageAttendance: 82, totalAttended: 82, totalExpected: 100 },
  { month: '2023-04', averageAttendance: 80, totalAttended: 80, totalExpected: 100 },
  { month: '2023-05', averageAttendance: 70, totalAttended: 70, totalExpected: 100 }, // End of season / exams
  // Year 2 - to show recurring patterns
  { month: '2023-09', averageAttendance: 88, totalAttended: 88, totalExpected: 100 },
  { month: '2023-10', averageAttendance: 82, totalAttended: 82, totalExpected: 100 },
  { month: '2023-11', averageAttendance: 78, totalAttended: 78, totalExpected: 100 },
  { month: '2023-12', averageAttendance: 65, totalAttended: 65, totalExpected: 100 }, // Holiday dip again
];

const SeasonalVariationDetector: React.FC<SeasonalVariationDetectorProps> = ({ teamId }) => {
  // TODO: Fetch attendance data over a long period (e.g., multiple years if available)
  // TODO: Implement logic to identify seasonal patterns (e.g., holidays, school breaks)
  // TODO: Allow grouping by quarter or custom seasons.

  const monthlyAverages = useMemo(() => {
    const byMonth: { [key: string]: { totalRate: number, count: number, yearsData: {year: string, rate: number}[] } } = {}; // Key: MM (month number)

    sampleMonthlyAttendance.forEach(data => {
      const monthNum = data.month.substring(5, 7); // "09", "10", etc.
      const year = data.month.substring(0,4);
      if (!byMonth[monthNum]) {
        byMonth[monthNum] = { totalRate: 0, count: 0, yearsData: [] };
      }
      byMonth[monthNum].totalRate += data.averageAttendance;
      byMonth[monthNum].count++;
      byMonth[monthNum].yearsData.push({year, rate: data.averageAttendance});
    });

    const chartData = Object.entries(byMonth).map(([monthNum, data]) => {
      const monthName = new Date(2000, parseInt(monthNum) - 1, 1).toLocaleString('default', { month: 'short' });
      return {
        month: monthName,
        monthNum,
        averageAttendance: parseFloat((data.totalRate / data.count).toFixed(1)),
        years: data.yearsData, // for tooltip
      };
    }).sort((a,b) => parseInt(a.monthNum) - parseInt(b.monthNum)); // Sort by month number

    return chartData;
  }, [teamId]); // teamId for actual data fetching

  const overallAverage = useMemo(() => {
    if (sampleMonthlyAttendance.length === 0) return 0;
    const total = sampleMonthlyAttendance.reduce((sum, item) => sum + item.averageAttendance, 0);
    return total / sampleMonthlyAttendance.length;
  }, []);


  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Monthly Attendance Variations</h3>
      <p className="text-sm text-gray-500 mb-1">Team ID: {teamId}</p>
      <p className="text-xs text-gray-500 mb-3">Shows average attendance for each month across available years. Helps identify seasonal trends.</p>

      {monthlyAverages.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyAverages} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} label={{ value: 'Avg. Attendance %', angle: -90, position: 'insideLeft' }}/>
            <Tooltip content={<CustomTooltipSeasonal />} />
            <Legend />
            <Bar dataKey="averageAttendance" name="Average Monthly Attendance">
              {monthlyAverages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.averageAttendance > overallAverage ? '#82ca9d' : (entry.averageAttendance < overallAverage * 0.85 ? '#ff8042' : '#8884d8')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-500 py-10">Sufficient data not available for seasonal variation analysis.</p>
      )}
      <p className="text-xs text-gray-400 mt-2">Green: Above yearly average, Orange: Significantly below, Purple: Around average.</p>
    </div>
  );
};

const CustomTooltipSeasonal: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold text-lg mb-2">{`Month: ${label}`}</p>
        <p style={{ color: payload[0].fill }} className="mb-1">
          {`Average: ${payload[0].value}%`}
        </p>
        <div className="mt-1 text-xs">
          <p className="font-medium">Data from year(s):</p>
          {data.years.map((y: {year: string, rate: number}, i:number) => <p key={i}>{y.year}: {y.rate}%</p>)}
        </div>
      </div>
    );
  }
  return null;
};

export default SeasonalVariationDetector;
