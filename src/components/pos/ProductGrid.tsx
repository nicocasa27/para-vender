
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search } from "lucide-react";
import { Product } from "@/types/inventory";
import { useProducts } from "@/hooks/useProducts";

interface ProductGridProps {
  onProductSelect: (product: Product) => void;
  selectedStore: string;
}

export function ProductGrid({ onProductSelect, selectedStore }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { products, loading, setStoreFilter } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (selectedStore) {
      setStoreFilter(selectedStore);
    }
  }, [selectedStore, setStoreFilter]);

  // Optimizado: Uso de useCallback para memoizar la función de búsqueda
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Optimizado: Uso de useMemo para filtrar productos solo cuando cambian relevantes
  useEffect(() => {
    if (products) {
      // Implementar batching para mejorar rendimiento en listas grandes
      const timeoutId = setTimeout(() => {
        const query = searchQuery.toLowerCase();
        
        const filtered = products.filter(
          (product) =>
            product.nombre.toLowerCase().includes(query) ||
            (product.categoria && product.categoria.toLowerCase().includes(query))
        );
        
        setFilteredProducts(filtered);
      }, 100); // Pequeño retraso para evitar múltiples actualizaciones en secuencia
      
      return () => clearTimeout(timeoutId);
    }
  }, [products, searchQuery]);

  // Renderizado condicional para estado de carga
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
                  <div className="flex flex-wrap items-center text-sm text-muted-foreground">
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                      {product.categoria || "Sin categoría"}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{product.unidad || "unidad"}</span>
                  </div>
                  
                  {product.descripcion && (
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {product.descripcion}
                    </div>
                  )}
                  
                  {(product.color || product.talla) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.color && (
                        <span className="bg-blue-50 text-blue-700 text-xs rounded-full px-2 py-0.5">
                          Color: {product.color}
                        </span>
                      )}
                      {product.talla && (
                        <span className="bg-green-50 text-green-700 text-xs rounded-full px-2 py-0.5">
                          Talla: {product.talla}
                        </span>
                      )}
                    </div>
                  )}
                  
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
