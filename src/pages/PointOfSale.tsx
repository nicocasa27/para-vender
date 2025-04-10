import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/inventory";

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
}

export default function PointOfSale() {
  const { hasRole } = useAuth();
  const { stores, isLoading } = useCurrentStores();
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!isLoading && stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, isLoading, selectedStore]);

  useEffect(() => {
    if (!selectedStore) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('productos')
          .select(`
            id,
            nombre,
            precio_venta
          `);

        if (error) throw error;

        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventario')
          .select(`
            producto_id,
            cantidad
          `)
          .eq('almacen_id', selectedStore);

        if (inventoryError) throw inventoryError;

        const inventoryMap = new Map();
        if (inventoryData) {
          inventoryData.forEach((item) => {
            inventoryMap.set(item.producto_id, Number(item.cantidad));
          });
        }

        const productsWithStock = data.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          precio_venta: p.precio_venta,
          stock_total: inventoryMap.get(p.id) || 0,
          almacen_id: selectedStore
        }));

        setProducts(productsWithStock);
      } catch (error: any) {
        console.error("Error al cargar productos:", error.message);
        toast.error("Error al cargar productos");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedStore]);

  const handleAddToCart = (product: Product) => {
    if (product.stock_total && product.stock_total <= 0) {
      toast.error(`${product.nombre} no tiene stock disponible`);
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      if (existingItem.cantidad >= (product.stock_total || 0)) {
        toast.error(`No hay más stock disponible de ${product.nombre}`);
        return;
      }
      
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          nombre: product.nombre,
          precio: product.precio_venta,
          cantidad: 1,
          stock: product.stock_total || 0,
        },
      ]);
    }
    toast.success(`${product.nombre} añadido al carrito`);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    const item = cart.find(item => item.id === id);
    
    if (item && quantity > item.stock) {
      toast.error(`No hay suficiente stock disponible de ${item.nombre}`);
      return;
    }
    
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, cantidad: quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
    toast.info("Producto eliminado del carrito");
  };

  const handleClearCart = () => {
    setCart([]);
    toast.info("Carrito vaciado");
  };

  const handleCompleteSale = async (paymentMethod: string, customerName: string, cashAmount?: number) => {
    try {
      if (cart.length === 0) {
        toast.error("El carrito está vacío");
        return false;
      }

      if (!selectedStore) {
        toast.error("Seleccione una sucursal");
        return false;
      }

      console.log("Iniciando venta con método de pago:", paymentMethod);
      
      const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
      const taxes = subtotal * 0.16;
      const total = subtotal + taxes;
      
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          total,
          metodo_pago: paymentMethod,
          cliente: customerName || null,
          almacen_id: selectedStore,
          estado: 'completada'
        })
        .select('id')
        .single();
        
      if (ventaError) {
        console.error("Error al crear la venta:", ventaError);
        toast.error("Error al procesar la venta");
        return false;
      }
      
      const detallesVenta = cart.map(item => ({
        venta_id: ventaData.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad
      }));
      
      const { error: detallesError } = await supabase
        .from('detalles_venta')
        .insert(detallesVenta);
        
      if (detallesError) {
        console.error("Error al guardar detalles de venta:", detallesError);
        toast.error("Error al guardar detalles de la venta");
        return false;
      }
      
      const inventarioPromises = cart.map(async (item) => {
        const { data: inventarioActual, error: inventarioError } = await supabase
          .from('inventario')
          .select('id, cantidad')
          .eq('producto_id', item.id)
          .eq('almacen_id', selectedStore)
          .maybeSingle();
          
        if (inventarioError) {
          console.error(`Error al obtener inventario para ${item.nombre}:`, inventarioError);
          throw inventarioError;
        }
        
        if (!inventarioActual) {
          console.error(`No existe registro de inventario para ${item.nombre} en esta sucursal`);
          throw new Error(`No existe registro de inventario para ${item.nombre} en esta sucursal`);
        }
        
        const nuevaCantidad = Number(inventarioActual.cantidad) - item.cantidad;
        
        if (nuevaCantidad < 0) {
          throw new Error(`Stock insuficiente para ${item.nombre}`);
        }
        
        const { error: updateError } = await supabase
          .from('inventario')
          .update({ cantidad: nuevaCantidad })
          .eq('id', inventarioActual.id);
          
        if (updateError) {
          console.error(`Error al actualizar inventario para ${item.nombre}:`, updateError);
          throw updateError;
        }
        
        const { error: movimientoError } = await supabase
          .from('movimientos')
          .insert({
            tipo: 'salida',
            producto_id: item.id,
            almacen_origen_id: selectedStore,
            cantidad: item.cantidad,
            notas: `Venta #${ventaData.id}`
          });
          
        if (movimientoError) {
          console.error(`Error al registrar movimiento para ${item.nombre}:`, movimientoError);
          throw movimientoError;
        }
      });
      
      await Promise.all(inventarioPromises);
      
      setCart([]);
      
      console.log("✅ Venta completada correctamente");
      toast.success("Venta completada correctamente");
      
      return true;
    } catch (error: any) {
      console.error("Error al procesar la venta:", error);
      toast.error(`Error al procesar la venta: ${error.message}`);
      return false;
    }
  };

  const handleStoreChange = (storeId: string) => {
    if (cart.length > 0) {
      if (confirm("Cambiar de sucursal vaciará el carrito actual. ¿Desea continuar?")) {
        setSelectedStore(storeId);
        setCart([]);
      }
    } else {
      setSelectedStore(storeId);
    }
  };

  if (!hasRole("sales") && !hasRole("admin")) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Acceso Restringido</h1>
        <p className="text-muted-foreground">
          No tienes permisos para acceder al Punto de Venta
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 p-4 overflow-auto">
          <ProductGrid 
            onProductSelect={handleAddToCart} 
            selectedStore={selectedStore} 
          />
        </div>

        <div className="w-1/3 border-l">
          <Cart 
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCompleteSale={handleCompleteSale}
            stores={stores}
            selectedStore={selectedStore}
            onStoreChange={handleStoreChange}
          />
        </div>
      </div>
    </div>
  );
}
