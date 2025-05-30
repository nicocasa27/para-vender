
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Product } from "@/types/inventory";
import { formatQuantityWithUnit } from "@/utils/inventory/formatters";

interface ProductTableBodyProps {
  products: Product[];
  onViewHistory: (productId: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  selectedStore?: string;
  canViewPurchasePrice?: boolean; // Prop to control price visibility
}

export function ProductTableBody({
  products,
  onViewHistory,
  onEditProduct,
  onDeleteProduct,
  selectedStore,
  canViewPurchasePrice = true // Default to true for backward compatibility
}: ProductTableBodyProps) {
  if (products.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No hay productos para mostrar</p>
      </div>
    );
  }

  // Function to get the correct quantity to display based on selected store
  const getStockDisplay = (product: Product) => {
    if (selectedStore && product.stock_by_store && product.stock_by_store[selectedStore] !== undefined) {
      // Show the stock in the selected store
      return formatQuantityWithUnit(product.stock_by_store[selectedStore], product.unidad);
    }
    // Show the total stock across all stores
    return formatQuantityWithUnit(product.stock_total, product.unidad);
  };

  // Función para mostrar color y talla si existen
  const getColorTallaDisplay = (product: Product) => {
    const parts = [];
    if (product.color) parts.push(`Color: ${product.color}`);
    if (product.talla) parts.push(`Talla: ${product.talla}`);
    
    if (parts.length === 0) return null;
    return (
      <div className="text-xs text-muted-foreground mt-1">
        {parts.join(' | ')}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            {canViewPurchasePrice && <TableHead>Precio Compra</TableHead>}
            <TableHead>Precio Venta</TableHead>
            <TableHead>{selectedStore ? 'Stock en Sucursal' : 'Stock Total'}</TableHead>
            <TableHead>Stock Mínimo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div>
                  {product.nombre}
                  {getColorTallaDisplay(product)}
                </div>
              </TableCell>
              <TableCell>{product.categoria}</TableCell>
              {canViewPurchasePrice && (
                <TableCell>${product.precio_compra?.toFixed(2)}</TableCell>
              )}
              <TableCell>${product.precio_venta.toFixed(2)}</TableCell>
              <TableCell>{getStockDisplay(product)}</TableCell>
              <TableCell>{formatQuantityWithUnit(product.stock_minimo, product.unidad)}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onViewHistory(product.id)}
                >
                  Ver
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEditProduct(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDeleteProduct(product.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
