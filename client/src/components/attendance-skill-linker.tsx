import React, { useState, useMemo } from 'react';

interface AttendanceSkillLinkerProps {
  teamId: number;
}

// Sample Data
const players = [
  { id: 1, name: 'Player Bolt' },
  { id: 2, name: 'Player Dash' },
];

const skills = [
  { id: 'sprintSpeed', name: 'Sprint Speed (s)' },
  { id: 'shotAccuracy', name: 'Shot Accuracy (%)' },
];

// Attendance: { playerId: number, date: string, attended: boolean }
const attendanceData = [
  { playerId: 1, date: '2023-10-01', attended: true }, { playerId: 1, date: '2023-10-03', attended: true },
  { playerId: 1, date: '2023-10-05', attended: false },{ playerId: 1, date: '2023-10-08', attended: true },
  { playerId: 1, date: '2023-11-02', attended: true }, { playerId: 1, date: '2023-11-04', attended: true },
  { playerId: 2, date: '2023-10-01', attended: true }, { playerId: 2, date: '2023-10-03', attended: false },
  { playerId: 2, date: '2023-10-05', attended: true },{ playerId: 2, date: '2023-10-08', attended: false },
  { playerId: 2, date: '2023-11-02', attended: true }, { playerId: 2, date: '2023-11-04', attended: false },
];

// Skill Metrics: { playerId: number, skillId: string, date: string, value: number }
const skillMetricsData = [
  { playerId: 1, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.5 }, // Lower is better for speed
  { playerId: 1, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.2 },
  { playerId: 1, skillId: 'shotAccuracy', date: '2023-10-01', value: 60 },
  { playerId: 1, skillId: 'shotAccuracy', date: '2023-11-30', value: 75 },

  { playerId: 2, skillId: 'sprintSpeed', date: '2023-10-01', value: 5.8 },
  { playerId: 2, skillId: 'sprintSpeed', date: '2023-11-30', value: 5.9 },
  { playerId: 2, skillId: 'shotAccuracy', date: '2023-10-01', value: 50 },
  { playerId: 2, skillId: 'shotAccuracy', date: '2023-11-30', value: 55 },
];

const AttendanceSkillLinker: React.FC<AttendanceSkillLinkerProps> = ({ teamId }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(players[0].id);
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0].id);
  const [timePeriod, setTimePeriod] = useState<{start: string, end: string}>({ start: '2023-10-01', end: '2023-11-30'});

  // TODO: Fetch real data, allow more flexible time period selection.

  const relevantAttendance = useMemo(() => {
    return attendanceData.filter(
      a => a.playerId === selectedPlayerId && a.date >= timePeriod.start && a.date <= timePeriod.end
    ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedPlayerId, timePeriod]);

  const relevantSkillMetrics = useMemo(() => {
    return skillMetricsData.filter(
      s => s.playerId === selectedPlayerId && s.skillId === selectedSkillId && s.date >= timePeriod.start && s.date <= timePeriod.end
    ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedPlayerId, selectedSkillId, timePeriod]);

  const attendanceRateForPeriod = useMemo(() => {
    if(relevantAttendance.length === 0) return 0;
    const attendedCount = relevantAttendance.filter(a => a.attended).length;
    return parseFloat(((attendedCount / relevantAttendance.length) * 100).toFixed(1));
  }, [relevantAttendance]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Link Attendance with Skill Development</h3>
      <p className="text-sm text-gray-500 mb-4">Team ID: {teamId}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="player-select-linker" className="block text-sm font-medium text-gray-700">Player</label>
          <select id="player-select-linker" value={selectedPlayerId} onChange={e => setSelectedPlayerId(parseInt(e.target.value))}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="skill-select-linker" className="block text-sm font-medium text-gray-700">Skill</label>
          <select id="skill-select-linker" value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {/* Basic time period - can be expanded with date pickers */}
         <div className="col-span-full text-xs text-gray-500">
            (Data displayed for period: {timePeriod.start} to {timePeriod.end})
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-2">Attendance Summary</h4>
          <p className="text-2xl font-bold text-indigo-600">{attendanceRateForPeriod}%</p>
          <p className="text-sm text-gray-600">({relevantAttendance.filter(a=>a.attended).length} / {relevantAttendance.length} sessions attended)</p>
          <ul className="mt-2 text-xs max-h-32 overflow-y-auto">
            {relevantAttendance.map(a => (
              <li key={a.date} className={`p-1 rounded ${a.attended ? 'text-green-700' : 'text-red-700'}`}>
                {new Date(a.date).toLocaleDateString()}: {a.attended ? 'Attended' : 'Absent'}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700 mb-2">Skill Progression for "{skills.find(s=>s.id === selectedSkillId)?.name}"</h4>
          {relevantSkillMetrics.length > 0 ? (
             <ul className="mt-2 text-sm">
                {relevantSkillMetrics.map(s => (
                  <li key={s.date} className="mb-1 p-2 border-b">
                    {new Date(s.date).toLocaleDateString()}: <span className="font-semibold">{s.value}</span>
                    {s.skillId === 'sprintSpeed' ? ' s' : '%'}
                  </li>
                ))}
              </ul>
          ) : (
            <p className="text-sm text-gray-500">No skill data for selected period/skill.</p>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4">This component displays attendance and skill data side-by-side for a selected player and skill. Actual correlation analysis would require more advanced statistical methods.</p>
    </div>
  );
};

export default AttendanceSkillLinker;
