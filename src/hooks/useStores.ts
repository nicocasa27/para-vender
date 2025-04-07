import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Store {
  id: string;
  nombre: string;
}

export function useStores() {
  const { data: stores = [], isLoading, error } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("almacenes")
        .select("id, nombre")
        .order("nombre");

      if (error) {
        toast.error("Error al cargar sucursales", {
          description: error.message,
        });
        return [];
      }

      return data || [];
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  return {
    stores,
    isLoading,
    hasStores: stores.length > 0,
    error,
  };
}
