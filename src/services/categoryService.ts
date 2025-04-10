
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/inventory";

/**
 * Obtiene todas las categorías desde Supabase
 */
export async function fetchCategories(): Promise<Category[]> {
  console.log("Fetching categories from Supabase...");
  
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre')
    .order('nombre');
  
  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
  
  console.log("Categories fetched:", data?.length || 0);
  
  return data || [];
}
