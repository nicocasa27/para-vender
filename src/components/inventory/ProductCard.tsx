import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductCardProps {
  name: string;
  price: number;
  stock: number;
}

export function ProductCard({ name, price, stock }: ProductCardProps) {
  return (
    <Card className="w-full shadow-sm transition-transform hover:scale-[1.02]">
      <CardHeader>
        <CardTitle className="text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <div>Precio: ${price.toFixed(2)}</div>
        <div>Stock: {stock} unidades</div>
      </CardContent>
    </Card>
  );
}
