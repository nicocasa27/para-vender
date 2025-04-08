
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Category } from "@/types/inventory";
import { PostgrestError } from "@supabase/supabase-js";

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
          
          // Verificar si es un error de permisos
          if (isPermissionError(error)) {
            toast.error("Error de permisos", {
              description: "No tienes permisos para acceder a las categorías",
            });
            return [];
          }
          
          toast.error("Error al cargar categorías", {
            description: error.message,
          });
          
          // Solo intentar crear categoría por defecto si no es un error de permisos
          if (!isPermissionError(error)) {
            await createDefaultCategory();
          }
          return [];
        }

        console.log("Categories loaded:", data?.length || 0);
        
        // Si no hay categorías, crear una por defecto solo si tenemos permisos
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
          
          // Verificar si es un error de permisos
          if (isPermissionError(error)) {
            toast.error("Error de permisos", {
              description: "No tienes permisos para acceder a las unidades",
            });
            return [];
          }
          
          toast.error("Error al cargar unidades", {
            description: error.message,
          });
          
          // Solo intentar crear unidad por defecto si no es un error de permisos
          if (!isPermissionError(error)) {
            await createDefaultUnit();
          }
          return [];
        }

        console.log("Units loaded:", data?.length || 0);
        
        // Si no hay unidades, crear una por defecto solo si tenemos permisos
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

  // Función para determinar si un error es de permisos
  function isPermissionError(error: PostgrestError): boolean {
    // Códigos de error relacionados con permisos en PostgreSQL/Supabase
    return (
      error.code === '42501' || // Insufficient privilege
      error.code === 'PGRST116' || // No permission to view rows
      error.message.toLowerCase().includes('permission') ||
      error.message.toLowerCase().includes('privilege') ||
      error.code === '403' || 
      error.status === 403
    );
  }

  // Crear una categoría por defecto si no existe ninguna
  async function createDefaultCategory() {
    console.log("Creating default category...");
    try {
      // Verificar primero si tenemos permisos para insertar
      const { error: permCheckError } = await supabase
        .from("categorias")
        .select("id")
        .limit(1);
      
      if (permCheckError && isPermissionError(permCheckError)) {
        console.error("No permission to insert categories:", permCheckError);
        toast.error("Sin permisos para crear categoría", {
          description: "No tienes permisos para crear categorías en el sistema"
        });
        return null;
      }

      const { data, error } = await supabase
        .from("categorias")
        .insert([{ nombre: "General" }])
        .select("id");
        
      if (error) {
        console.error("Error creating default category:", error);
        
        if (isPermissionError(error)) {
          toast.error("Sin permisos para crear categoría", {
            description: "No tienes permisos suficientes"
          });
        } else {
          toast.error("Error al crear categoría por defecto", {
            description: error.message
          });
        }
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
      // Verificar primero si tenemos permisos para insertar
      const { error: permCheckError } = await supabase
        .from("unidades")
        .select("id")
        .limit(1);
      
      if (permCheckError && isPermissionError(permCheckError)) {
        console.error("No permission to insert units:", permCheckError);
        toast.error("Sin permisos para crear unidad", {
          description: "No tienes permisos para crear unidades en el sistema"
        });
        return null;
      }

      const { data, error } = await supabase
        .from("unidades")
        .insert([{ 
          nombre: "Unidad", 
          abreviatura: "u" 
        }])
        .select("id");
        
      if (error) {
        console.error("Error creating default unit:", error);
        
        if (isPermissionError(error)) {
          toast.error("Sin permisos para crear unidad", {
            description: "No tienes permisos suficientes"
          });
        } else {
          toast.error("Error al crear unidad por defecto", {
            description: error.message
          });
        }
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

  // Determinar si hay un error de permisos
  const hasPermissionError = error ? isPermissionError(error as PostgrestError) : false;

  return {
    categories,
    units,
    isLoading,
    error,
    hasMetadata: categories.length > 0 && units.length > 0,
    hasPermissionError,
    refetch
  };
}
