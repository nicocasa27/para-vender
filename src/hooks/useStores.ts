
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";

export interface Store {
  id: string;
  nombre: string;
}

export function useStores() {
  const { toast: uiToast } = useToast();
  const { handleError } = useSupabaseQuery();
  
  const { 
    data: stores = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("almacenes")
          .select("id, nombre")
          .order("nombre");

        if (error) {
          handleError(error, "No se pudieron cargar las sucursales");
          return [];
        }
        
        // Return an empty array if no data to avoid null checks
        return data || [];
      } catch (error: any) {
        console.error("Error fetching stores:", error);
        toast.error("Error al cargar sucursales", {
          description: error.message || "No se pudieron cargar las sucursales"
        });
        return [];
      }
    },
    staleTime: 60000, // 1 minute cache
    refetchOnWindowFocus: false,
    // Prevents UI flash when data is fetched again and is the same
    placeholderData: keepPreviousData => keepPreviousData || [],
  });

  return { 
    stores, 
    isLoading, 
    error,
    hasStores: stores.length > 0 
  };
}

