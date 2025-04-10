
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useCurrentStores } from "@/hooks/useCurrentStores";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  nombre: string;
  precio_venta: number;
  stock_total?: number;
  almacen_id?: string;
}

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

  // Actualizar tienda seleccionada cuando se carguen las tiendas
  useEffect(() => {
    if (!isLoading && stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0].id);
    }
  }, [stores, isLoading, selectedStore]);

  // Cargar productos cuando se seleccione una tienda
  useEffect(() => {
    if (!selectedStore) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Intentamos obtener productos con su stock en la tienda seleccionada
        const { data, error } = await supabase
          .from('productos')
          .select(`
            id,
            nombre,
            precio_venta
          `);

        if (error) throw error;

        // Ahora obtenemos el inventario para la tienda seleccionada
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventario')
          .select(`
            producto_id,
            cantidad
          `)
          .eq('almacen_id', selectedStore);

        if (inventoryError) throw inventoryError;

        // Crear un mapa de producto_id -> cantidad
        const inventoryMap = new Map();
        if (inventoryData) {
          inventoryData.forEach((item) => {
            inventoryMap.set(item.producto_id, Number(item.cantidad));
          });
        }

        // Convertir los datos al formato esperado por la interfaz
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

  // Funciones para manipular el carrito
  const handleAddToCart = (product: Product) => {
    // Verificar si hay stock disponible
    if (product.stock_total && product.stock_total <= 0) {
      toast.error(`${product.nombre} no tiene stock disponible`);
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      // Verificar si se puede incrementar (stock disponible)
      if (existingItem.cantidad >= (product.stock_total || 0)) {
        toast.error(`No hay más stock disponible de ${product.nombre}`);
        return;
      }
      
      // Incrementar cantidad si ya existe
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      // Añadir nuevo producto al carrito
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
      
      // Calcular subtotal e impuestos
      const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
      const taxes = subtotal * 0.16; // IVA 16%
      const total = subtotal + taxes;
      
      // Crear la venta en Supabase
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
      
      console.log("Venta creada con ID:", ventaData.id);
      
      // Crear los detalles de la venta
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
      
      // Actualizar el inventario (reducir stock)
      const inventarioPromises = cart.map(async (item) => {
        // Buscar el registro actual de inventario
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
        
        // Actualizar el inventario
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
        
        // Registrar el movimiento de salida
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
      
      // Esperar a que se completen todas las actualizaciones de inventario
      await Promise.all(inventarioPromises);
      
      // Limpiar el carrito después de la venta exitosa
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

  // Para desarrollo/demo
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
