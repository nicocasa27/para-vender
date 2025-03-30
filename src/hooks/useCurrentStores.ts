import { useSession } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Devuelve los IDs de sucursales (almacenes) asignadas al usuario autenticado.
 */
export function useCurrentStores() {
  const session = useSession();
  const userId = session?.user.id;

  const {
    data: storeIds = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["currentUserStores", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("almacen_id")
        .eq("user_id", userId)
        .not("almacen_id", "is", null); // sólo roles con sucursal

      if (error) throw error;

      // Devuelve una lista única de IDs
      const ids = data.map((r) => r.almacen_id);
      return [...new Set(ids)];
    },
  });

  return {
    storeIds,
    isLoading,
    error,
  };
}
