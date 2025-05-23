
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { repairUserSync } from "@/contexts/auth/utils/user-sync";
import { toast } from "sonner";

export function AuthRepairButton() {
  const { user } = useAuth();
  const [isRepairing, setIsRepairing] = useState(false);

  const handleRepair = async () => {
    if (!user) {
      toast.error("No hay usuario autenticado");
      return;
    }
    
    try {
      setIsRepairing(true);
      toast.info("Reparando sincronización de usuario...");
      
      const success = await repairUserSync(user.id);
      
      if (success) {
        toast.success("Usuario sincronizado correctamente");
        // Refrescar la página para cargar los datos actualizados
        window.location.reload();
      }
    } catch (error) {
      console.error("Error al reparar usuario:", error);
    } finally {
      setIsRepairing(false);
    }
  };

  if (!user) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRepair}
      disabled={isRepairing}
      className="ml-2"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
      {isRepairing ? "Reparando..." : "Reparar Usuario"}
    </Button>
  );
}
