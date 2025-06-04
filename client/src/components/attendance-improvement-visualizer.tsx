import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface AttendanceImprovementVisualizerProps {
  teamId: number;
}

// Re-using sample data structures from AttendanceSkillLinker for consistency
const players = [
  { id: 1, name: 'Player Bolt' },
  { id: 2, name: 'Player Dash' },
  { id: 3, name: 'Player Zoom' }, // Added another player for more data points
];

const skills = [
  { id: 'sprintSpeed', name: 'Sprint Speed (s)', higherIsBetter: false },
  { id: 'shotAccuracy', name: 'Shot Accuracy (%)', higherIsBetter: true },
];

// Attendance: { playerId: number, date: string, attended: boolean }
const attendanceData = [
  // Player 1 (Bolt) - High attendance
  ...Array(10).fill(null).map((_, i) => ({ playerId: 1, date: `2023-10-${i+1}`, attended: Math.random() < 0.9 })), // 90% Oct
  ...Array(10).fill(null).map((_, i) => ({ playerId: 1, date: `2023-11-${i+1}`, attended: Math.random() < 0.8 })), // 80% Nov
  // Player 2 (Dash) - Mid attendance
  ...Array(10).fill(null).map((_, i) => ({ playerId: 2, date: `2023-10-${i+1}`, attended: Math.random() < 0.6 })), // 60% Oct
  ...Array(10).fill(null).map((_, i) => ({ playerId: 2, date: `2023-11-${i+1}`, attended: Math.random() < 0.5 })), // 50% Nov
  // Player 3 (Zoom) - Low attendance but maybe high improvement (or vice versa)
  ...Array(10).fill(null).map((_, i) => ({ playerId: 3, date: `2023-10-${i+1}`, attended: Math.random() < 0.3 })), // 30% Oct
  ...Array(10).fill(null).map((_, i) => ({ playerId: 3, date: `2023-11-${i+1}`, attended: Math.random() < 0.4 })), // 40% Nov
];

// Skill Metrics: { playerId: number, skillId: string, date: string, value: number }
const skillMetricsData = [
  // Bolt
  { playerId: 1, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.5 }, { playerId: 1, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.1 },
  { playerId: 1, skillId: 'shotAccuracy', date: '2023-10-01', value: 60 }, { playerId: 1, skillId: 'shotAccuracy', date: '2023-11-30', value: 80 },
  // Dash
  { playerId: 2, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.8 }, { playerId: 2, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.6 },
  { playerId: 2, skillId: 'shotAccuracy', date: '2023-10-01', value: 50 }, { playerId: 2, skillId: 'shotAccuracy', date: '2023-11-30', value: 60 },
  // Zoom
  { playerId: 3, skillId: 'sprintSpeed', date: '2023-10-01', value: 6.0 }, { playerId: 3, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.5 }, // Good improvement
  { playerId: 3, skillId: 'shotAccuracy', date: '2023-10-01', value: 40 }, { playerId: 3, skillId: 'shotAccuracy', date: '2023-11-30', value: 45 }, // Less improvement
];

const timePeriod = { start: '2023-10-01', end: '2023-11-30' }; // Fixed for this example

const AttendanceImprovementVisualizer: React.FC<AttendanceImprovementVisualizerProps> = ({ teamId }) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0].id);

  const correlationData = useMemo(() => {
    const selectedSkillInfo = skills.find(s => s.id === selectedSkillId);
    if (!selectedSkillInfo) return [];

    return players.map(player => {
      const playerAttendance = attendanceData.filter(
        a => a.playerId === player.id && a.date >= timePeriod.start && a.date <= timePeriod.end
      );
      const attendanceRate = playerAttendance.length > 0
        ? (playerAttendance.filter(a => a.attended).length / playerAttendance.length) * 100
        : 0;

      const playerSkillMetrics = skillMetricsData.filter(
        s => s.playerId === player.id && s.skillId === selectedSkillId
      ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let skillImprovement = 0;
      if (playerSkillMetrics.length >= 2) {
        const initialMetric = playerSkillMetrics[0];
        const finalMetric = playerSkillMetrics[playerSkillMetrics.length - 1];
        // Ensure metrics are within the selected time period for improvement calculation
        if(new Date(initialMetric.date) <= new Date(timePeriod.end) && new Date(finalMetric.date) >= new Date(timePeriod.start)){
            skillImprovement = finalMetric.value - initialMetric.value;
            if (!selectedSkillInfo.higherIsBetter) {
                skillImprovement = -skillImprovement; // e.g., for speed, lower time is better improvement
            }
        }
      }

      return {
        name: player.name,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        skillImprovement: parseFloat(skillImprovement.toFixed(selectedSkillInfo.id === 'sprintSpeed' ? 2 : 1)), // more precision for speed
      };
    });
  }, [selectedSkillId]);

  const selectedSkillDetails = skills.find(s => s.id === selectedSkillId);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Attendance vs. Skill Improvement</h3>
      <p className="text-sm text-gray-500 mb-1">Team ID: {teamId}</p>
      <p className="text-xs text-gray-500 mb-4">Period: {timePeriod.start} to {timePeriod.end}</p>

      <div className="mb-4">
        <label htmlFor="skill-select-visualizer" className="block text-sm font-medium text-gray-700">Select Skill to Visualize</label>
        <select id="skill-select-visualizer" value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)}
          className="mt-1 block w-full md:w-1/2 pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
          {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {correlationData.length > 0 && selectedSkillDetails ? (
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="attendanceRate" name="Attendance Rate" unit="%" domain={[0, 100]} />
            <YAxis type="number" dataKey="skillImprovement" name={`Skill Improvement (${selectedSkillDetails.name.split(' ')[1]})`} unit={selectedSkillDetails.id === 'sprintSpeed' ? 's' : '%'} />
            <ZAxis type="number" dataKey="name" name="Player" />{/* Using ZAxis to pass name to tooltip */}
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
            <Legend />
            <Scatter name="Players" data={correlationData} fill="#8884d8">
                {correlationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.attendanceRate > 70 ? (entry.skillImprovement > 0 ? '#82ca9d' : '#8884d8') : '#ff8042'}/>
                ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-500 py-10">Data not available for visualization.</p>
      )}
      <p className="text-xs text-gray-400 mt-2">Each point represents a player. This chart helps visualize if higher attendance correlates with greater skill improvement. (Green: High attendance, positive improvement. Purple: High attendance, no/neg improvement. Orange: Lower attendance).</p>
      <p className="text-xs text-gray-400 mt-1">Note: Regression lines and statistical significance indicators are not yet implemented.</p>
    </div>
  );
};

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Player data object
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg text-sm">
          <p className="font-semibold text-md mb-1">{data.name}</p>
          <p>{`Attendance: ${payload[0].value}%`}</p> {/* X value */}
          <p>{`Improvement: ${payload[1].value} ${payload[1].unit || ''}`}</p> {/* Y value */}
        </div>
      );
    }
    return null;
  };

export default AttendanceImprovementVisualizer;
