import { Switch, Route, useParams } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { PlayerProvider } from "./components/player-context";
import { PlayerDetailsModal } from "./components/player-details-modal";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import { TeamSettings } from './components/team-settings';
import { TeamDetail } from './pages/team-detail';
import AttendanceAnalyticsPage from "./pages/attendance-analytics-page";
import AutomatedCommunicationPage from "./pages/automated-communication-page";
import CommunicationPreferencesPage from "./pages/communication-preferences-page";
import CommunicationAnalyticsPage from "./pages/communication-analytics-page"; // Import the new page

// Wrapper component to extract teamId from URL params
function TeamSettingsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  return <TeamSettings teamId={Number(teamId)} />;
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/teams/:teamId" component={TeamDetail} />
      <Route path="/teams/:teamId/settings" component={TeamSettingsPage} />
      <ProtectedRoute path="/attendance-analytics" component={AttendanceAnalyticsPage} />
      <ProtectedRoute path="/automated-communication" component={AutomatedCommunicationPage} />
      <ProtectedRoute path="/communication-preferences" component={CommunicationPreferencesPage} />
      <ProtectedRoute path="/communication-analytics" component={CommunicationAnalyticsPage} /> {/* Add new route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlayerProvider>
          <Router />
          <PlayerDetailsModal />
          <Toaster />
        </PlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
