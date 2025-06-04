import React, { useState } from 'react';

interface AutomatedSummarySchedulerProps {
  teamId: number;
}

type Frequency = 'daily' | 'weekly' | 'monthly';

interface ScheduleSettings {
  frequency: Frequency;
  recipients: string; // Comma-separated emails
  reportType: string; // e.g., "Player Absences", "Overall Rate"
  isEnabled: boolean;
}

const AutomatedSummaryScheduler: React.FC<AutomatedSummarySchedulerProps> = ({ teamId }) => {
  const [schedule, setSchedule] = useState<ScheduleSettings>({
    frequency: 'weekly',
    recipients: 'coach@example.com, manager@example.com',
    reportType: 'Overall Rate & Low Performers',
    isEnabled: true,
  });
  const [message, setMessage] = useState<string>('');

  // TODO: Fetch current schedule settings from backend
  // TODO: Interact with backend to save/update schedule settings

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setSchedule(prev => ({ ...prev, [name]: checked }));
    } else {
        setSchedule(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveSchedule = () => {
    // Simulate saving to backend
    console.log('Saving schedule for team', teamId, schedule);
    setMessage(`Schedule updated successfully! Summaries will be sent ${schedule.frequency} to ${schedule.recipients}.`);
    setTimeout(() => setMessage(''), 5000); // Clear message after 5 seconds
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Automated Attendance Summaries</h3>
      <p className="text-sm text-gray-500 mb-4">Team ID: {teamId}</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="isEnabled" className="flex items-center text-sm font-medium text-gray-700">
            <input
                type="checkbox"
                id="isEnabled"
                name="isEnabled"
                checked={schedule.isEnabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2 focus:ring-indigo-500"
            />
            Enable Automated Summaries
          </label>
        </div>

        {schedule.isEnabled && (
          <>
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
              <select
                id="frequency"
                name="frequency"
                value={schedule.frequency}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label htmlFor="recipients" className="block text-sm font-medium text-gray-700">Recipients (comma-separated emails)</label>
              <input
                type="text"
                id="recipients"
                name="recipients"
                value={schedule.recipients}
                onChange={handleInputChange}
                placeholder="e.g., coach@example.com, assistant@example.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">Report Type / Content</label>
              <select
                id="reportType"
                name="reportType"
                value={schedule.reportType}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="Overall Rate & Low Performers">Overall Rate & Low Performers</option>
                <option value="Full Detailed Report">Full Detailed Report (link)</option>
                <option value="Absence Alerts Only">Absence Alerts Only</option>
              </select>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleSaveSchedule}
        className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300"
      >
        Save Schedule Settings
      </button>

      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
    </div>
  );
};

export default AutomatedSummaryScheduler;
