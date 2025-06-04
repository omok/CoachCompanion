import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

// Sample Data Structures
interface MessageAnalytic {
  id: string;
  name: string; // e.g., "Newsletter Oct", "Practice Reminder Nov 5th"
  sent: number;
  delivered: number;
  opened: number; // Or "read" for SMS/In-App
  clicked?: number; // For emails with links
  responded?: number; // If responses are tracked
}

interface EngagementMetric {
  date: string; // e.g., "2023-11-01"
  activeUsers: number; // Users who opened/clicked at least one message
  totalMessagesOpened: number;
}

const sampleMessageAnalytics: MessageAnalytic[] = [
  { id: 'm1', name: 'October Newsletter', sent: 500, delivered: 480, opened: 120, clicked: 30, responded: 5 },
  { id: 'm2', name: 'Practice Reminder - Nov 5', sent: 60, delivered: 58, opened: 45 },
  { id: 'm3', name: 'Payment Due - Nov', sent: 450, delivered: 440, opened: 200, responded: 50 },
  { id: 'm4', name: 'Event: Holiday Party Invite', sent: 520, delivered: 510, opened: 300, clicked: 150 },
  { id: 'm5', name: 'U12 Game Update - Nov 10', sent: 30, delivered: 30, opened: 28 },
];

const sampleEngagementMetrics: EngagementMetric[] = [
  { date: '2023-11-01', activeUsers: 150, totalMessagesOpened: 200 },
  { date: '2023-11-08', activeUsers: 130, totalMessagesOpened: 180 },
  { date: '2023-11-15', activeUsers: 160, totalMessagesOpened: 220 },
  { date: '2023-11-22', activeUsers: 140, totalMessagesOpened: 190 },
  { date: '2023-11-29', activeUsers: 175, totalMessagesOpened: 250 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CommunicationAnalyticsPage: React.FC = () => {
  // TODO: Fetch actual analytics data from backend

  const overallStats = {
    totalSent: sampleMessageAnalytics.reduce((sum, m) => sum + m.sent, 0),
    avgOpenRate: parseFloat(((sampleMessageAnalytics.reduce((sum, m) => sum + m.opened, 0) / sampleMessageAnalytics.reduce((sum, m) => sum + m.delivered, 0)) * 100).toFixed(1)) || 0,
    avgClickRate: parseFloat(((sampleMessageAnalytics.filter(m=>m.clicked).reduce((sum, m) => sum + (m.clicked || 0), 0) / sampleMessageAnalytics.filter(m=>m.clicked).reduce((sum, m) => sum + m.opened, 0)) * 100).toFixed(1)) || 0,
  };

  const messagePerformanceData = sampleMessageAnalytics.map(m => ({
    name: m.name,
    openRate: m.delivered > 0 ? parseFloat(((m.opened / m.delivered) * 100).toFixed(1)) : 0,
    clickRate: m.opened > 0 && m.clicked ? parseFloat(((m.clicked / m.opened) * 100).toFixed(1)) : 0,
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Communication Analytics</h1>

      {/* Overall Summary Metrics */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white shadow rounded-lg text-center"><p className="text-sm text-gray-500">Total Messages Sent</p><p className="text-3xl font-bold">{overallStats.totalSent.toLocaleString()}</p></div>
        <div className="p-4 bg-white shadow rounded-lg text-center"><p className="text-sm text-gray-500">Avg. Open Rate</p><p className="text-3xl font-bold">{overallStats.avgOpenRate}%</p></div>
        <div className="p-4 bg-white shadow rounded-lg text-center"><p className="text-sm text-gray-500">Avg. Click-Through Rate (on opened)</p><p className="text-3xl font-bold">{overallStats.avgClickRate}%</p></div>
      </section>

      {/* Message Open/Read Rates & Response Tracking (Per Message) */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Message Performance</h2>
        <div className="bg-white shadow rounded-lg p-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={messagePerformanceData} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} style={{fontSize: '0.8rem'}}/>
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" label={{ value: 'Open Rate (%)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Click Rate (%)', angle: -90, position: 'insideRight' }}/>
              <Tooltip />
              <Legend verticalAlign="top" />
              <Bar yAxisId="left" dataKey="openRate" fill="#8884d8" name="Open Rate" />
              <Bar yAxisId="right" dataKey="clickRate" fill="#82ca9d" name="Click-Through Rate (on opened)" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2">Response tracking would require specific campaign setup and is not shown here.</p>
        </div>
      </section>

      {/* Engagement Metrics Over Time */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Engagement Over Time</h2>
        <div className="bg-white shadow rounded-lg p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sampleEngagementMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('en-US', {month:'short', day:'numeric'})}/>
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" />
              <Line type="monotone" dataKey="activeUsers" stroke="#0088FE" name="Active Users (via Comm.)" />
              <Line type="monotone" dataKey="totalMessagesOpened" stroke="#00C49F" name="Total Messages Opened/Read" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Communication Effectiveness Analysis & A/B Testing (Placeholders) */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Communication Effectiveness</h2>
          {/* Placeholder: Could be a pie chart of most effective channels or message types */}
           <p className="text-sm text-gray-600 mb-2">Effectiveness based on goal completion (e.g. event sign-ups from message clicks).</p>
          <div className="h-48 flex items-center justify-center text-gray-400 border rounded-md">Placeholder for effectiveness chart (e.g., conversion rates from specific messages)</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Automated A/B Testing Results</h2>
           <p className="text-sm text-gray-600 mb-2">Compare performance of different message versions.</p>
          <div className="h-48 flex items-center justify-center text-gray-400 border rounded-md">Placeholder for A/B test results (e.g., "Version A open rate: 25% vs Version B: 35%")</div>
        </div>
      </section>
      <p className="text-xs text-gray-400 mt-8">Note: Analytics are based on sample data. Real data requires backend integration with communication services.</p>
    </div>
  );
};

export default CommunicationAnalyticsPage;
