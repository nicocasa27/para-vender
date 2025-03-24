
import { useEffect, useRef, useState } from "react";
import { addAdminRoleToUser } from "@/utils/adminUtils";
import { useToast } from "@/hooks/use-toast";

export function AdminInitializer() {
  const initialized = useRef(false);
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Only run once and prevent re-initialization
    if (initialized.current || isInitializing) return;
    
    async function initializeAdmin() {
      try {
        setIsInitializing(true);
        console.log("AdminInitializer: Starting initialization");
        
        // Add nc@vokter.es as admin on component mount
        const result = await addAdminRoleToUser("nc@vokter.es");
        
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
          toast({
            title: "Error de configuración",
            description: result.message,
            variant: "destructive",
          });
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
  }, [toast, isInitializing]);

  // This component doesn't render anything
  return null;
}
