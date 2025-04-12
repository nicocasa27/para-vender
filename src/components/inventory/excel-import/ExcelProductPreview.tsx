
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface Product {
  nombre: string;
  descripcion?: string;
  precio_compra: number;
  precio_venta: number;
  categoria: string;
  unidad: string;
  stock_minimo: number;
  stock_maximo?: number;
  sucursal?: string;
  stock_inicial: number;
  _row?: number;
  _error?: boolean;
}

interface ExcelProductPreviewProps {
  products: Product[];
}

export function ExcelProductPreview({ products }: ExcelProductPreviewProps) {
  if (!products || products.length === 0) {
    return null;
  }
  
  // Only show first 10 products in preview
  const displayProducts = products.slice(0, Math.min(10, products.length));
  const hasMore = products.length > 10;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">
          Vista previa ({displayProducts.length} de {products.length} productos)
        </h3>
        <Badge variant="outline" className="text-xs">
          {products.length} productos encontrados
        </Badge>
      </div>
      
      <div className="border rounded-md overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Fila</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>P. Compra</TableHead>
              <TableHead>P. Venta</TableHead>
              <TableHead>Stock Min.</TableHead>
              <TableHead>Stock Inicial</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead className="w-[60px]">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayProducts.map((product, index) => (
              <TableRow key={index} className={product._error ? "bg-destructive/10" : ""}>
                <TableCell className="font-mono">{product._row || index + 2}</TableCell>
                <TableCell className="font-medium">{product.nombre}</TableCell>
                <TableCell>{product.categoria}</TableCell>
                <TableCell>{product.unidad}</TableCell>
                <TableCell>${product.precio_compra?.toFixed(2)}</TableCell>
                <TableCell>${product.precio_venta?.toFixed(2)}</TableCell>
                <TableCell>{product.stock_minimo}</TableCell>
                <TableCell>{product.stock_inicial}</TableCell>
                <TableCell>{product.sucursal || "-"}</TableCell>
                <TableCell>
                  {product._error ? (
                    <X className="h-4 w-4 text-destructive" />
                  ) : (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {hasMore && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground italic">
                  ...y {products.length - 10} productos más
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
