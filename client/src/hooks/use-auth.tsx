import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  refreshUser: () => Promise<void>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true, // Refresh when window regains focus
  });

  // Log auth state changes
  useEffect(() => {
    console.log('[Auth] Auth state changed:', { user, isLoading, error });
  }, [user, isLoading, error]);

  // Force refresh user data on mount
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshUser = async () => {
    console.log('[Auth] Manually refreshing user data');
    try {
      await refetch();
      console.log('[Auth] User refresh completed:', user);
    } catch (err) {
      console.error('[Auth] User refresh failed:', err);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('[Auth] Login attempt:', { username: credentials.username });
      const res = await apiRequest("POST", "/api/login", credentials);
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.error || JSON.stringify(errorData));
        } else {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }
      
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      console.log('[Auth] Login successful:', user);
      queryClient.setQueryData(["/api/user"], user);
      // Also invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['/api/user/teams'],
      });
    },
    onError: (error: Error) => {
      console.error('[Auth] Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          throw new Error(errorData.error || JSON.stringify(errorData));
        } else {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
      }
      
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Logging out');
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      console.log('[Auth] Logout successful');
      queryClient.setQueryData(["/api/user"], null);
      // Clear all queries from cache on logout
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      console.error('[Auth] Logout failed:', error);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
