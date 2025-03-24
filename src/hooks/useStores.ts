
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

export interface Store {
  id: string;
  nombre: string;
}

export function useStores() {
  const { toast: uiToast } = useToast();
  
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
          console.error("Error fetching stores:", error);
          uiToast({
            title: "Error",
            description: "No se pudieron cargar las sucursales: " + error.message,
            variant: "destructive",
          });
          throw error;
        }
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
  });

  return { stores, isLoading, error };
}
