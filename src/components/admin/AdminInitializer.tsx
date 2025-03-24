
import { useEffect, useRef } from "react";
import { addAdminRoleToUser } from "@/utils/adminUtils";
import { useToast } from "@/hooks/use-toast";

export function AdminInitializer() {
  const initialized = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only run once and prevent re-initialization
    if (initialized.current) return;
    
    async function initializeAdmin() {
      try {
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
      }
    }

    initializeAdmin();
    
    // Include toast in dependencies to avoid lint warnings
  }, [toast]);

  // This component doesn't render anything
  return null;
}
