
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
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, RefreshCw, Warehouse } from "lucide-react";
import { TransferRecord } from "./types";

export function TransferHistory() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      // Get the transfers
      const { data: transfersData, error: transfersError } = await supabase
        .from('movimientos')
        .select(`
          id,
          created_at,
          cantidad,
          notas,
          producto_id,
          almacen_origen_id,
          almacen_destino_id
        `)
        .eq('tipo', 'transferencia')
        .order('created_at', { ascending: false })
        .limit(10);

      if (transfersError) throw transfersError;
      
      // Get product names
      const productIds = transfersData.map(t => t.producto_id).filter(Boolean);
      const { data: productsData, error: productsError } = await supabase
        .from('productos')
        .select('id, nombre')
        .in('id', productIds);
        
      if (productsError) {
        console.error("Error fetching product details:", productsError);
      }
      
      // Get store names
      const storeIds = [
        ...transfersData.map(t => t.almacen_origen_id).filter(Boolean),
        ...transfersData.map(t => t.almacen_destino_id).filter(Boolean)
      ];
      
      const { data: storesData, error: storesError } = await supabase
        .from('almacenes')
        .select('id, nombre')
        .in('id', storeIds);
        
      if (storesError) {
        console.error("Error fetching store details:", storesError);
      }
      
      // Create maps for easy lookup
      const productMap = new Map();
      if (productsData) {
        productsData.forEach(p => productMap.set(p.id, p.nombre));
      }
      
      const storeMap = new Map();
      if (storesData) {
        storesData.forEach(s => storeMap.set(s.id, s.nombre));
      }
      
      // Format transfer records
      const formattedTransfers: TransferRecord[] = (transfersData || []).map((item: any) => ({
        id: item.id,
        fecha: item.created_at ? format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm', { locale: es }) : "Fecha desconocida",
        origen: storeMap.get(item.almacen_origen_id) || "N/A",
        destino: storeMap.get(item.almacen_destino_id) || "N/A",
        producto: productMap.get(item.producto_id) || "N/A",
        cantidad: Number(item.cantidad),
        notas: item.notas
      }));
      
      setTransfers(formattedTransfers);
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
                    {transfer.fecha}
                  </TableCell>
                  <TableCell>{transfer.producto}</TableCell>
                  <TableCell>
                    <div className="flex flex-col xs:flex-row items-start xs:items-center text-sm">
                      <span className="font-medium">{transfer.origen}</span>
                      <ArrowRight className="h-3 w-3 mx-1 hidden xs:block" />
                      <span className="font-medium">{transfer.destino}</span>
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
