import React, { useState } from 'react';
import ReminderConfigModal from '@/components/reminder-config-modal'; // Import the modal

// ReminderConfig type now needs to encompass potential specific fields
interface ReminderConfig {
  id: string;
  type: string;
  name: string;
  description: string;
  isEnabled: boolean;
  timing?: string;
  templateId?: string;
  daysBefore?: number;
  balanceThreshold?: number;
  customMessage?: string;
}

const initialReminders: ReminderConfig[] = [
  { id: 'sr1', type: 'session_reminder', name: 'Practice Reminder', description: 'Sends a reminder before each practice.', isEnabled: true, timing: '24 hours before practice', daysBefore: 1, templateId: 'practice_default' },
  { id: 'pd1', type: 'payment_due', name: 'Payment Due Notification', description: 'Notifies members when payments are due.', isEnabled: true, timing: '1st day of month', templateId: 'payment_due_default' },
  { id: 'lb1', type: 'low_balance', name: 'Low Prepaid Balance Alert', description: 'Alerts when prepaid balance is low.', isEnabled: false, timing: 'When balance < X sessions', balanceThreshold: 2, templateId: 'low_balance_default' },
  { id: 'ea1', type: 'event_announcement', name: 'Special Event Announcement', description: 'For special events.', isEnabled: true, templateId: 'event_general', customMessage: "Don't miss out!" },
];

// Sample data for sent messages
const sampleSentMessages = [
    { id: 'msg1', subject: 'Important Update: Practice Time Change', content: 'Hi team, practice on Friday will be at 6 PM instead of 5 PM.', recipients: 'U12 Team', status: 'Sent', sentTime: '2023-11-20T10:00:00Z', deliveredCount: 18, failedCount: 2, isScheduled: false },
    { id: 'msg2', content: 'Tournament this weekend! Good luck!', recipients: 'All Players', status: 'Sent', sentTime: '2023-11-18T15:30:00Z', deliveredCount: 150, failedCount: 5, isScheduled: false },
    { id: 'msg3', subject: 'Upcoming Payment Reminder', content: 'Friendly reminder: Monthly fees are due next week.', recipients: 'All Members', status: 'Scheduled', scheduledTime: '2023-12-01T09:00:00Z', isScheduled: true },
    { id: 'msg4', content: 'No practice on Thanksgiving.', recipients: 'U10 Team, U12 Team', status: 'Sent', sentTime: '2023-11-15T11:00:00Z', deliveredCount: 35, failedCount: 0, isScheduled: false },
];


