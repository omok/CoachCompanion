import React, { useState } from 'react';
import { useLocation } from 'wouter';
import CalendarHeatmap from '@/components/calendar-heatmap';
import PlayerAttendanceTimeline from '@/components/player-attendance-timeline';
import TeamAttendanceTrendChart from '@/components/team-attendance-trend-chart';
import ComparativeAttendanceAnalysis from '@/components/comparative-attendance-analysis';
import DecliningAttendanceDetector from '@/components/declining-attendance-detector';
import LowAttendanceHighlighter from '@/components/low-attendance-highlighter';
import SeasonalVariationDetector from '@/components/seasonal-variation-detector';
import UnusualAttendancePatternFlagger from '@/components/unusual-attendance-pattern-flagger';
import AttendanceRateCalculator from '@/components/attendance-rate-calculator';
import DetailedAttendanceReportGenerator from '@/components/detailed-attendance-report-generator';
import AttendanceDataExporter from '@/components/attendance-data-exporter';
import AutomatedSummaryScheduler from '@/components/automated-summary-scheduler';
import AttendanceSkillLinker from '@/components/attendance-skill-linker';
import AttendanceImprovementVisualizer from '@/components/attendance-improvement-visualizer';
import OptimalAttendanceIdentifier from '@/components/optimal-attendance-identifier';
import MissedSessionImpactQuantifier from '@/components/missed-session-impact-quantifier';

type AnalyticsView = 'dashboard' | 'patterns' | 'playerProfile' | 'correlation' | 'forecasting' | 'reporting';

