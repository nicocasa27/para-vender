
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
}

export function ProductTableBody({
  products,
  onViewHistory,
  onEditProduct,
  onDeleteProduct
}: ProductTableBodyProps) {
  if (products.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No hay productos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Stock Total</TableHead>
            <TableHead>Stock Mínimo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.nombre}</TableCell>
              <TableCell>{product.categoria}</TableCell>
              <TableCell>${product.precio_venta.toFixed(2)}</TableCell>
              <TableCell>{formatQuantityWithUnit(product.stock_total, product.unidad)}</TableCell>
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
