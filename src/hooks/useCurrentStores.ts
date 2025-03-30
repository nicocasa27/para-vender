
import { useAuth } from "@/contexts/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentStores() {
  const { user } = useAuth();
  const userId = user?.id;
  
  const fetchStores = async () => {
    if (!userId) return [];
    
    // Obtener almacenes asignados al usuario
    const { data, error } = await supabase
      .from("user_roles")
      .select("almacen_id, almacenes(id, nombre)")
      .eq("user_id", userId)
      .not("almacen_id", "is", null);
    
    if (error) throw new Error(error.message);
    
    return data.map(item => ({
      id: item.almacen_id,
      nombre: item.almacenes?.nombre || "Sin nombre"
    })) || [];
  };

  const { data: stores = [], isLoading, error } = useQuery({
    queryKey: ["current-stores", userId],
    queryFn: fetchStores,
    enabled: !!userId,
  });

  return {
    stores,
    isLoading,
    hasStores: stores.length > 0,
    error,
  };
}
