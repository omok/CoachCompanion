import React, { useMemo } from 'react';

interface UnusualAttendancePatternFlaggerProps {
  teamId: number;
  // TODO: Add props for defining what constitutes "unusual"
}

// Sample Data
const playerStats: { [key: string]: { name: string, typicalRate: number } } = {
  'p1': { name: 'Player Consistent', typicalRate: 90 },
  'p2': { name: 'Player Average', typicalRate: 70 },
  'p3': { name: 'Player Occasional', typicalRate: 50 },
};

// attendanceRecords: { date: string, playerId: string, attended: boolean, isKeySession?: boolean }[]
// keySession might be a championship prep, usually high attendance
const attendanceRecords = [
  // Player Consistent normally high, but missed 2 in a row
  { date: '2023-11-01', playerId: 'p1', attended: true },
  { date: '2023-11-03', playerId: 'p1', attended: true },
  { date: '2023-11-05', playerId: 'p1', attended: false }, // Unusual
  { date: '2023-11-07', playerId: 'p1', attended: false }, // Unusual
  { date: '2023-11-09', playerId: 'p1', attended: true },

  // Player Average, normal attendance
  { date: '2023-11-01', playerId: 'p2', attended: true },
  { date: '2023-11-03', playerId: 'p2', attended: false },
  { date: '2023-11-05', playerId: 'p2', attended: true },
  { date: '2023-11-07', playerId: 'p2', attended: true },

  // Session-level anomaly: Key session with very low turnout
  { date: '2023-11-10', teamSession: true, expected: 10, attended: 3, notes: "Key Pre-Game Briefing" }, // Unusual session
  { date: '2023-11-12', teamSession: true, expected: 10, attended: 8, notes: "Regular Practice" },
];

// More detailed player attendance for individual anomaly detection
const detailedPlayerAttendance = [
    // Player p1 (Consistent, 90%)
    ...Array(8).fill(null).map((_, i) => ({ date: `2023-10-${i*2+1}`, playerId: 'p1', attended: true })),
    { date: '2023-10-17', playerId: 'p1', attended: true },
    { date: '2023-10-19', playerId: 'p1', attended: true }, // 10 sessions, 100%

    // Recent sudden drop for p1
    { date: '2023-11-05', playerId: 'p1', attended: false },
    { date: '2023-11-07', playerId: 'p1', attended: false },
    { date: '2023-11-09', playerId: 'p1', attended: true }, // Recovered
    { date: '2023-11-12', playerId: 'p1', attended: false }, // Another miss

    // Player p2 (Average, 70%) - no major anomalies for this simple check
    ...Array(10).fill(null).map((_, i) => ({ date: `2023-10-${i+1}`, playerId: 'p2', attended: Math.random() < 0.7 })),
    ...Array(10).fill(null).map((_, i) => ({ date: `2023-11-${i+1}`, playerId: 'p2', attended: Math.random() < 0.75 })),
];


const UNUSUAL_DROP_THRESHOLD = 0.5; // 50% drop from typical rate
const CONSECUTIVE_MISSES_THRESHOLD = 2;

const UnusualAttendancePatternFlagger: React.FC<UnusualAttendancePatternFlaggerProps> = ({ teamId }) => {
  // TODO: Fetch attendance data and player baseline/typical rates
  // TODO: Implement more sophisticated anomaly detection algorithms

  const unusualPatterns = useMemo(() => {
    const flags: { type: string; description: string; date?: string, name?:string }[] = [];

    // 1. Check for sudden individual drops (consecutive misses for normally high-attendance players)
    Object.entries(playerStats).forEach(([id, player]) => {
        const playerRecords = detailedPlayerAttendance.filter(r => r.playerId === id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (playerRecords.length < CONSECUTIVE_MISSES_THRESHOLD) return;

        for (let i = 0; i <= playerRecords.length - CONSECUTIVE_MISSES_THRESHOLD; i++) {
            let consecutiveMisses = 0;
            for (let j = 0; j < CONSECUTIVE_MISSES_THRESHOLD; j++) {
                if (!playerRecords[i+j].attended) {
                    consecutiveMisses++;
                }
            }
            if (consecutiveMisses === CONSECUTIVE_MISSES_THRESHOLD) {
                 // Check if this is unusual based on typical rate
                if (player.typicalRate > 75) { // Only flag for typically high-attendance players
                    flags.push({
                        type: 'Player Consecutive Absences',
                        name: player.name,
                        description: `${player.name} (typically ${player.typicalRate}% attendance) missed ${CONSECUTIVE_MISSES_THRESHOLD} consecutive sessions.`,
                        date: playerRecords[i+CONSECUTIVE_MISSES_THRESHOLD-1].date,
                    });
                    i += CONSECUTIVE_MISSES_THRESHOLD -1; // Move past this block of absences
                }
            }
        }
    });

    // 2. Check for unusually low attendance for key team sessions
    attendanceRecords.filter(r => r.teamSession).forEach(session => {
      if (session.expected && session.attended !== undefined) {
        const attendanceRate = (session.attended / session.expected) * 100;
        // Flag if a "Key Session" has low attendance, or any session has extremely low.
        if ((session.notes && session.notes.toLowerCase().includes("key") && attendanceRate < 50) || attendanceRate < 25) {
          flags.push({
            type: 'Low Turnout for Session',
            description: `Session on ${session.date} (${session.notes || 'Regular'}) had unusually low attendance: ${session.attended}/${session.expected} (${attendanceRate.toFixed(0)}%).`,
            date: session.date,
          });
        }
      }
    });

    return flags.sort((a,b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()); // Show recent first
  }, [teamId]); // teamId for actual data fetching

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Unusual Attendance Patterns</h3>
      <p className="text-sm text-gray-500 mb-1">Team ID: {teamId}</p>
      <p className="text-xs text-gray-500 mb-3">Flags potential anomalies like sudden player drops or very low session turnouts.</p>

      {unusualPatterns.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {unusualPatterns.map((pattern, index) => (
            <li key={index} className="py-3">
              <p className="text-md font-medium text-red-700">{pattern.type} {pattern.name ? `(${pattern.name})` : ''}</p>
              <p className="text-sm text-gray-700">{pattern.description}</p>
              {pattern.date && <p className="text-xs text-gray-500">Around: {pattern.date}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-10">No unusual attendance patterns flagged based on current criteria.</p>
      )}
    </div>
  );
};

export default UnusualAttendancePatternFlagger;
