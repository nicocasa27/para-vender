import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Store {
  id: string;
  nombre: string;
}

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from("almacenes")  // Cambiado de "sucursales" a "almacenes"
          .select("id, nombre")
          .order('nombre');

        if (error) {
          throw new Error(error.message);
        }

        // Si no hay almacenes, crear uno por defecto
        if (!data || data.length === 0) {
          const { data: defaultStore, error: createError } = await supabase
            .from("almacenes")  // Cambiado de "sucursales" a "almacenes"
            .insert([{ nombre: "Principal" }])
            .select("id, nombre")
            .single();

          if (createError) {
            throw new Error(createError.message);
          }

          setStores(defaultStore ? [defaultStore] : []);
        } else {
          setStores(data);
        }
        
      } catch (err: any) {
        setError(err);
        toast.error("Error al cargar sucursales", {
          description: err.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  return { stores, isLoading, error };
}
