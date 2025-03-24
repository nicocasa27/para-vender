
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Store {
  id: string;
  nombre: string;
}

export function useStores() {
  const { toast } = useToast();
  
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

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las sucursales",
          variant: "destructive",
        });
        return [];
      }
    },
    staleTime: 60000, // 1 minute cache
    refetchOnWindowFocus: false,
  });

  return { stores, isLoading, error };
}
