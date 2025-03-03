import { Switch, Route, useParams } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider as NewAuthProvider } from "./hooks/use-auth";
import { AuthProvider as LegacyAuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./lib/protected-route";
import { PlayerProvider } from "./components/player-context";
import { PlayerDetailsModal } from "./components/player-details-modal";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import { TeamSettings } from './components/team-settings';
import { TeamDetail } from './pages/team-detail';

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NewAuthProvider>
        <LegacyAuthProvider>
          <PlayerProvider>
            <Router />
            <PlayerDetailsModal />
            <Toaster />
          </PlayerProvider>
        </LegacyAuthProvider>
      </NewAuthProvider>
    </QueryClientProvider>
  );
}

// Display the original route for now to see what's implemented
console.log("Team Settings route:", "/teams/:teamId/settings");

export default App;
