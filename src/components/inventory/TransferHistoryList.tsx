
import { useState, useEffect } from "react";
import { Loader2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { fetchTransferHistory } from "./inventory-transfer-service";
import { TransferHistory } from "./types";

export function TransferHistoryList() {
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTransferHistory();
  }, []);

  const loadTransferHistory = async () => {
    setIsLoading(true);
    try {
      const history = await fetchTransferHistory();
      setTransferHistory(history);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de transferencias.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Cargando historial...</p>
        </div>
      ) : transferHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <Package className="h-12 w-12 mb-2" />
          <p className="text-base">No hay transferencias registradas</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Cantidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transferHistory.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>{transfer.fecha}</TableCell>
                <TableCell>{transfer.producto}</TableCell>
                <TableCell>{transfer.origen}</TableCell>
                <TableCell>{transfer.destino}</TableCell>
                <TableCell>{transfer.cantidad}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
