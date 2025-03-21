
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
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

export const RecentSalesTable = () => {
  const [recentSales, setRecentSales] = useState<SaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchRecentSales = async () => {
      setIsLoading(true);
      try {
        // Fetch ventas from Supabase
        const { data: ventas, error: ventasError } = await supabase
          .from('ventas')
          .select(`
            id, 
            total, 
            estado, 
            created_at,
            cliente,
            almacenes(nombre)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (ventasError) {
          console.error('Error fetching ventas:', ventasError);
          return;
        }

        // Transform the data
        const salesData: SaleItem[] = await Promise.all(ventas.map(async (venta) => {
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
            console.error('Error fetching detalles_venta:', detallesError);
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

        setRecentSales(salesData);
      } catch (error) {
        console.error('Error fetching recent sales:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentSales();
  }, []);

  const totalPages = Math.ceil(recentSales.length / itemsPerPage);
  const currentPageItems = recentSales.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="transition-all duration-300 hover:shadow-elevation">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Ventas Recientes</CardTitle>
          <Button variant="outline" size="sm" disabled>
            Ver Todas
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-elevation">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Ventas Recientes</CardTitle>
        <Button variant="outline" size="sm">
          Ver Todas
        </Button>
      </CardHeader>
      <CardContent>
        {recentSales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos de ventas disponibles
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
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
                  {currentPageItems.map((sale) => (
                    <TableRow key={sale.id} className="animate-fade-in">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary">
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
                      <TableCell className="font-medium">
                        ${sale.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                              <MoreHorizontal className="h-4 w-4" />
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
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || recentSales.length === 0}
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
                disabled={page === totalPages || recentSales.length === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
