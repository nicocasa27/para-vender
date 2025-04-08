
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category } from "@/types/inventory";

// Esta función obtiene categorías y unidades para formularios de productos
export function useProductMetadata() {
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log("Fetching categories...");
      try {
        const { data, error } = await supabase
          .from("categorias")
          .select("id, nombre")
          .order("nombre");

        if (error) {
          console.error("Error fetching categories:", error);
          toast.error("Error al cargar categorías", {
            description: error.message,
          });
          // Si no hay categorías, crear una por defecto
          await createDefaultCategory();
          return [];
        }

        console.log("Categories loaded:", data?.length || 0);
        
        // Si no hay categorías, crear una por defecto
        if (!data || data.length === 0) {
          const defaultCategoryId = await createDefaultCategory();
          if (defaultCategoryId) {
            // Intentar obtener la categoría recién creada
            const { data: newData } = await supabase
              .from("categorias")
              .select("id, nombre")
              .order("nombre");
            return newData || [];
          }
          return [];
        }

        return data;
      } catch (err) {
        console.error("Exception in fetching categories:", err);
        toast.error("Error inesperado al cargar categorías");
        return [];
      }
    },
    staleTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
  });

  const { 
    data: units = [], 
    isLoading: unitsLoading,
    error: unitsError,
    refetch: refetchUnits
  } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      console.log("Fetching units...");
      try {
        const { data, error } = await supabase
          .from("unidades")
          .select("id, nombre, abreviatura")
          .order("nombre");

        if (error) {
          console.error("Error fetching units:", error);
          toast.error("Error al cargar unidades", {
            description: error.message,
          });
          // Si no hay unidades, crear una por defecto
          await createDefaultUnit();
          return [];
        }

        console.log("Units loaded:", data?.length || 0);
        
        // Si no hay unidades, crear una por defecto
        if (!data || data.length === 0) {
          const defaultUnitId = await createDefaultUnit();
          if (defaultUnitId) {
            // Intentar obtener la unidad recién creada
            const { data: newData } = await supabase
              .from("unidades")
              .select("id, nombre, abreviatura")
              .order("nombre");
            return newData || [];
          }
          return [];
        }

        return data;
      } catch (err) {
        console.error("Exception in fetching units:", err);
        toast.error("Error inesperado al cargar unidades");
        return [];
      }
    },
    staleTime: 60000, // 1 minuto
    refetchOnWindowFocus: false,
  });

  // Crear una categoría por defecto si no existe ninguna
  async function createDefaultCategory() {
    console.log("Creating default category...");
    try {
      const { data, error } = await supabase
        .from("categorias")
        .insert([{ nombre: "General" }])
        .select("id");
        
      if (error) {
        console.error("Error creating default category:", error);
        toast.error("Error al crear categoría por defecto");
        return null;
      }
      
      console.log("Default category created:", data);
      toast.success("Se ha creado una categoría predeterminada");
      return data?.[0]?.id || null;
    } catch (err) {
      console.error("Exception creating default category:", err);
      toast.error("Error al crear categoría por defecto");
      return null;
    }
  }
  
  // Crear una unidad por defecto si no existe ninguna
  async function createDefaultUnit() {
    console.log("Creating default unit...");
    try {
      const { data, error } = await supabase
        .from("unidades")
        .insert([{ 
          nombre: "Unidad", 
          abreviatura: "u" 
        }])
        .select("id");
        
      if (error) {
        console.error("Error creating default unit:", error);
        toast.error("Error al crear unidad por defecto");
        return null;
      }
      
      console.log("Default unit created:", data);
      toast.success("Se ha creado una unidad predeterminada");
      return data?.[0]?.id || null;
    } catch (err) {
      console.error("Exception creating default unit:", err);
      toast.error("Error al crear unidad por defecto");
      return null;
    }
  }

  const isLoading = categoriesLoading || unitsLoading;
  const error = categoriesError || unitsError;

  // Función combinada para refrescar todos los datos
  const refetch = async () => {
    console.log("Refetching all metadata...");
    const results = await Promise.all([
      refetchCategories(),
      refetchUnits()
    ]);
    return results;
  };

  return {
    categories,
    units,
    isLoading,
    error,
    hasMetadata: categories.length > 0 && units.length > 0,
    refetch
  };
}