const AttendanceAnalyticsPage: React.FC = () => {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const teamId = queryParams.get('teamId');
  const [activeView, setActiveView] = useState<AnalyticsView>('dashboard');

  if (!teamId) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Attendance Analytics</h1>
        <p className="text-red-500">Error: Team ID is missing. Please access this page via a team's dashboard.</p>
      </div>
    );
  }

  const numericTeamId = parseInt(teamId, 10);

  if (isNaN(numericTeamId)) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Attendance Analytics</h1>
        <p className="text-red-500">Error: Invalid Team ID.</p>
      </div>
    );
  }

  const renderViewContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <>
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h2 className="text-xl font-semibold mb-2">Summary Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded shadow text-center"><p className="text-xs text-gray-500">Overall Att. Rate</p><p className="text-2xl font-bold">78%</p><span className="text-xs text-green-500">+2% vs last period</span></div>
                <div className="p-3 bg-white rounded shadow text-center"><p className="text-xs text-gray-500">Players with Declining Att.</p><p className="text-2xl font-bold">2</p></div>
                <div className="p-3 bg-white rounded shadow text-center"><p className="text-xs text-gray-500">Avg. Sessions/Week</p><p className="text-2xl font-bold">3.5</p></div>
                <div className="p-3 bg-white rounded shadow text-center"><p className="text-xs text-gray-500">Lowest Att. Day</p><p className="text-lg font-bold">Friday PM</p></div>
              </div>
               <div className="mt-2 text-xs text-gray-400">Placeholder for filterable time period selector for dashboard metrics.</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CalendarHeatmap teamId={numericTeamId} />
              <TeamAttendanceTrendChart teamId={numericTeamId} />
              <AttendanceRateCalculator teamId={numericTeamId} />
              <ComparativeAttendanceAnalysis teamId={numericTeamId} />
            </div>
          </>
        );
      case 'patterns':
        return (
          <>
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <h2 className="text-xl font-semibold mb-2">Pattern Insight Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-white rounded shadow"><h4 className="font-semibold text-sm text-orange-600">Low Friday PMs</h4><p className="text-xs">Friday afternoon attendance is 30% lower than average. Consider rescheduling or incentives.</p><button className="text-xs text-blue-500 mt-1">View Details</button></div>
                    <div className="p-3 bg-white rounded shadow"><h4 className="font-semibold text-sm text-red-600">Player Bravo Declining</h4><p className="text-xs">Player Bravo's attendance dropped 40% last month. Follow up recommended.</p><button className="text-xs text-blue-500 mt-1">View Profile</button></div>
                    <div className="p-3 bg-white rounded shadow"><h4 className="font-semibold text-sm text-green-600">December Dip Expected</h4><p className="text-xs">Historical data shows a 15% attendance dip in December. Plan accordingly.</p><button className="text-xs text-blue-500 mt-1">See Seasonal Data</button></div>
                </div>
                 <div className="mt-2 text-xs text-gray-400">Day/Time matrix showing attendance density (e.g. table below heatmap or dedicated view) - Placeholder. Trend lines with statistical significance - Placeholder.</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DecliningAttendanceDetector teamId={numericTeamId} />
              <LowAttendanceHighlighter teamId={numericTeamId} />
              <SeasonalVariationDetector teamId={numericTeamId} />
              <UnusualAttendancePatternFlagger teamId={numericTeamId} />
            </div>
          </>
        );
      case 'playerProfile':
        return (
          <>
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <h2 className="text-xl font-semibold mb-2">Player Profile View</h2>
                 <p className="text-xs text-gray-400">Select a player to see their detailed attendance profile, comparative metrics, concerning patterns, and streaks. (Player selection UI needed)</p>
            </div>
            <PlayerAttendanceTimeline teamId={numericTeamId} /> {/* Add player ID prop once selection is implemented */}
            {/* Placeholder for Comparative metrics, Visual indicators, Attendance streak visualization */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">Player Comparative Metrics (vs team avg): Placeholder</div>
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">Visual Indicators for Concerning Patterns: Placeholder</div>
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">Attendance Streak Visualization: Placeholder</div>
          </>
        );
      case 'correlation':
        return (
          <>
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <h2 className="text-xl font-semibold mb-2">Correlation Analysis Interface</h2>
                 <p className="text-xs text-gray-400">Analyze relationships between attendance and skill development. Regression lines and statistical significance indicators - Placeholder. Simplified visualizations for parent sharing - Placeholder.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AttendanceSkillLinker teamId={numericTeamId} />
              <AttendanceImprovementVisualizer teamId={numericTeamId} />
              <OptimalAttendanceIdentifier teamId={numericTeamId} />
              <MissedSessionImpactQuantifier teamId={numericTeamId} />
            </div>
          </>
        );
      case 'forecasting':
        return (
          <>
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <h2 className="text-xl font-semibold mb-2">Forecasting Tools</h2>
                 <p className="text-xs text-gray-400">Predictive charts, scenario modeling, schedule optimization, and capacity planning tools will be available here.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-3 bg-gray-100 rounded-lg text-sm h-48 flex items-center justify-center">Predictive Attendance Charts: Placeholder</div>
                <div className="p-3 bg-gray-100 rounded-lg text-sm h-48 flex items-center justify-center">Scenario Modeling Interface: Placeholder</div>
                <div className="p-3 bg-gray-100 rounded-lg text-sm h-48 flex items-center justify-center">Schedule Optimization Suggestions: Placeholder</div>
                <div className="p-3 bg-gray-100 rounded-lg text-sm h-48 flex items-center justify-center">Capacity Planning Calculator: Placeholder</div>
            </div>
          </>
        );
       case 'reporting':
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailedAttendanceReportGenerator teamId={numericTeamId} />
              <AttendanceDataExporter teamId={numericTeamId} />
              <AutomatedSummaryScheduler teamId={numericTeamId} />
            </div>
        );
      default:
        return <p>Select a view</p>;
    }
  };

  const TabButton: React.FC<{view: AnalyticsView, label: string}> = ({view, label}) => (
    <button
        onClick={() => setActiveView(view)}
        className={`px-4 py-2 font-medium text-sm rounded-md transition-colors
                    ${activeView === view ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
        {label}
    </button>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Attendance Analytics</h1>
        <p className="text-sm text-gray-600">Team ID: {numericTeamId}</p>
      </div>

      <div className="mb-6 flex space-x-2 border-b pb-2">
        <TabButton view="dashboard" label="Dashboard" />
        <TabButton view="patterns" label="Pattern Analysis" />
        <TabButton view="playerProfile" label="Player Profiles" />
        <TabButton view="correlation" label="Correlations" />
        <TabButton view="reporting" label="Reporting Tools" />
        <TabButton view="forecasting" label="Forecasting" />
      </div>

      <div>
        {renderViewContent()}
      </div>
    </div>
  );
};

export default AttendanceAnalyticsPage;
