
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/utils";

interface ProductHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}

export function ProductHistorySheet({
  isOpen,
  onOpenChange,
  productId
}: ProductHistorySheetProps) {
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [productName, setProductName] = useState("");

  useEffect(() => {
    if (isOpen && productId) {
      loadProductHistory();
    }
  }, [isOpen, productId]);

  const loadProductHistory = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      // Obtener nombre del producto
      const { data: productData } = await supabase
        .from('productos')
        .select('nombre')
        .eq('id', productId)
        .single();

      if (productData) {
        setProductName(productData.nombre);
      }

      // Obtener movimientos
      const { data: movementsData, error } = await supabase
        .from('movimientos')
        .select(`
          id,
          tipo,
          cantidad,
          created_at,
          notas,
          producto_id,
          almacen_origen_id,
          almacen_destino_id,
          almacenes!almacen_origen_id(nombre),
          almacenes!almacen_destino_id(nombre)
        `)
        .eq('producto_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMovements(movementsData || []);
    } catch (error) {
      console.error('Error loading product history:', error);
    } finally {
      setLoading(false);
    }
  };

  function formatDate(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Historial de Movimientos</SheetTitle>
          <SheetDescription>
            {productName ? `Movimientos del producto: ${productName}` : "Seleccione un producto para ver su historial"}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[500px] mt-6">
            {movements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay movimientos registrados para este producto.
              </p>
            ) : (
              <div className="space-y-4">
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
                    
                    {movement.almacenes && (
                      <div className="mt-2 text-sm">
                        {movement.tipo === 'transferencia' ? (
                          <>
                            <div>De: {movement.almacenes.nombre || 'Desconocido'}</div>
                            <div>A: {movement.almacenes.nombre || 'Desconocido'}</div>
                          </>
                        ) : movement.tipo === 'entrada' ? (
                          <div>A: {movement.almacenes.nombre || 'Desconocido'}</div>
                        ) : (
                          <div>De: {movement.almacenes.nombre || 'Desconocido'}</div>
                        )}
                      </div>
                    )}
                    
                    {movement.notas && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {movement.notas}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
