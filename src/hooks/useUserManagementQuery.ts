
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchUserData } from "./users/api/userDataQueries";

/**
 * Hook optimizado para gestión de usuarios que utiliza React Query
 */
export function useUserManagementQuery(user: any, hasAdminRole: boolean) {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        console.log("Iniciando consulta de usuarios...");
        
        if (!user) {
          console.log("No hay usuario autenticado");
          return [];
        }
        
        if (!hasAdminRole) {
          console.log("El usuario no tiene permisos de administrador");
          return [];
        }
        
        // Usar el servicio refactorizado para obtener los datos
        return await fetchUserData();
      } catch (error) {
        console.error("Error en useUserManagementQuery:", error);
        toast.error("Error al cargar usuarios", {
          description: "No se pudieron cargar los datos de usuario"
        });
        throw error;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 5000, // 5 segundos antes de considerar los datos obsoletos
    retry: 3,
    refetchInterval: 30000, // Refrescar automáticamente cada 30 segundos
    enabled: !!user && hasAdminRole // Solo ejecutar si el usuario está conectado y tiene rol de administrador
  });
}
