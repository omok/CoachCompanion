import React, { useState, useMemo } from 'react';

interface OptimalAttendanceIdentifierProps {
  teamId: number;
}

// Re-using sample data & logic from AttendanceImprovementVisualizer for consistency
const players = [
  { id: 1, name: 'Player Bolt' }, { id: 2, name: 'Player Dash' }, { id: 3, name: 'Player Zoom' },
  { id: 4, name: 'Player Sprint' }, { id: 5, name: 'Player Ace' } // Added more players
];

const skills = [
  { id: 'sprintSpeed', name: 'Sprint Speed (s)', higherIsBetter: false },
  { id: 'shotAccuracy', name: 'Shot Accuracy (%)', higherIsBetter: true },
  { id: 'agilityDrill', name: 'Agility Drill (score)', higherIsBetter: true },
];

const attendanceData = [ /* Assuming more comprehensive data for 5 players over Oct-Nov */
  // Player 1 (Bolt) - High attendance ~85%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 1, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.85 })),
  // Player 2 (Dash) - Mid attendance ~55%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 2, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.55 })),
  // Player 3 (Zoom) - Low attendance ~35%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 3, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.35 })),
  // Player 4 (Sprint) - Very High attendance ~95%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 4, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.95 })),
  // Player 5 (Ace) - Mid-High attendance ~75%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 5, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.75 })),
];
// Extending to Nov for all players for two month period
attendanceData.push(...attendanceData.map(d => ({...d, date: d.date.replace('-10-', '-11-')})));


const skillMetricsData = [ /* Expanded for more players and skills */
  // Bolt (P1)
  { playerId: 1, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.5 }, { playerId: 1, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.1 },
  { playerId: 1, skillId: 'shotAccuracy', date: '2023-10-01', value: 60 }, { playerId: 1, skillId: 'shotAccuracy', date: '2023-11-30', value: 80 },
  { playerId: 1, skillId: 'agilityDrill', date: '2023-10-01', value: 70 }, { playerId: 1, skillId: 'agilityDrill', date: '2023-11-30', value: 85 },
  // Dash (P2)
  { playerId: 2, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.8 }, { playerId: 2, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.7 },
  { playerId: 2, skillId: 'shotAccuracy', date: '2023-10-01', value: 50 }, { playerId: 2, skillId: 'shotAccuracy', date: '2023-11-30', value: 60 },
  { playerId: 2, skillId: 'agilityDrill', date: '2023-10-01', value: 60 }, { playerId: 2, skillId: 'agilityDrill', date: '2023-11-30', value: 65 },
  // Zoom (P3)
  { playerId: 3, skillId: 'sprintSpeed', date: '2023-10-01', value: 6.0 }, { playerId: 3, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.8 }, // Good speed imp.
  { playerId: 3, skillId: 'shotAccuracy', date: '2023-10-01', value: 40 }, { playerId: 3, skillId: 'shotAccuracy', date: '2023-11-30', value: 42 }, // Low acc. imp.
  { playerId: 3, skillId: 'agilityDrill', date: '2023-10-01', value: 50 }, { playerId: 3, skillId: 'agilityDrill', date: '2023-11-30', value: 60 }, // Decent agility imp.
  // Sprint (P4)
  { playerId: 4, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.3 }, { playerId: 4, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.0 }, // Excellent speed imp.
  { playerId: 4, skillId: 'shotAccuracy', date: '2023-10-01', value: 70 }, { playerId: 4, skillId: 'shotAccuracy', date: '2023-11-30', value: 85 }, // Excellent acc. imp.
  { playerId: 4, skillId: 'agilityDrill', date: '2023-10-01', value: 80 }, { playerId: 4, skillId: 'agilityDrill', date: '2023-11-30', value: 95 }, // Excellent agility imp.
  // Ace (P5)
  { playerId: 5, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.6 }, { playerId: 5, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.4 },
  { playerId: 5, skillId: 'shotAccuracy', date: '2023-10-01', value: 65 }, { playerId: 5, skillId: 'shotAccuracy', date: '2023-11-30', value: 75 },
  { playerId: 5, skillId: 'agilityDrill', date: '2023-10-01', value: 75 }, { playerId: 5, skillId: 'agilityDrill', date: '2023-11-30', value: 80 },
];

