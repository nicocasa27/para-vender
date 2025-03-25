
import { useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Session: Setting up auth state listener");
    setLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Session: Auth state change event:", event, "Session:", !!currentSession);
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
        } else {
          setSession(null);
          setUser(null);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("Session: User signed out, clearing session state");
          setSession(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    const initializeAuth = async () => {
      try {
        console.log("Session: Initializing, checking for existing session");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          console.log("Session: Existing session found for user:", currentSession.user.id);
          setSession(currentSession);
          setUser(currentSession.user);
        } else {
          console.log("Session: No existing session found");
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Session: Error during initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log("Session: Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    loading
  };
}
