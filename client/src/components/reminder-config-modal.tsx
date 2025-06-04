import React from 'react';

interface ReminderConfig {
  id: string;
  type: string;
  name: string;
  description: string;
  isEnabled: boolean;
  timing?: string;
  templateId?: string;
  // Add more specific fields as needed, e.g.
  daysBefore?: number; // For session reminders
  balanceThreshold?: number; // For low balance alerts
  customMessage?: string; // For custom part of template
}

interface ReminderConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: ReminderConfig | null;
  onSave: (updatedReminder: ReminderConfig) => void;
}

const ReminderConfigModal: React.FC<ReminderConfigModalProps> = ({ isOpen, onClose, reminder, onSave }) => {
  const [editableReminder, setEditableReminder] = React.useState<ReminderConfig | null>(reminder);

  React.useEffect(() => {
    setEditableReminder(reminder);
  }, [reminder]);

  if (!isOpen || !editableReminder) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
     if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setEditableReminder(prev => prev ? { ...prev, [name]: checked } : null);
    } else if (type === 'number') {
        setEditableReminder(prev => prev ? { ...prev, [name]: parseInt(value, 10) } : null);
    }
     else {
        setEditableReminder(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSave = () => {
    if (editableReminder) {
      onSave(editableReminder);
    }
  };

  const renderConfigFields = () => {
    switch (editableReminder.type) {
        case 'session_reminder':
            return (
                <div>
                    <label htmlFor="daysBefore" className="block text-sm font-medium text-gray-700 mt-2">Days Before Session</label>
                    <input type="number" name="daysBefore" id="daysBefore" value={editableReminder.daysBefore || ''} onChange={handleChange}
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                    <p className="text-xs text-gray-500">e.g., 1 for 24 hours, 2 for 48 hours before.</p>
                </div>
            );
        case 'low_balance':
            return (
                 <div>
                    <label htmlFor="balanceThreshold" className="block text-sm font-medium text-gray-700 mt-2">Balance Threshold</label>
                    <input type="number" name="balanceThreshold" id="balanceThreshold" value={editableReminder.balanceThreshold || ''} onChange={handleChange}
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                     <p className="text-xs text-gray-500">e.g., Alert when balance is less than 2 sessions.</p>
                </div>
            );
        // Add cases for 'payment_due', 'event_announcement' with their specific fields
        default:
            return <p className="text-sm text-gray-500 mt-2">No type-specific configurations for this reminder yet.</p>;
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Configure: {editableReminder.name}</h3>

          <div className="text-left space-y-3">
            <div>
                <label htmlFor="isEnabledModal" className="flex items-center text-sm font-medium text-gray-700">
                    <input type="checkbox" name="isEnabled" id="isEnabledModal" checked={editableReminder.isEnabled} onChange={handleChange} className="h-4 w-4 mr-2"/>
                    Enable this Reminder
                </label>
            </div>
            <div>
                <label htmlFor="timing" className="block text-sm font-medium text-gray-700">Timing Description</label>
                <input type="text" name="timing" id="timing" value={editableReminder.timing || ''} onChange={handleChange}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
            </div>
            {renderConfigFields()}
            <div>
                <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mt-2">Template ID</label>
                <input type="text" name="templateId" id="templateId" value={editableReminder.templateId || 'default_template'} onChange={handleChange}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                 <p className="text-xs text-gray-500">Select from available templates (e.g., default_session_reminder).</p>
            </div>
             <div>
                <label htmlFor="customMessage" className="block text-sm font-medium text-gray-700 mt-2">Custom Message Snippet (Optional)</label>
                <textarea name="customMessage" id="customMessage" value={editableReminder.customMessage || ''} onChange={handleChange} rows={3}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
            </div>
          </div>

          <div className="items-center px-4 py-3 mt-6">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-auto hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Save Configuration
            </button>
            <button
              onClick={onClose}
              className="ml-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-auto hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderConfigModal;