const timePeriod = { start: '2023-10-01', end: '2023-11-30' };
const TOP_IMPROVERS_PERCENTILE = 0.4; // Consider top 40% as high improvers

const OptimalAttendanceIdentifier: React.FC<OptimalAttendanceIdentifierProps> = ({ teamId }) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0].id);

  const optimalPatternInfo = useMemo(() => {
    const selectedSkillInfo = skills.find(s => s.id === selectedSkillId);
    if (!selectedSkillInfo) return null;

    // Calculate attendanceRate and skillImprovement for all players (similar to Visualizer)
    const playerData = players.map(player => {
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
         if(new Date(initialMetric.date) <= new Date(timePeriod.end) && new Date(finalMetric.date) >= new Date(timePeriod.start)){
            skillImprovement = finalMetric.value - initialMetric.value;
            if (!selectedSkillInfo.higherIsBetter) skillImprovement = -skillImprovement;
        }
      }
      return { name: player.name, attendanceRate, skillImprovement };
    });

    // Identify top improvers
    const sortedByImprovement = [...playerData].sort((a, b) => b.skillImprovement - a.skillImprovement);
    const topImproversCount = Math.max(1, Math.floor(sortedByImprovement.length * TOP_IMPROVERS_PERCENTILE));
    const topImprovers = sortedByImprovement.slice(0, topImproversCount);

    if (topImprovers.length === 0) return { skillName: selectedSkillInfo.name, avgAttendance: 0, improvers: [] };

    const avgAttendanceOfTopImprovers = topImprovers.reduce((sum, p) => sum + p.attendanceRate, 0) / topImprovers.length;

    return {
      skillName: selectedSkillInfo.name,
      avgAttendance: parseFloat(avgAttendanceOfTopImprovers.toFixed(1)),
      improvers: topImprovers.map(p => ({ name: p.name, attendance: p.attendanceRate, improvement: p.skillImprovement.toFixed(selectedSkillInfo.id === 'sprintSpeed' ? 2:1) }))
    };

  }, [selectedSkillId]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Optimal Attendance Patterns for Development</h3>
      <p className="text-sm text-gray-500 mb-1">Team ID: {teamId}</p>
      <p className="text-xs text-gray-500 mb-4">Identifies average attendance of top performing players for a chosen skill.</p>

      <div className="mb-4">
        <label htmlFor="skill-select-optimal" className="block text-sm font-medium text-gray-700">Select Skill</label>
        <select id="skill-select-optimal" value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)}
          className="mt-1 block w-full md:w-1/2 pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
          {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {optimalPatternInfo ? (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-indigo-800">
            For "{optimalPatternInfo.skillName}":
          </h4>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            ~{optimalPatternInfo.avgAttendance}% Average Attendance
          </p>
          <p className="text-sm text-indigo-700">
            was observed among the top {optimalPatternInfo.improvers.length} player(s) showing the most improvement.
          </p>
          <div className="mt-3 text-xs text-indigo-600">
            <p className="font-medium">Top Improvers Detail:</p>
            <ul className="list-disc list-inside">
              {optimalPatternInfo.improvers.map(p => (
                <li key={p.name}>{p.name} (Att: {p.attendance}%, Imp: {p.improvement})</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">Select a skill to see optimal attendance patterns.</p>
      )}
      <p className="text-xs text-gray-400 mt-3">Note: "Optimal" is simplified here as the average attendance of the players who improved the most in the selected skill over the period Oct-Nov 2023. More complex factors are not considered.</p>
    </div>
  );
};

export default OptimalAttendanceIdentifier;
