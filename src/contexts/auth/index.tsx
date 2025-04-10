
import React, { createContext, useContext } from "react";
import { useAuthProvider } from "./use-auth-hook";
import { AuthContextType } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const auth = useAuthProvider();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  // Verificar si el usuario está autenticado pero no tiene roles asignados
  if (context.user && context.userRoles.length === 0 && !context.rolesLoading) {
    console.warn("User is authenticated but has no roles assigned");
  }
  
  return context;
};
