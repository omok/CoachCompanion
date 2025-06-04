import React, { useState, useMemo } from 'react';

interface MissedSessionImpactQuantifierProps {
  teamId: number;
}

// Re-using sample data structures from previous components for consistency
const players = [
  { id: 1, name: 'Player Bolt' }, { id: 2, name: 'Player Dash' }, { id: 3, name: 'Player Zoom' },
  { id: 4, name: 'Player Sprint' }, { id: 5, name: 'Player Ace' }
];

const skills = [
  { id: 'sprintSpeed', name: 'Sprint Speed (s)', higherIsBetter: false, typicalAvgImprovement: 0.2 }, // e.g. 0.2s reduction is avg
  { id: 'shotAccuracy', name: 'Shot Accuracy (%)', higherIsBetter: true, typicalAvgImprovement: 10 }, // e.g. 10% increase is avg
  { id: 'agilityDrill', name: 'Agility Drill (score)', higherIsBetter: true, typicalAvgImprovement: 15 }, // e.g. 15 points increase is avg
];

const attendanceData = [ /* Copied from OptimalAttendanceIdentifier, assuming comprehensive data */
  // Player 1 (Bolt) - High attendance ~85%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 1, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.85 })),
  ...Array(20).fill(null).map((_, i) => ({ playerId: 1, date: `2023-11-${Math.floor(i/2)+1}`, attended: Math.random() < 0.85 })),
  // Player 2 (Dash) - Mid attendance ~55%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 2, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.55 })),
  ...Array(20).fill(null).map((_, i) => ({ playerId: 2, date: `2023-11-${Math.floor(i/2)+1}`, attended: Math.random() < 0.55 })),
  // Player 3 (Zoom) - Low attendance ~35%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 3, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.35 })),
  ...Array(20).fill(null).map((_, i) => ({ playerId: 3, date: `2023-11-${Math.floor(i/2)+1}`, attended: Math.random() < 0.35 })),
  // Player 4 (Sprint) - Very High attendance ~95%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 4, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.95 })),
  ...Array(20).fill(null).map((_, i) => ({ playerId: 4, date: `2023-11-${Math.floor(i/2)+1}`, attended: Math.random() < 0.95 })),
  // Player 5 (Ace) - Mid-High attendance ~75%
  ...Array(20).fill(null).map((_, i) => ({ playerId: 5, date: `2023-10-${Math.floor(i/2)+1}`, attended: Math.random() < 0.75 })),
  ...Array(20).fill(null).map((_, i) => ({ playerId: 5, date: `2023-11-${Math.floor(i/2)+1}`, attended: Math.random() < 0.75 })),
];

const skillMetricsData = [ /* Copied from OptimalAttendanceIdentifier */
  { playerId: 1, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.5 }, { playerId: 1, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.1 },
  { playerId: 1, skillId: 'shotAccuracy', date: '2023-10-01', value: 60 }, { playerId: 1, skillId: 'shotAccuracy', date: '2023-11-30', value: 80 },
  { playerId: 1, skillId: 'agilityDrill', date: '2023-10-01', value: 70 }, { playerId: 1, skillId: 'agilityDrill', date: '2023-11-30', value: 85 },
  { playerId: 2, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.8 }, { playerId: 2, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.7 },
  { playerId: 2, skillId: 'shotAccuracy', date: '2023-10-01', value: 50 }, { playerId: 2, skillId: 'shotAccuracy', date: '2023-11-30', value: 60 },
  { playerId: 2, skillId: 'agilityDrill', date: '2023-10-01', value: 60 }, { playerId: 2, skillId: 'agilityDrill', date: '2023-11-30', value: 65 },
  { playerId: 3, skillId: 'sprintSpeed', date: '2023-10-01', value: 6.0 }, { playerId: 3, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.8 },
  { playerId: 3, skillId: 'shotAccuracy', date: '2023-10-01', value: 40 }, { playerId: 3, skillId: 'shotAccuracy', date: '2023-11-30', value: 42 },
  { playerId: 3, skillId: 'agilityDrill', date: '2023-10-01', value: 50 }, { playerId: 3, skillId: 'agilityDrill', date: '2023-11-30', value: 60 },
  { playerId: 4, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.3 }, { playerId: 4, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.0 },
  { playerId: 4, skillId: 'shotAccuracy', date: '2023-10-01', value: 70 }, { playerId: 4, skillId: 'shotAccuracy', date: '2023-11-30', value: 85 },
  { playerId: 4, skillId: 'agilityDrill', date: '2023-10-01', value: 80 }, { playerId: 4, skillId: 'agilityDrill', date: '2023-11-30', value: 95 },
  { playerId: 5, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.6 }, { playerId: 5, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.4 },
  { playerId: 5, skillId: 'shotAccuracy', date: '2023-10-01', value: 65 }, { playerId: 5, skillId: 'shotAccuracy', date: '2023-11-30', value: 75 },
  { playerId: 5, skillId: 'agilityDrill', date: '2023-10-01', value: 75 }, { playerId: 5, skillId: 'agilityDrill', date: '2023-11-30', value: 80 },
];

