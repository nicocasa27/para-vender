import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, UserRoleWithStore } from "@/types/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRoles: UserRoleWithStore[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole, storeId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleWithStore[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Memoize fetchUserRoles to prevent unnecessary recreations
  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      console.log("Fetching roles for user:", userId);
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          almacen_id,
          almacenes:almacen_id(nombre),
          created_at
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      console.log("Fetched roles:", data);
      const rolesWithStoreNames = data.map(role => ({
        ...role,
        almacen_nombre: role.almacenes?.nombre || null
      }));

      setUserRoles(rolesWithStoreNames);
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state change:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchUserRoles(currentSession.user.id);
        } else {
          setUserRoles([]);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        await fetchUserRoles(currentSession.user.id);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserRoles]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Successful login
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "Hubo un problema al iniciar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Registro exitoso",
        description: "Su cuenta ha sido creada",
      });
      
      // Note: User needs to be assigned a role by an admin
    } catch (error: any) {
      toast({
        title: "Error al registrarse",
        description: error.message || "Hubo un problema al crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Hubo un problema al cerrar sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Memoize hasRole to prevent unnecessary recalculations
  const hasRole = useCallback((role: UserRole, storeId?: string): boolean => {
    console.log("Checking role:", role, "for store:", storeId);
    console.log("User roles:", userRoles);
    
    // Admin can do anything
    if (userRoles.some(r => r.role === 'admin')) {
      console.log("User is admin, granting access");
      return true;
    }
    
    // Manager can do anything except admin-specific tasks
    if (role !== 'admin' && userRoles.some(r => r.role === 'manager')) {
      console.log("User is manager, granting access to non-admin role");
      return true;
    }
    
    // For store-specific roles like sales
    if (storeId && userRoles.some(r => 
      r.role === role && r.almacen_id === storeId
    )) {
      console.log("User has store-specific role, granting access");
      return true;
    }
    
    // For general roles without store specificity (like viewer)
    if (!storeId && userRoles.some(r => r.role === role)) {
      console.log("User has general role, granting access");
      return true;
    }
    
    console.log("User does not have required role, denying access");
    return false;
  }, [userRoles]);

  // Memoize context value to prevent unnecessary renders
  const value = useMemo(() => ({
    session,
    user,
    userRoles,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
  }), [session, user, userRoles, loading, hasRole]);

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
