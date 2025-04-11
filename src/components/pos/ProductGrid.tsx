
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search } from "lucide-react";
import { Product } from "@/types/inventory";
import { useSales } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";

interface ProductGridProps {
  onProductSelect: (product: Product) => void;
  selectedStore: string;
}

export function ProductGrid({ onProductSelect, selectedStore }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { products, loading, setStoreFilter } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Set the store filter when the selected store changes
  useEffect(() => {
    if (selectedStore) {
      setStoreFilter(selectedStore);
    }
  }, [selectedStore, setStoreFilter]);

  useEffect(() => {
    if (products) {
      setFilteredProducts(
        products.filter(
          (product) =>
            product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.categoria &&
              product.categoria.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }
  }, [products, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="h-32 animate-pulse bg-gray-100">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="w-full h-full flex flex-col justify-between items-center">
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                <div className="h-8 w-full bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
        <Input
          placeholder="Buscar productos..."
          className="pl-10"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg text-muted-foreground">
          <p className="text-lg">No se encontraron productos</p>
          <p className="text-sm mt-2">Intente con otra búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden border hover:shadow-md transition-shadow">
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div className="space-y-2 mb-3">
                  <h3 className="font-medium text-base line-clamp-1">{product.nombre}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                      {product.categoria || "Sin categoría"}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{product.unidad || "unidad"}</span>
                  </div>
                  <p className="text-lg font-bold text-primary">${product.precio_venta.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    Stock: {product.stock_total || 0} {product.unidad || "unidades"}
                  </p>
                </div>
                <Button
                  onClick={() => onProductSelect(product)}
                  className="w-full"
                  disabled={!product.stock_total || product.stock_total <= 0}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Añadir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
