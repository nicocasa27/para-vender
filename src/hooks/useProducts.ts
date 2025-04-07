import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Store } from './useStores';

export interface Product {
  id: string;
  name: string;
  // Añadir más propiedades según sea necesario
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener productos
        const { data: productsData, error: productsError } = await supabase
          .from("productos")
          .select(`
            id, 
            nombre,
            categorias(id, nombre),
            unidades(id, nombre, abreviatura)
          `)
          .order('nombre');

        if (productsError) {
          throw new Error(productsError.message);
        }

        // Formatear productos
        const formattedProducts = productsData.map((product: any) => ({
          id: product.id,
          name: product.nombre,
          // Mapear más datos según sea necesario
        }));

        setProducts(formattedProducts);

        // Obtener almacenes
        const { data: storesData, error: storesError } = await supabase
          .from("almacenes")  // Cambiado de "sucursales" a "almacenes"
          .select("id, nombre")
          .order('nombre');

        if (storesError) {
          throw new Error(storesError.message);
        }

        if (storesData && Array.isArray(storesData)) {
          const formattedStores: Store[] = storesData.map(store => ({
            id: store.id,
            nombre: store.nombre
          }));
          setStores(formattedStores);
        }
        
      } catch (err: any) {
        setError(err);
        toast.error("Error al cargar datos", {
          description: err.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { products, stores, isLoading, error };
}
