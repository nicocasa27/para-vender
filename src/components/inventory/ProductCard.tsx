
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types/inventory";

interface Props {
  product: Product;
  onClick?: () => void;
}

// Changed from 'export function ProductCard' to explicitly assign the component
export function ProductCard({ product, onClick }: Props) {
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-lg transition">
      <CardHeader>
        <CardTitle className="text-base">{product.nombre}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">${product.precio_venta}</p>
        <p className="text-xs text-muted-foreground">Stock: {product.stock_total}</p>
      </CardContent>
    </Card>
  );
}
