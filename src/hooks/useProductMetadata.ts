
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category } from "@/types/inventory";

// Esta función obtiene categorías y unidades para formularios de productos
export function useProductMetadata() {
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log("Fetching categories...");
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre")
        .order("nombre");

      if (error) {
        console.error("Error fetching categories:", error);
        toast.error("Error al cargar categorías", {
          description: error.message,
        });
        return [];
      }

      console.log("Categories loaded:", data?.length || 0);
      return data || [];
    }
  });

  const { 
    data: units = [], 
    isLoading: unitsLoading,
    error: unitsError 
  } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      console.log("Fetching units...");
      const { data, error } = await supabase
        .from("unidades")
        .select("id, nombre, abreviatura")
        .order("nombre");

      if (error) {
        console.error("Error fetching units:", error);
        toast.error("Error al cargar unidades", {
          description: error.message,
        });
        return [];
      }

      console.log("Units loaded:", data?.length || 0);
      return data || [];
    }
  });

  const isLoading = categoriesLoading || unitsLoading;
  const error = categoriesError || unitsError;

  return {
    categories,
    units,
    isLoading,
    error,
    hasMetadata: categories.length > 0 && units.length > 0
  };
}
