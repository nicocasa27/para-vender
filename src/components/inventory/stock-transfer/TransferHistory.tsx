
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowRight, RefreshCw } from "lucide-react";

interface TransferRecord {
  id: string;
  created_at: string;
  cantidad: number;
  producto: {
    nombre: string;
  };
  almacen_origen: {
    nombre: string;
  };
  almacen_destino: {
    nombre: string;
  };
}

export function TransferHistory() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('movimientos')
        .select(`
          id,
          created_at,
          cantidad,
          producto:producto_id(nombre),
          almacen_origen:almacen_origen_id(nombre),
          almacen_destino:almacen_destino_id(nombre)
        `)
        .eq('tipo', 'transferencia')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error("Error al cargar transferencias:", error);
    } finally {
      setLoading(false);
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">Últimas transferencias</h3>
        <Button variant="outline" size="sm" onClick={loadTransfers}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Actualizar
        </Button>
      </div>
      
      {transfers.length === 0 ? (
        <div className="text-center p-8 border rounded bg-muted/20">
          <p className="text-muted-foreground">No hay transferencias recientes</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Transferencia</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(transfer.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{transfer.producto.nombre}</TableCell>
                  <TableCell>
                    <div className="flex flex-col xs:flex-row items-start xs:items-center text-sm">
                      <span className="font-medium">{transfer.almacen_origen.nombre}</span>
                      <ArrowRight className="h-3 w-3 mx-1 hidden xs:block" />
                      <span className="font-medium">{transfer.almacen_destino.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{transfer.cantidad}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
