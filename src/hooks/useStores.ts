
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store } from "@/types/inventory";

export function useStores() {
  const { data: stores = [], isLoading, error, refetch } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("almacenes")
          .select("id, nombre, direccion")
          .order("nombre");

        if (error) {
          console.error("Error al cargar sucursales:", error);
          toast.error("Error al cargar sucursales", {
            description: error.message,
          });
          return [];
        }

        console.log("Sucursales cargadas:", data);
        return data as Store[] || [];
      } catch (e) {
        console.error("Error en useStores:", e);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  return {
    stores,
    isLoading,
    hasStores: stores.length > 0,
    error,
    refetch
  };
}
