import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentStores() {
  const fetchStores = async () => {
    const { data, error } = await supabase.from("almacenes").select("id, nombre");

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  };

  const { data: stores = [], isLoading, isError } = useQuery({
    queryKey: ["current-stores"],
    queryFn: fetchStores,
  });

  return {
    stores,
    isLoading,
    hasStores: stores.length > 0,
    error: isError,
  };
}