const AutomatedCommunicationPage: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderConfig[]>(initialReminders);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderConfig | null>(null);

  // State for Bulk Message form
  const [messageRecipients, setMessageRecipients] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [sentMessages, setSentMessages] = useState(sampleSentMessages);


  const toggleReminder = (id: string) => {
    setReminders(prevReminders => prevReminders.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    // TODO: Add API call to update reminder status on backend
    // TODO: Add API call to update reminder status on backend
  };

  const handleOpenModal = (reminder: ReminderConfig) => {
    setSelectedReminder(reminder);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedReminder(null);
    setIsModalOpen(false);
  };

  const handleSaveReminderConfig = (updatedReminder: ReminderConfig) => {
    setReminders(prev => prev.map(r => r.id === updatedReminder.id ? updatedReminder : r));
    // TODO: API call to save to backend
    handleCloseModal();
  };

  // Placeholder for teamId
  const teamId = "general";

  const handleBulkMessageSend = () => {
    if (!messageRecipients || !messageContent) {
      alert("Recipients and Message content are required.");
      return;
    }

    const now = new Date();
    const scheduledDateTime = scheduleDate ? new Date(scheduleDate) : null;
    const isScheduledMessage = scheduledDateTime && scheduledDateTime > now;

    const newMessage = {
      id: `msg${sentMessages.length + 1}`,
      subject: messageSubject || undefined,
      content: messageContent,
      recipients: messageRecipients,
      status: isScheduledMessage ? 'Scheduled' : 'Sent', // Simulate 'Sending' then 'Sent' if not scheduled
      sentTime: isScheduledMessage ? undefined : now.toISOString(),
      scheduledTime: isScheduledMessage ? scheduledDateTime.toISOString() : undefined,
      deliveredCount: isScheduledMessage ? undefined : Math.floor(Math.random() * (messageRecipients.split(',').length || 1)), // Mock delivery
      failedCount: isScheduledMessage ? undefined : 0, // Mock delivery
      isScheduled: !!isScheduledMessage,
    };

    setSentMessages(prev => [newMessage, ...prev]);

    // Clear form
    setMessageRecipients('');
    setMessageSubject('');
    setMessageContent('');
    setMessageTemplate('');
    setScheduleDate('');

    alert(`Message ${isScheduledMessage ? 'scheduled' : 'sent'} successfully! (Simulated)`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Automated Communication Center</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">Automated Reminders & Notifications</h2>
        <div className="space-y-4">
          {reminders.map(reminder => (
            <div key={reminder.id} className="bg-white shadow rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">{reminder.name}</h3>
                <p className="text-sm text-gray-600">{reminder.description}</p>
                <p className="text-xs text-gray-500 mt-1">Current Timing: {reminder.timing || 'Not set'}</p>
                {reminder.templateId && <p className="text-xs text-gray-500">Template: {reminder.templateId}</p>}
              </div>
              <div className="flex items-center space-x-3">
                <button
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => handleOpenModal(reminder)}
                >
                    Configure
                </button>
                <label htmlFor={`toggle-${reminder.id}`} className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" id={`toggle-${reminder.id}`} className="sr-only" checked={reminder.isEnabled} onChange={() => toggleReminder(reminder.id)}/>
                    <div className={`block w-10 h-6 rounded-full ${reminder.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${reminder.isEnabled ? 'transform translate-x-full' : ''}`}></div>
                  </div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">Custom Reminder Templates</h2>
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-gray-700">Manage your custom message templates for various reminders.</p>
            <button className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm" onClick={() => alert('Template creation UI not implemented yet.')}>
              Create New Template
            </button>
          </div>
          {/* Placeholder list of templates */}
          <div className="space-y-2">
            {['practice_default', 'payment_due_default', 'low_balance_default', 'event_general', 'custom_event_promo_1'].map(templateId => (
              <div key={templateId} className="p-3 border rounded-md bg-gray-50 flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium text-gray-800">{templateId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  <p className="text-xs text-gray-500">Type: {templateId.includes('event') ? 'Event' : templateId.includes('payment') ? 'Payment' : 'General'}</p>
                </div>
                <button className="text-xs text-blue-500 hover:text-blue-700" onClick={() => alert(`Edit template ${templateId}`)}>Edit</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isModalOpen && selectedReminder && (
        <ReminderConfigModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          reminder={selectedReminder}
          onSave={handleSaveReminderConfig}
        />
      )}

      {/* Section for Bulk Messaging */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">Bulk Messaging</h2>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-700 mb-3">Send messages to teams, groups, or individuals.</p>
          {/* Placeholder for bulk messaging UI: compose, recipients, schedule, templates, status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Compose & Schedule */}
            <div>
              <h3 className="text-lg font-medium mb-2">Compose Message</h3>
              <div>
                <label htmlFor="messageRecipients" className="block text-sm font-medium text-gray-700">Recipients</label>
                <input type="text" name="messageRecipients" id="messageRecipients" value={messageRecipients} onChange={e => setMessageRecipients(e.target.value)} placeholder="e.g., 'Team Alpha', 'U12 Parents', specific emails..."
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                <p className="text-xs text-gray-500 mt-1">Filter by team, role, or custom group (UI placeholder).</p>
              </div>
              <div className="mt-3">
                <label htmlFor="messageSubject" className="block text-sm font-medium text-gray-700">Subject (Optional for SMS)</label>
                <input type="text" name="messageSubject" id="messageSubject" value={messageSubject} onChange={e => setMessageSubject(e.target.value)}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
              </div>
              <div className="mt-3">
                <label htmlFor="messageContent" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea name="messageContent" id="messageContent" value={messageContent} onChange={e => setMessageContent(e.target.value)} rows={6} placeholder="Enter your message. Rich text editor placeholder. Basic media support (e.g. image link) placeholder."
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                <p className="text-xs text-gray-500 mt-1">Variables like [PlayerName] can be used from templates.</p>
              </div>
              <div className="mt-3">
                 <label htmlFor="messageTemplate" className="block text-sm font-medium text-gray-700">Use Template (Optional)</label>
                 <select name="messageTemplate" id="messageTemplate" value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md sm:text-sm">
                    <option value="">No Template</option>
                    <option value="template_event_general">General Event Announcement</option>
                    <option value="custom_event_promo_1">Custom Event Promo 1</option>
                 </select>
              </div>
              <div className="mt-4">
                <label htmlFor="scheduleDate" className="block text-sm font-medium text-gray-700">Schedule for (Optional)</label>
                <input type="datetime-local" name="scheduleDate" id="scheduleDate" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"/>
                <p className="text-xs text-gray-500 mt-1">Leave blank to send immediately.</p>
              </div>
              <button onClick={handleBulkMessageSend} className="mt-5 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Send / Schedule Message
              </button>
            </div>

            {/* Right Column: Delivery Status */}
            <div>
              <h3 className="text-lg font-medium mb-2">Delivery Status</h3>
              <div className="p-3 border rounded-md bg-gray-50 max-h-96 overflow-y-auto">
                {sentMessages.map(msg => (
                    <div key={msg.id} className="py-2 border-b last:border-b-0">
                        <p className="text-sm font-medium">{msg.subject || msg.content.substring(0,30)+ '...' } <span className={`text-xs px-1.5 py-0.5 rounded-full ${msg.status === 'Sent' ? 'bg-green-100 text-green-700' : msg.status === 'Scheduled' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{msg.status}</span></p>
                        <p className="text-xs text-gray-500">To: {msg.recipients} | {msg.isScheduled ? `Scheduled: ${new Date(msg.scheduledTime || '').toLocaleString()}` : `Sent: ${new Date(msg.sentTime || '').toLocaleString()}`}</p>
                        {msg.status === 'Sent' && <p className="text-xs text-gray-500">Delivered: {msg.deliveredCount}, Failed: {msg.failedCount}</p>}
                    </div>
                ))}
                {sentMessages.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No messages sent recently.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

       <p className="text-xs text-gray-400 mt-8">Note: This is a foundational UI. Configuration options, template editing, and actual reminder logic require backend implementation.</p>
    </div>
  );
};

export default AutomatedCommunicationPage;
