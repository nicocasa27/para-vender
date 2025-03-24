
import { useEffect, useState } from "react";
import { addAdminRoleToUser } from "@/utils/adminUtils";
import { useToast } from "@/hooks/use-toast";

export function AdminInitializer() {
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialized) {
      // Add nc@vokter.es as admin on component mount
      addAdminRoleToUser("nc@vokter.es").then(result => {
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
        setInitialized(true);
      });
    }
  }, [initialized, toast]);

  // This component doesn't render anything
  return null;
}
