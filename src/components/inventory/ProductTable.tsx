
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Product } from "@/types/inventory";

const ProductTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Fetch products and calculate stock_total from inventario
      const { data: productsData, error: productsError } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta, almacen_id');

      if (productsError) {
        throw productsError;
      }

      // Get inventory data to calculate stock
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventario')
        .select('producto_id, cantidad');
        
      if (inventoryError) {
        throw inventoryError;
      }
      
      // Calculate stock_total for each product
      const productsWithStock: Product[] = productsData.map(product => {
        // Sum up all inventory entries for this product
        const stockTotal = inventoryData
          .filter(item => item.producto_id === product.id)
          .reduce((sum, item) => sum + Number(item.cantidad), 0);
          
        return {
          id: product.id,
          nombre: product.nombre,
          precio_venta: Number(product.precio_venta),
          stock_total: stockTotal,
          almacen_id: product.almacen_id || ''
        };
      });

      setProducts(productsWithStock);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error al cargar productos", {
        description: "No se pudieron cargar los productos"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Productos</h2>
        <Button variant="outline" onClick={loadProducts}>
          Actualizar
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No hay productos para mostrar</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.nombre}</TableCell>
                <TableCell>${product.precio_venta.toFixed(2)}</TableCell>
                <TableCell>{product.stock_total}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">Ver</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ProductTable;
