import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading, refreshUser } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user found, redirecting to auth page');
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  console.log('[ProtectedRoute] User authenticated, rendering protected component');
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
