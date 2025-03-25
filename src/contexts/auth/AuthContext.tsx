
import React, { createContext, useContext, useMemo } from "react";
import { useAuthProvider } from "./use-auth-hook";
import { AuthContextType } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const auth = useAuthProvider();
  
  // Memoize context value to prevent unnecessary renders
  const value = useMemo(() => auth, [
    auth.session, 
    auth.user, 
    auth.userRoles, 
    auth.loading, 
    auth.hasRole
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
