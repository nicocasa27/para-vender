
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Product } from "@/types/inventory";
import { formatQuantityWithUnit } from "@/utils/inventory/formatters";
import { useAuth } from "@/contexts/auth";

interface ProductDetailDialogProps {
  productId: string | null;
  products: Product[];
  getCategoryName: (categoryId?: string) => string;
  getProductStoreName: (product: Product) => string;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export function ProductDetailDialog({
  productId,
  products,
  getCategoryName,
  getProductStoreName,
  onClose,
  onEdit
}: ProductDetailDialogProps) {
  const { hasRole } = useAuth();
  const canViewPurchasePrice = !hasRole('sales') || hasRole('admin') || hasRole('manager');

  const getProductDetail = () => {
    if (!productId) return null;
    return products.find(p => p.id === productId) || null;
  };

  const product = getProductDetail();

  if (!product) {
    return null;
  }

  return (
    <Dialog 
      open={!!productId} 
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product.nombre}</DialogTitle>
          <DialogDescription>
            Información detallada del producto
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Información General</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 text-sm">
                <span className="text-muted-foreground">Categoría:</span>
                <span>{getCategoryName(product.categoria_id)}</span>
              </div>
              <div className="grid grid-cols-2 text-sm">
                <span className="text-muted-foreground">Unidad:</span>
                <span>{product.unidad || "Unidad"}</span>
              </div>
              {product.color && (
                <div className="grid grid-cols-2 text-sm">
                  <span className="text-muted-foreground">Color:</span>
                  <span>{product.color}</span>
                </div>
              )}
              {product.talla && (
                <div className="grid grid-cols-2 text-sm">
                  <span className="text-muted-foreground">Talla:</span>
                  <span>{product.talla}</span>
                </div>
              )}
              {canViewPurchasePrice && (
                <div className="grid grid-cols-2 text-sm">
                  <span className="text-muted-foreground">Precio compra:</span>
                  <span>${product.precio_compra?.toFixed(2)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 text-sm">
                <span className="text-muted-foreground">Precio venta:</span>
                <span>${product.precio_venta.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Inventario</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 text-sm">
                <span className="text-muted-foreground">Stock total:</span>
                <span>{formatQuantityWithUnit(product.stock_total, product.unidad)}</span>
              </div>
              <div className="grid grid-cols-2 text-sm">
                <span className="text-muted-foreground">Stock mínimo:</span>
                <span>{formatQuantityWithUnit(product.stock_minimo, product.unidad)}</span>
              </div>
              <div className="grid grid-cols-2 text-sm">
                <span className="text-muted-foreground">Stock máximo:</span>
                <span>{formatQuantityWithUnit(product.stock_maximo, product.unidad)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2">Inventario por Sucursal</h4>
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {product.stock_by_store && Object.keys(product.stock_by_store).length > 0 ? (
                Object.entries(product.stock_by_store).map(([storeId, quantity]) => (
                  <div key={storeId} className="grid grid-cols-2 text-sm">
                    <span className="text-muted-foreground">
                      {product.store_names?.[storeId] || storeId}:
                    </span>
                    <span>{formatQuantityWithUnit(quantity, product.unidad)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No hay inventario disponible en ninguna sucursal.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cerrar
          </Button>
          <Button onClick={() => onEdit(product)}>
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
