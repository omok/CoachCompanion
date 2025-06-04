import React, { useState } from 'react';

interface NotificationPreference {
  id: string; // e.g., 'practiceReminders', 'paymentUpdates', 'generalAnnouncements'
  label: string;
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

interface CommunicationPreferences {
  notificationPrefs: NotificationPreference[];
  preferredChannel: 'email' | 'sms' | 'inApp' | 'any';
  frequency: 'immediate' | 'dailyDigest' | 'weeklyDigest';
  optOutAll: boolean;
  language: string;
}

const initialPreferences: CommunicationPreferences = {
  notificationPrefs: [
    { id: 'practiceReminders', label: 'Practice & Session Reminders', email: true, sms: false, inApp: true },
    { id: 'gameUpdates', label: 'Game Schedule Changes & Updates', email: true, sms: true, inApp: true },
    { id: 'paymentUpdates', label: 'Payment Dues & Confirmations', email: true, sms: false, inApp: true },
    { id: 'lowBalanceAlerts', label: 'Low Prepaid Session Balance', email: true, sms: true, inApp: false },
    { id: 'teamNews', label: 'General Team News & Announcements', email: true, sms: false, inApp: true },
    { id: 'eventInvitations', label: 'Special Event Invitations', email: true, sms: false, inApp: true },
  ],
  preferredChannel: 'email',
  frequency: 'immediate',
  optOutAll: false,
  language: 'en-US',
};

const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Español (España)' },
  { code: 'fr-FR', name: 'Français (France)' },
];

const CommunicationPreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState<CommunicationPreferences>(initialPreferences);
  const [savedMessage, setSavedMessage] = useState<string>('');

  const handleNotificationPrefChange = (id: string, channel: 'email' | 'sms' | 'inApp') => {
    setPreferences(prev => ({
      ...prev,
      notificationPrefs: prev.notificationPrefs.map(pref =>
        pref.id === id ? { ...pref, [channel]: !pref[channel] } : pref
      ),
    }));
  };

  const handleSingleFieldChange = (field: keyof CommunicationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
     if (field === 'optOutAll' && value === true) {
        // If opting out of all, disable individual toggles (visually or functionally)
        setPreferences(prev => ({
            ...prev,
            notificationPrefs: prev.notificationPrefs.map(p => ({...p, email: false, sms: false, inApp: false}))
        }));
    }
  };

  const handleSavePreferences = () => {
    // TODO: API call to save preferences to backend for the logged-in user
    console.log("Saving preferences:", preferences);
    setSavedMessage("Preferences saved successfully!");
    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Communication Preferences</h1>

      {/* Notification Preferences per type */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Notification Types</h2>
        <p className="text-sm text-gray-600 mb-4">Choose how you want to be notified for different types of communications.</p>
        <div className="space-y-3">
          {preferences.notificationPrefs.map(pref => (
            <div key={pref.id} className="p-4 border rounded-md bg-white shadow-sm">
              <label className="font-medium text-gray-800">{pref.label}</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['email', 'sms', 'inApp'] as const).map(channel => (
                  <label key={channel} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pref[channel]}
                      onChange={() => handleNotificationPrefChange(pref.id, channel)}
                      disabled={preferences.optOutAll}
                      className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out rounded"
                    />
                    <span>{channel.charAt(0).toUpperCase() + channel.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Channel Selection */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Preferred Primary Channel</h2>
         <p className="text-sm text-gray-600 mb-3">Select your main channel if a specific one isn't set above or for critical alerts.</p>
        <select
            value={preferences.preferredChannel}
            onChange={e => handleSingleFieldChange('preferredChannel', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            disabled={preferences.optOutAll}
        >
          <option value="any">No Preference (Use best available)</option>
          <option value="email">Email</option>
          <option value="sms">SMS (Text Message)</option>
          <option value="inApp">In-App Notification</option>
        </select>
      </section>

      {/* Frequency Controls */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Notification Frequency</h2>
        <p className="text-sm text-gray-600 mb-3">For non-urgent updates like digests (if applicable).</p>
        <select
            value={preferences.frequency}
            onChange={e => handleSingleFieldChange('frequency', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            disabled={preferences.optOutAll}
        >
          <option value="immediate">Immediate</option>
          <option value="dailyDigest">Daily Digest</option>
          <option value="weeklyDigest">Weekly Digest</option>
        </select>
      </section>

      {/* Language Preferences */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Language Preference</h2>
        <select
            value={preferences.language}
            onChange={e => handleSingleFieldChange('language', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
        </select>
      </section>

      {/* Opt-out Management */}
      <section className="mb-8 p-4 border border-red-300 rounded-md bg-red-50">
        <h2 className="text-xl font-semibold mb-2 text-red-700">Opt-Out Management</h2>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.optOutAll}
            onChange={e => handleSingleFieldChange('optOutAll', e.target.checked)}
            className="form-checkbox h-5 w-5 text-red-600 transition duration-150 ease-in-out rounded"
          />
          <span className="text-sm font-medium text-red-800">Unsubscribe from all non-critical communications.</span>
        </label>
         <p className="text-xs text-red-600 mt-1">Note: You may still receive essential system messages (e.g., password resets, critical safety alerts).</p>
      </section>

      <button
        onClick={handleSavePreferences}
        className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        Save Preferences
      </button>
      {savedMessage && <p className="mt-3 text-sm text-green-600 text-center">{savedMessage}</p>}
    </div>
  );
};

export default CommunicationPreferencesPage;
