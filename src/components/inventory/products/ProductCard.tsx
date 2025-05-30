import { Product } from "@/types/inventory";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Edit, Trash2, FileText, CircleDot, Tag } from "lucide-react";
import { formatQuantityWithUnit } from "@/utils/inventory/formatters";
import { useAuth } from "@/contexts/auth";

interface ProductCardProps {
  product: Product;
  getCategoryName: (categoryId?: string) => string;
  getStockStatusColor: (product: Product) => string;
  getDisplayStock: (product: Product) => string;
  getProductStoreName: (product: Product) => string;
  onViewDetail: (id: string) => void;
  onViewHistory: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductCard({
  product,
  getCategoryName,
  getStockStatusColor,
  getDisplayStock,
  getProductStoreName,
  onViewDetail,
  onViewHistory,
  onEdit,
  onDelete
}: ProductCardProps) {
  const { hasRole } = useAuth();
  
  // Sales users cannot see purchase prices, but admin and manager can
  const canViewPurchasePrice = !hasRole('sales') || hasRole('admin') || hasRole('manager');
  
  // Detectar si hay atributos y descripción
  const hasAttributes = !!(product.color || product.talla);

  return (
    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium line-clamp-2">{product.nombre}</CardTitle>
          <Badge variant="outline" className={getStockStatusColor(product)}>
            {getDisplayStock(product)}
          </Badge>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs text-muted-foreground">
            {getCategoryName(product.categoria_id)}
          </div>
          {product.sucursal_id && (
            <div className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {getProductStoreName(product)}
            </div>
          )}
        </div>

        {/* Descripción del producto */}
        {product.descripcion && (
          <div className="mt-2 text-sm text-gray-600">
            {product.descripcion}
          </div>
        )}
        
        {/* Atributos visibles - Color y Talla */}
        {hasAttributes && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.color && (
              <div className="flex items-center text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                <CircleDot className="h-3 w-3 mr-1" /> 
                {product.color}
              </div>
            )}
            {product.talla && (
              <div className="flex items-center text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                <Tag className="h-3 w-3 mr-1" />
                Talla: {product.talla}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {canViewPurchasePrice && (
            <div>
              <div className="text-muted-foreground">Precio compra:</div>
              <div className="font-medium">${product.precio_compra?.toFixed(2)}</div>
            </div>
          )}
          <div className={canViewPurchasePrice ? "" : "col-span-2"}>
            <div className="text-muted-foreground">Precio venta:</div>
            <div className="font-medium">${product.precio_venta.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onViewDetail(product.id)}
        >
          Ver detalle
        </Button>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onViewHistory(product.id)}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onEdit(product)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
