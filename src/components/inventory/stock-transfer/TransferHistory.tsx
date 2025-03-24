
import { useState, useEffect } from "react";
import { Loader2, Package, FileX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getRecentTransfers } from "./stock-transfer-api";
import { TransferRecord } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

export function TransferHistory() {
  const [transferRecords, setTransferRecords] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTransferHistory();
  }, []);

  const loadTransferHistory = async () => {
    setIsLoading(true);
    try {
      const history = await getRecentTransfers();
      setTransferRecords(history);
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

  const renderSkeletonRows = () => {
    return Array(3).fill(0).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="min-h-[300px]">
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
          {isLoading ? (
            renderSkeletonRows()
          ) : transferRecords.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-[250px]">
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileX className="h-12 w-12 mb-2 text-muted-foreground/60" />
                  <p className="text-base font-medium">No hay transferencias registradas</p>
                  <p className="text-sm mt-1">Utilice el formulario para registrar transferencias de stock</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            transferRecords.map((transfer) => (
              <TableRow key={transfer.id} className="animate-fade-in">
                <TableCell>{transfer.fecha}</TableCell>
                <TableCell>{transfer.producto}</TableCell>
                <TableCell>{transfer.origen}</TableCell>
                <TableCell>{transfer.destino}</TableCell>
                <TableCell>{transfer.cantidad}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
