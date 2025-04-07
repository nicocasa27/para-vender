
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
        
        // Si no hay categorías, intentar crear una por defecto
        try {
          const { data: defaultData, error: defaultError } = await supabase
            .from("categorias")
            .insert([{ nombre: "General" }])
            .select()
            .maybeSingle();
            
          if (!defaultError && defaultData) {
            toast.success("Se creó la categoría General por defecto");
            return [defaultData];
          }
        } catch (e) {
          console.error("Error creating default category:", e);
        }
        
        return [];
      }

      console.log("Categories loaded:", data?.length || 0);
      
      // Si no hay categorías, crear una categoría por defecto
      if (data.length === 0) {
        try {
          const { data: defaultData, error: defaultError } = await supabase
            .from("categorias")
            .insert([{ nombre: "General" }])
            .select()
            .maybeSingle();
            
          if (!defaultError && defaultData) {
            toast.success("Se creó la categoría General por defecto");
            return [defaultData];
          }
        } catch (e) {
          console.error("Error creating default category:", e);
        }
      }
      
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
        
        // Si no hay unidades, intentar crear una por defecto
        try {
          const { data: defaultData, error: defaultError } = await supabase
            .from("unidades")
            .insert([{ nombre: "Unidad", abreviatura: "u" }])
            .select()
            .maybeSingle();
            
          if (!defaultError && defaultData) {
            toast.success("Se creó la unidad por defecto");
            return [defaultData];
          }
        } catch (e) {
          console.error("Error creating default unit:", e);
        }
        
        return [];
      }

      console.log("Units loaded:", data?.length || 0);
      
      // Si no hay unidades, crear una unidad por defecto
      if (data.length === 0) {
        try {
          const { data: defaultData, error: defaultError } = await supabase
            .from("unidades")
            .insert([{ nombre: "Unidad", abreviatura: "u" }])
            .select()
            .maybeSingle();
            
          if (!defaultError && defaultData) {
            toast.success("Se creó la unidad por defecto");
            return [defaultData];
          }
        } catch (e) {
          console.error("Error creating default unit:", e);
        }
      }
      
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
