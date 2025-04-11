
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { toast } from "sonner";

type SaleItem = {
  id: string;
  customer: string;
  customerInitial: string;
  product: string;
  date: string;
  amount: number;
  status: string;
  store: string;
};

interface RecentSalesTableProps {
  storeIds?: string[];
}

export const RecentSalesTable = ({ storeIds = [] }: RecentSalesTableProps) => {
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 8; // Incrementado para mostrar más elementos
  const { handleError } = useSupabaseQuery();

  const fetchRecentSales = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching recent sales with store IDs:", storeIds);
      
      // Fetch ventas from Supabase con límite mayor para paginación
      let query = supabase
        .from('ventas')
        .select(`
          id, 
          total, 
          estado, 
          created_at,
          cliente,
          almacenes(nombre),
          almacen_id
        `)
        .order('created_at', { ascending: false })
        .limit(30); // Incrementado para tener más datos disponibles para paginación
      
      // Apply store filter if storeIds are provided
      if (storeIds.length > 0) {
        query = query.in('almacen_id', storeIds);
      }
        
      const { data: ventas, error: ventasError } = await query;

      if (ventasError) {
        handleError(ventasError, "Error al cargar ventas recientes");
        return;
      }

      console.log("Ventas fetched:", ventas?.length || 0);

      if (!ventas || ventas.length === 0) {
        setRecentSales([]);
        setIsLoading(false);
        return;
      }

      // Transform the data
      const salesData = await Promise.all(ventas.map(async (venta) => {
        // Get a product from this sale
        const { data: detalles, error: detallesError } = await supabase
          .from('detalles_venta')
          .select(`
            producto_id,
            productos(nombre)
          `)
          .eq('venta_id', venta.id)
          .limit(1);

        if (detallesError) {
          console.error("Error al cargar detalles:", detallesError);
        }

        const productName = detalles && detalles.length > 0 && detalles[0].productos
          ? (detalles[0].productos as any).nombre
          : 'Producto desconocido';

        // Generate customer initials or use existing if cliente is provided
        const customerName = venta.cliente || 'Cliente Anónimo';
        const initials = customerName
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);

        return {
          id: venta.id,
          customer: customerName,
          customerInitial: initials,
          product: productName,
          date: venta.created_at,
          amount: venta.total,
          status: venta.estado,
          store: venta.almacenes ? (venta.almacenes as any).nombre : 'Desconocida',
        };
      }));

      console.log("Sales data transformed:", salesData.length);
      setRecentSales(salesData);
    } catch (error: any) {
      console.error("Error fetchRecentSales:", error);
      handleError(error, "Error al cargar ventas recientes");
      toast.error("No se pudieron cargar las ventas recientes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentSales();
  }, [storeIds]); // Re-fetch when storeIds change

  const totalPages = Math.ceil(recentSales.length / itemsPerPage);
  const currentPageItems = recentSales.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleRefresh = () => {
    fetchRecentSales();
    toast.success("Ventas recientes actualizadas");
  };

  const renderSkeletonRows = () => {
    return Array(itemsPerPage).fill(0).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col space-y-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        </TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-9 w-9 ml-auto rounded-full" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-medium">Ventas Recientes</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            Ver Todas
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-4">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                renderSkeletonRows()
              ) : recentSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        ></path>
                      </svg>
                      <p className="text-lg font-medium">No hay ventas recientes</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Las ventas realizadas aparecerán aquí
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentPageItems.map((sale) => (
                  <TableRow key={sale.id} className="animate-fade-in">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-base">
                            {sale.customerInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{sale.customer}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{sale.product}</span>
                        <span className="text-xs text-muted-foreground">
                          {sale.store}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(sale.date)}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-lg text-primary">
                        ${sale.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sale.status === "completada" ? "default" : "secondary"
                        }
                      >
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                            <span className="sr-only">Acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                          <DropdownMenuItem>Imprimir recibo</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoading && recentSales.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4 mt-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground mx-2">
              Página {page} de {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
