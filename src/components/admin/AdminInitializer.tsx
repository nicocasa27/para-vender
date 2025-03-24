
import { useEffect, useRef, useState } from "react";
import { addAdminRoleToUser } from "@/utils/adminUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function AdminInitializer() {
  const initialized = useRef(false);
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    // Skip if auth is still loading or if already initialized
    if (loading || initialized.current || isInitializing || !user) return;
    
    async function initializeAdmin() {
      try {
        setIsInitializing(true);
        console.log("AdminInitializer: Starting initialization for logged-in user");
        
        // Only check admin status for the current logged-in user
        const result = await addAdminRoleToUser(user.email);
        
        if (result.success) {
          console.log("Admin role management:", result.message);
          // Only show toast if role was newly added (not if user already had the role)
          if (!result.message.includes("ya tiene rol")) {
            toast({
              title: "Administrador configurado",
              description: result.message,
            });
          }
        } else {
          console.error("Admin role management failed:", result.message);
        }
      } catch (error) {
        console.error("Error initializing admin:", error);
      } finally {
        initialized.current = true;
        setIsInitializing(false);
        console.log("AdminInitializer: Initialization complete");
      }
    }

    initializeAdmin();
  }, [toast, isInitializing, user, loading]);

  // This component doesn't render anything
  return null;
}
