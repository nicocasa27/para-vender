
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

interface Movement {
  id: string;
  tipo: string;
  cantidad: number;
  created_at: string;
  origen?: {
    nombre: string;
  };
  destino?: {
    nombre: string;
  };
  notas?: string;
}

interface ProductMovementHistoryProps {
  productId: string;
}

export const ProductMovementHistory: React.FC<ProductMovementHistoryProps> = ({ productId }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");

  useEffect(() => {
    if (productId) {
      loadMovementHistory();
      loadProductName();
    }
  }, [productId]);

  const loadMovementHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('movimientos')
        .select(`
          id,
          tipo,
          cantidad,
          created_at,
          notas,
          origen:almacenes!movimientos_almacen_origen_id_fkey(nombre),
          destino:almacenes!movimientos_almacen_destino_id_fkey(nombre)
        `)
        .eq('producto_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error al cargar el historial de movimientos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductName = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('nombre')
        .eq('id', productId)
        .single();

      if (error) throw error;
      if (data) setProductName(data.nombre);
    } catch (error) {
      console.error("Error al cargar el nombre del producto:", error);
    }
  };

  const renderMovementType = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'entrada':
        return <span className="text-green-600">Entrada</span>;
      case 'salida':
        return <span className="text-red-600">Salida</span>;
      case 'transferencia':
        return <span className="text-blue-600">Transferencia</span>;
      default:
        return <span>{tipo}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-4">{productName}</h3>
      
      {movements.length === 0 ? (
        <p className="text-center text-muted-foreground p-4">
          No hay movimientos registrados para este producto
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell>{renderMovementType(movement.tipo)}</TableCell>
                <TableCell>{movement.cantidad}</TableCell>
                <TableCell>
                  {movement.tipo.toLowerCase() === 'transferencia' ? (
                    <div className="flex items-center gap-1">
                      <span>{movement.origen?.nombre}</span>
                      <ArrowRight className="h-3 w-3 mx-1" />
                      <span>{movement.destino?.nombre}</span>
                    </div>
                  ) : movement.tipo.toLowerCase() === 'entrada' ? (
                    <span>{movement.destino?.nombre} {movement.notas && `(${movement.notas})`}</span>
                  ) : movement.tipo.toLowerCase() === 'salida' ? (
                    <span>{movement.origen?.nombre} {movement.notas && `(${movement.notas})`}</span>
                  ) : (
                    movement.notas
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
