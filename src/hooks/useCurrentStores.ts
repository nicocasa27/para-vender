
import { useAuth } from "@/contexts/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Store {
  id: string;
  nombre: string;
}

/**
 * Devuelve las sucursales (almacenes) asignadas al usuario autenticado.
 */
export function useCurrentStores() {
  const { user, loading } = useAuth();
  const userId = user?.id;

  const { data: stores = [], isLoading, error } = useQuery({
    queryKey: ["currentUserStores", userId],
    enabled: !!userId && !loading,
    queryFn: async () => {
      // Primero obtenemos los IDs de almacenes del usuario
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("almacen_id")
        .eq("user_id", userId)
        .not("almacen_id", "is", null); // solo roles con sucursal

      if (rolesError) throw rolesError;

      // Extraer IDs únicos de almacenes
      const storeIds = [...new Set(userRoles.map(r => r.almacen_id))];

      if (storeIds.length === 0) {
        return [];
      }

      // Obtener detalles de los almacenes
      const { data: storesData, error: storesError } = await supabase
        .from("almacenes")
        .select("id, nombre")
        .in("id", storeIds);

      if (storesError) throw storesError;

      return storesData || [];
    }
  });

  return {
    stores,
    isLoading,
    hasStores: stores.length > 0,
    error
  };
}

//hola