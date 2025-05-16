
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { safeAccess } from "@/utils/safe-access";

interface ProductMovementHistoryProps {
  productId: string;
}

interface Movement {
  id: string;
  tipo: string;
  cantidad: number;
  created_at: string;
  notas: string | null;
  almacen_origen_id: string | null;
  almacen_destino_id: string | null;
  almacen_origen?: { nombre: string | null } | null;
  almacen_destino?: { nombre: string | null } | null;
}

export function ProductMovementHistory({ productId }: ProductMovementHistoryProps) {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    if (productId) {
      loadMovements();
    }
  }, [productId]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      // Fetch movements with join for almacen names
      const { data, error } = await supabase
        .from('movimientos')
        .select(`
          id,
          tipo,
          cantidad,
          created_at,
          notas,
          almacen_origen_id,
          almacen_destino_id,
          almacen_origen:almacenes!almacen_origen_id(nombre),
          almacen_destino:almacenes!almacen_destino_id(nombre)
        `)
        .eq('producto_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Safely cast the data with default properties when needed
      const safeMovements = (data || []).map((item: any) => ({
        id: item.id,
        tipo: item.tipo,
        cantidad: item.cantidad,
        created_at: item.created_at,
        notas: item.notas,
        almacen_origen_id: item.almacen_origen_id,
        almacen_destino_id: item.almacen_destino_id,
        almacen_origen: {
          nombre: safeAccess(item.almacen_origen, 'nombre', 'Desconocido')
        },
        almacen_destino: {
          nombre: safeAccess(item.almacen_destino, 'nombre', 'Desconocido')
        }
      }));
      
      setMovements(safeMovements);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No hay movimientos registrados para este producto.
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {movements.map((movement) => (
        <div key={movement.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-semibold">
                {movement.tipo === 'entrada' ? 'Entrada' : 
                 movement.tipo === 'salida' ? 'Salida' : 
                 movement.tipo === 'transferencia' ? 'Transferencia' : 
                 movement.tipo}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">
                {formatDate(movement.created_at)}
              </span>
            </div>
            <span className={`text-sm font-medium ${
              movement.tipo === 'entrada' ? 'text-green-600' : 
              movement.tipo === 'salida' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {movement.tipo === 'entrada' ? '+' : 
               movement.tipo === 'salida' ? '-' : '↔'} {movement.cantidad}
            </span>
          </div>
          
          <div className="mt-2 text-sm">
            {movement.tipo === 'transferencia' ? (
              <>
                <div>De: {movement.almacen_origen?.nombre || 'Desconocido'}</div>
                <div>A: {movement.almacen_destino?.nombre || 'Desconocido'}</div>
              </>
            ) : movement.tipo === 'entrada' ? (
              <div>A: {movement.almacen_destino?.nombre || 'Desconocido'}</div>
            ) : (
              <div>De: {movement.almacen_origen?.nombre || 'Desconocido'}</div>
            )}
          </div>
          
          {movement.notas && (
            <div className="mt-2 text-sm text-muted-foreground">
              {movement.notas}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
