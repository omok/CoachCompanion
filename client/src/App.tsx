import { Switch, Route } from "wouter";
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

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
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
