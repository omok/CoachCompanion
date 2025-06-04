import React, { useMemo } from 'react';

interface LowAttendanceHighlighterProps {
  teamId: number;
  // TODO: Add props for threshold, date range, etc.
}

// Sample Session Data: Array of { date: string (YYYY-MM-DD), time: string (HH:MM), expected: number, attended: number }
const sampleSessionRecords = [
  // Monday Mornings: Good attendance
  { date: '2023-11-06', time: '09:00', expected: 10, attended: 9 },
  { date: '2023-11-13', time: '09:00', expected: 10, attended: 8 },
  { date: '2023-11-20', time: '09:00', expected: 10, attended: 9 },

  // Wednesday Afternoons: Mixed
  { date: '2023-11-01', time: '15:00', expected: 10, attended: 7 },
  { date: '2023-11-08', time: '15:00', expected: 10, attended: 8 },
  { date: '2023-11-15', time: '15:00', expected: 10, attended: 6 },
  { date: '2023-11-22', time: '15:00', expected: 10, attended: 7 },

  // Friday Afternoons: Consistently Low
  { date: '2023-11-03', time: '16:00', expected: 10, attended: 4 },
  { date: '2023-11-10', time: '16:00', expected: 10, attended: 3 },
  { date: '2023-11-17', time: '16:00', expected: 10, attended: 5 },
  { date: '2023-11-24', time: '16:00', expected: 10, attended: 4 },

  // Saturday Mornings: Good
  { date: '2023-11-04', time: '10:00', expected: 10, attended: 9 },
  { date: '2023-11-11', time: '10:00', expected: 10, attended: 10 },
  { date: '2023-11-18', time: '10:00', expected: 10, attended: 8 },
];

const LOW_ATTENDANCE_THRESHOLD_PERCENTAGE = 50; // Below 50% is considered low
const MIN_SESSIONS_FOR_PATTERN = 3; // Need at least 3 sessions in a slot to consider it a pattern

const getDayOfWeek = (dateString: string): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateString).getDay()];
};

const LowAttendanceHighlighter: React.FC<LowAttendanceHighlighterProps> = ({ teamId }) => {
  // TODO: Fetch session attendance data for the team
  // TODO: Allow customization of threshold and min sessions

  const lowAttendanceSlots = useMemo(() => {
    const slots: { [key: string]: { totalExpected: number, totalAttended: number, sessionCount: number } } = {};

    sampleSessionRecords.forEach(record => {
      const dayOfWeek = getDayOfWeek(record.date);
      // For simplicity, using broad time slots like "Morning" (before 12pm), "Afternoon" (12pm-5pm), "Evening" (after 5pm)
      const hour = parseInt(record.time.split(':')[0], 10);
      let timeSlotName: string;
      if (hour < 12) timeSlotName = "Morning";
      else if (hour < 17) timeSlotName = "Afternoon";
      else timeSlotName = "Evening";

      const slotKey = `${dayOfWeek} ${timeSlotName}`;

      if (!slots[slotKey]) {
        slots[slotKey] = { totalExpected: 0, totalAttended: 0, sessionCount: 0 };
      }
      slots[slotKey].totalExpected += record.expected;
      slots[slotKey].totalAttended += record.attended;
      slots[slotKey].sessionCount++;
    });

    const flaggedSlots: { slot: string; averageRate: number; sessions: number }[] = [];

    Object.entries(slots).forEach(([slotKey, data]) => {
      if (data.sessionCount >= MIN_SESSIONS_FOR_PATTERN && data.totalExpected > 0) {
        const averageRate = (data.totalAttended / data.totalExpected) * 100;
        if (averageRate < LOW_ATTENDANCE_THRESHOLD_PERCENTAGE) {
          flaggedSlots.push({ slot: slotKey, averageRate: parseFloat(averageRate.toFixed(1)), sessions: data.sessionCount });
        }
      }
    });
    return flaggedSlots.sort((a,b) => a.averageRate - b.averageRate); // Show lowest first
  }, [teamId]); // teamId for actual data fetching

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Low Attendance Slots</h3>
      <p className="text-sm text-gray-500 mb-1">Team ID: {teamId}</p>
      <p className="text-xs text-gray-500 mb-3">Highlights day/time slots with average attendance below {LOW_ATTENDANCE_THRESHOLD_PERCENTAGE}% over at least {MIN_SESSIONS_FOR_PATTERN} sessions.</p>

      {lowAttendanceSlots.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {lowAttendanceSlots.map(slotInfo => (
            <li key={slotInfo.slot} className="py-3">
              <p className="text-md font-medium text-orange-600">{slotInfo.slot}</p>
              <p className="text-sm text-gray-700">
                Average Attendance: {slotInfo.averageRate}% over {slotInfo.sessions} sessions.
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-10">No consistent low attendance slots detected.</p>
      )}
    </div>
  );
};

export default LowAttendanceHighlighter;
