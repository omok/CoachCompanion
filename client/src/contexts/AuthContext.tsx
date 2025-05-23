import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/use-auth';

export interface User {
  id: number;
  username: string;
  role: string;
  name: string;
}

// Legacy AuthContext
// Note: This is now just a compatibility wrapper around the new useAuth hook
export const AuthContext = createContext<any>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// This component is now just a wrapper for backward compatibility
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Get the actual auth state from the new hook
  const auth = useAuth();
  
  // The value provided is exactly the same as in the new hook
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}; 