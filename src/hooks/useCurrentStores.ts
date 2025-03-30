
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth/useAuth";

/**
 * Devuelve las sucursales (almacenes) asignadas al usuario autenticado.
 */
export function useCurrentStores() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const { data: stores = [], isLoading, error } = useQuery({
    queryKey: ["currentUserStores", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          almacen_id,
          almacenes:almacen_id(
            id,
            nombre
          )
        `)
        .eq("user_id", userId)
        .not("almacen_id", "is", null); // sólo roles con sucursal

      if (error) throw error;

      // Extract store info
      const storeData = data
        .filter(item => item.almacenes)
        .map(item => ({
          id: item.almacen_id,
          nombre: item.almacenes.nombre
        }));

      // Return unique stores
      const uniqueStores = Array.from(
        new Map(storeData.map(store => [store.id, store])).values()
      );

      return uniqueStores;
    }
  });

  return {
    stores,
    isLoading,
    hasStores: stores.length > 0,
    error
  };
}
