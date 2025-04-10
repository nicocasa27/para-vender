
import { supabase } from "@/integrations/supabase/client";
import { Store } from "@/types/inventory";

/**
 * Obtiene todas las tiendas/almacenes desde Supabase
 */
export async function fetchStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('almacenes')
    .select('id, nombre');
  
  if (error) throw error;
  
  return data || [];
}
