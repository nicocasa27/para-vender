
import { Product } from "@/types/inventory";
import { ProductCard } from "@/components/inventory/products/ProductCard";

interface ProductCardListProps {
  products: Product[];
  getCategoryName: (categoryId?: string) => string;
  getStockStatusColor: (product: Product) => string;
  getDisplayStock: (product: Product) => string;
  getProductStoreName: (product: Product) => string;
  onViewDetail: (id: string) => void;
  onViewHistory: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductCardList({
  products,
  getCategoryName,
  getStockStatusColor,
  getDisplayStock,
  getProductStoreName,
  onViewDetail,
  onViewHistory,
  onEdit,
  onDelete
}: ProductCardListProps) {
  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-muted-foreground">
        No se encontraron productos. Añada uno nuevo para comenzar.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          getCategoryName={getCategoryName}
          getStockStatusColor={getStockStatusColor}
          getDisplayStock={getDisplayStock}
          getProductStoreName={getProductStoreName}
          onViewDetail={onViewDetail}
          onViewHistory={onViewHistory}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
