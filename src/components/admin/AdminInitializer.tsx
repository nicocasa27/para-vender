
import { useEffect, useRef, useState } from "react";
import { addAdminRoleToUser } from "@/utils/adminUtils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

export function AdminInitializer() {
  const initialized = useRef(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    // Solo inicializar una vez y solo si hay un usuario actual
    if (loading || initialized.current || isInitializing || !user) return;
    
    // Verificar si el sistema es nuevo (sin usuarios administradores)
    async function checkAndInitializeFirstAdmin() {
      try {
        setIsInitializing(true);
        console.log("AdminInitializer: Verificando si se necesita configurar el primer administrador");
        
        // Solo ejecutar para el primer usuario o en entorno de desarrollo controlado
        const result = await addAdminRoleToUser(user.email, true);
        
        if (result.success) {
          console.log("AdminInitializer:", result.message);
          // Solo mostrar toast si se asignó un nuevo rol (no si ya tenía el rol)
          if (result.adminAdded) {
            toast.success("Administrador configurado", {
              description: result.message,
            });
          }
        } else {
          console.error("AdminInitializer: Error en la gestión de roles:", result.message);
        }
      } catch (error) {
        console.error("AdminInitializer: Error al inicializar admin:", error);
      } finally {
        initialized.current = true;
        setIsInitializing(false);
        console.log("AdminInitializer: Verificación completada");
      }
    }

    checkAndInitializeFirstAdmin();
  }, [toast, isInitializing, user, loading]);

  // Este componente no renderiza nada
  return null;
}
