
import { useState, useEffect } from "react";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

const PointOfSale = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [stores, setStores] = useState<{id: string, nombre: string}[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase
          .from("almacenes")
          .select("id, nombre");
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setStores(data);
          setSelectedStore(data[0].id); // Set first store as default
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las sucursales",
          variant: "destructive",
        });
      }
    };

    fetchStores();
  }, [toast]);

  const handleProductSelect = (product: { id: string; name: string; price: number; stock: number }) => {
    setCartItems((prevItems) => {
      // Check if product is already in cart
      const existingItemIndex = prevItems.findIndex((item) => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // If product is already in cart, update quantity if not exceeding stock
        const existingItem = prevItems[existingItemIndex];
        if (existingItem.quantity < product.stock) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          };
          return updatedItems;
        } else {
          toast({
            title: "Stock máximo alcanzado",
            description: `Has alcanzado el stock máximo disponible para ${product.name}.`,
          });
          return prevItems;
        }
      } else {
        // If product is not in cart, add it with quantity 1
        toast({
          title: "Producto agregado",
          description: `${product.name} ha sido agregado al carrito.`,
        });
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
    toast({
      title: "Producto eliminado",
      description: "El producto ha sido eliminado del carrito.",
    });
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    setCartItems([]);
    toast({
      title: "Carrito vacío",
      description: "Todos los productos han sido eliminados del carrito.",
    });
  };

  const handleCompleteSale = async (paymentMethod: string, customerName: string, cashAmount?: number) => {
    if (cartItems.length === 0 || !selectedStore) return false;
    
    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const taxes = subtotal * 0.16; // IVA 16%
      const total = subtotal + taxes;

      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from("ventas")
        .insert({
          almacen_id: selectedStore,
          cliente: customerName || null,
          metodo_pago: paymentMethod,
          total: total,
          estado: "completada"
        })
        .select()
        .single();

      if (saleError) throw saleError;
      
      // Insert sale details and update inventory
      for (const item of cartItems) {
        // Insert sale detail
        const { error: detailError } = await supabase
          .from("detalles_venta")
          .insert({
            venta_id: saleData.id,
            producto_id: item.id,
            cantidad: item.quantity,
            precio_unitario: item.price,
            subtotal: item.price * item.quantity
          });

        if (detailError) throw detailError;

        // Get current inventory
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("inventario")
          .select("id, cantidad")
          .eq("producto_id", item.id)
          .eq("almacen_id", selectedStore)
          .single();

        if (inventoryError && inventoryError.code !== "PGRST116") throw inventoryError;

        // Update inventory
        if (inventoryData) {
          const newQuantity = Number(inventoryData.cantidad) - item.quantity;
          const { error: updateError } = await supabase
            .from("inventario")
            .update({ cantidad: newQuantity })
            .eq("id", inventoryData.id);

          if (updateError) throw updateError;
        }

        // Insert movement record
        const { error: movementError } = await supabase
          .from("movimientos")
          .insert({
            producto_id: item.id,
            cantidad: item.quantity,
            tipo: "venta",
            almacen_origen_id: selectedStore,
            notas: `Venta #${saleData.id}`
          });

        if (movementError) throw movementError;
      }

      // Clear cart after successful sale
      setCartItems([]);
      
      return true;
    } catch (error) {
      console.error("Error completing sale:", error);
      toast({
        title: "Error al procesar la venta",
        description: "Ha ocurrido un error al procesar la venta.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Punto de Venta</h2>
        <p className="text-muted-foreground mt-2">
          Procese ventas rápida y eficientemente con nuestro sistema de punto de venta integrado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-[calc(100vh-14rem)]">
        <div className="lg:col-span-2 h-full">
          <ProductGrid 
            onProductSelect={handleProductSelect} 
            selectedStore={selectedStore}
          />
        </div>
        <div className="h-full">
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCompleteSale={handleCompleteSale}
            stores={stores}
            selectedStore={selectedStore}
            onStoreChange={setSelectedStore}
          />
        </div>
      </div>
    </div>
  );
};

export default PointOfSale;