const timePeriod = { start: '2023-10-01', end: '2023-11-30' };

const MissedSessionImpactQuantifier: React.FC<MissedSessionImpactQuantifierProps> = ({ teamId }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(players[0].id);
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0].id);

  const impactAnalysis = useMemo(() => {
    const player = players.find(p => p.id === selectedPlayerId);
    const skillInfo = skills.find(s => s.id === selectedSkillId);
    if (!player || !skillInfo) return null;

    const playerAttendance = attendanceData.filter(
      a => a.playerId === player.id && a.date >= timePeriod.start && a.date <= timePeriod.end
    );
    const missedSessions = playerAttendance.filter(a => !a.attended).length;
    const totalSessions = playerAttendance.length;

    const playerSkillMetrics = skillMetricsData.filter(
      s => s.playerId === player.id && s.skillId === skillInfo.id
    ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let actualImprovement = 0;
    if (playerSkillMetrics.length >= 2) {
      const initialMetric = playerSkillMetrics[0];
      const finalMetric = playerSkillMetrics[playerSkillMetrics.length - 1];
      if(new Date(initialMetric.date) <= new Date(timePeriod.end) && new Date(finalMetric.date) >= new Date(timePeriod.start)){
        actualImprovement = finalMetric.value - initialMetric.value;
        if (!skillInfo.higherIsBetter) actualImprovement = -actualImprovement;
      }
    }

    const expectedImprovement = skillInfo.typicalAvgImprovement;
    const differenceFromExpected = actualImprovement - expectedImprovement;
    // For skills where lower is better, a positive difference means they improved *less* than expected (didn't decrease enough)
    // or a negative means they improved *more* than expected.
    // We want to phrase it as "improvement was X less/more than average".
    // If higherIsBetter: actual (20) - expected (10) = 10 (10 more). actual (5) - expected (10) = -5 (5 less)
    // If !higherIsBetter: actual (0.1s) - expected (0.2s) = -0.1. (This means they improved 0.1s LESS than expected.)
    // So, if !higherIsBetter, we flip the sign of differenceFromExpected for phrasing.
    const phrasingDifference = skillInfo.higherIsBetter ? differenceFromExpected : -differenceFromExpected;


    return {
      playerName: player.name,
      skillName: skillInfo.name,
      missedSessions,
      totalSessions,
      actualImprovement: parseFloat(actualImprovement.toFixed(skillInfo.id === 'sprintSpeed' ? 2:1)),
      expectedImprovement: parseFloat(expectedImprovement.toFixed(skillInfo.id === 'sprintSpeed' ? 2:1)),
      difference: parseFloat(phrasingDifference.toFixed(skillInfo.id === 'sprintSpeed' ? 2:1)),
      unit: skillInfo.id === 'sprintSpeed' ? 's' : (skillInfo.id === 'shotAccuracy' ? '%' : 'pts')
    };

  }, [selectedPlayerId, selectedSkillId]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Impact of Missed Sessions</h3>
      <p className="text-sm text-gray-500 mb-1">Team ID: {teamId}</p>
      <p className="text-xs text-gray-500 mb-4">Analyzes potential impact of missed sessions on skill development compared to a typical average.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="player-select-impact" className="block text-sm font-medium text-gray-700">Player</label>
          <select id="player-select-impact" value={selectedPlayerId} onChange={e => setSelectedPlayerId(parseInt(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="skill-select-impact" className="block text-sm font-medium text-gray-700">Skill</label>
          <select id="skill-select-impact" value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {impactAnalysis ? (
        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="text-md font-semibold text-amber-800 mb-1">
            Analysis for {impactAnalysis.playerName} on "{impactAnalysis.skillName}"
          </h4>
          <p className="text-sm text-gray-700">
            Missed <span className="font-semibold">{impactAnalysis.missedSessions}</span> out of <span className="font-semibold">{impactAnalysis.totalSessions}</span> sessions in the period.
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Actual improvement: <span className="font-semibold">{impactAnalysis.actualImprovement}{impactAnalysis.unit}</span>
          </p>
          <p className="text-sm text-gray-700">
            Typical average improvement: <span className="font-semibold">{impactAnalysis.expectedImprovement}{impactAnalysis.unit}</span>
          </p>
          <p className={`text-md font-semibold mt-2 ${impactAnalysis.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {impactAnalysis.difference >= 0
              ? `This player's improvement was ${impactAnalysis.difference}${impactAnalysis.unit} MORE than the typical average.`
              : `This player's improvement was ${Math.abs(impactAnalysis.difference)}${impactAnalysis.unit} LESS than the typical average.`}
          </p>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">Select a player and skill to see analysis.</p>
      )}
       <p className="text-xs text-gray-400 mt-3">Note: This is a simplified illustrative calculation. "Typical Average Improvement" is a predefined sample value and not derived from team data here. Real-world impact quantification is complex.</p>
    </div>
  );
};

export default MissedSessionImpactQuantifier;
