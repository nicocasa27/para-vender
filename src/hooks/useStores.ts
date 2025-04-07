
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
      // Verificar si debemos usar la tabla almacenes o sucursales
      const { data: checkSucursales, error: checkError } = await supabase
        .from("sucursales")
        .select("id")
        .limit(1);
      
      // Si existe la tabla sucursales y no hay error, usamos esa
      if (!checkError && checkSucursales) {
        console.log("Usando tabla sucursales para las tiendas/almacenes");
        const { data, error } = await supabase
          .from("sucursales")
          .select("id, nombre")
          .order("nombre");

        if (error) {
          console.error("Error al cargar sucursales:", error);
          toast.error("Error al cargar sucursales", {
            description: error.message,
          });
          return [];
        }

        return data || [];
      } else {
        // Fallback a la tabla almacenes (para compatibilidad)
        console.log("Usando tabla almacenes para las tiendas");
        const { data, error } = await supabase
          .from("almacenes")
          .select("id, nombre")
          .order("nombre");

        if (error) {
          console.error("Error al cargar almacenes:", error);
          toast.error("Error al cargar sucursales", {
            description: error.message,
          });
          return [];
        }

        return data || [];
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
  };
}
