
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface Props {
  storeId: string | null;
}

interface LowStockProduct {
  id: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
  status: 'warning' | 'critical';
}

export function LowStockTable({ storeId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LowStockProduct[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // For demonstration, we're creating sample data
        // In a real app, this would be a call to your Supabase query
        
        // Sample low stock products data
        const sampleData: LowStockProduct[] = [
          { id: "1", nombre: "Leche entera 1L", stock: 3, stock_minimo: 10, status: 'critical' },
          { id: "2", nombre: "Arroz premium 1kg", stock: 5, stock_minimo: 15, status: 'critical' },
          { id: "3", nombre: "Aceite vegetal 1L", stock: 8, stock_minimo: 15, status: 'warning' },
          { id: "4", nombre: "Harina de trigo 1kg", stock: 10, stock_minimo: 20, status: 'warning' },
          { id: "5", nombre: "Café molido 500g", stock: 4, stock_minimo: 10, status: 'critical' },
          { id: "6", nombre: "Papel higiénico pack 4", stock: 7, stock_minimo: 12, status: 'warning' },
          { id: "7", nombre: "Azúcar blanca 1kg", stock: 6, stock_minimo: 15, status: 'warning' },
          { id: "8", nombre: "Detergente líquido 1L", stock: 2, stock_minimo: 8, status: 'critical' },
        ];
        
        setData(sampleData);
      } catch (error) {
        console.error("Error fetching low stock products:", error);
        toast.error("Error al cargar productos con stock crítico");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [storeId]);
  
  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Estado</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Stock Actual</TableHead>
            <TableHead className="text-right">Stock Mínimo</TableHead>
            <TableHead className="text-right">Diferencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                {product.status === 'critical' ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
              </TableCell>
              <TableCell className="font-medium">{product.nombre}</TableCell>
              <TableCell className="text-right">{product.stock}</TableCell>
              <TableCell className="text-right">{product.stock_minimo}</TableCell>
              <TableCell className="text-right font-medium text-destructive">
                {product.stock - product.stock_minimo}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
