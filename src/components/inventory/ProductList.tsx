
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Product } from "@/types/inventory";

interface ProductListProps {
  products: Product[];
  onView: (productId: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onView,
  onEdit,
  onDelete,
}) => {
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
              <TableCell>{product.stock_total}</TableCell>
              <TableCell>{product.stock_minimo}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onView(product.id)}
                >
                  Ver
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDelete(product.id)}
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
};

export default ProductList;
