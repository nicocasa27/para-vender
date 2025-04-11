
import { supabase } from "@/integrations/supabase/client";
import { StoreData, ProductStock, TransferRecord } from "./types";
import { toast } from "sonner";

export const getStores = async (): Promise<StoreData[]> => {
  try {
    const { data, error } = await supabase
      .from("almacenes")
      .select("id, nombre")
      .order("nombre");

    if (error) {
      console.error("Error fetching stores:", error);
      toast.error("Error al cargar las sucursales", {
        description: error.message
      });
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching stores:", error);
    toast.error("Error al cargar las sucursales");
    return [];
  }
};

export const getProductsInStore = async (storeId: string): Promise<ProductStock[]> => {
  try {
    // First get inventory items
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventario")
      .select(`
        id,
        cantidad,
        producto_id,
        almacen_id
      `)
      .eq("almacen_id", storeId)
      .gt("cantidad", 0);

    if (inventoryError) {
      console.error("Error fetching inventory:", inventoryError);
      toast.error("Error al cargar el inventario", {
        description: inventoryError.message
      });
      throw inventoryError;
    }

    if (!inventoryData || inventoryData.length === 0) {
      return [];
    }

    // Extract product IDs
    const productIds = inventoryData.map(item => item.producto_id);

    // Get product details separately
    const { data: productsData, error: productsError } = await supabase
      .from("productos")
      .select(`
        id,
        nombre,
        unidad_id
      `)
      .in("id", productIds);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      toast.error("Error al cargar los productos", {
        description: productsError.message
      });
      throw productsError;
    }

    // Get units separately
    const { data: unitsData, error: unitsError } = await supabase
      .from("unidades")
      .select("id, abreviatura, nombre");

    if (unitsError) {
      console.error("Error fetching units:", unitsError);
      // Continue without units information
    }

    // Create a map for units
    const unitsMap = new Map();
    if (unitsData) {
      unitsData.forEach(unit => {
        unitsMap.set(unit.id, unit);
      });
    }

    // Create a map for inventory quantities
    const inventoryMap = new Map();
    inventoryData.forEach(item => {
      inventoryMap.set(item.producto_id, Number(item.cantidad));
    });

    // Combine data to match our ProductStock interface
    return (productsData || []).map(product => {
      const unit = product.unidad_id ? unitsMap.get(product.unidad_id) : null;
      return {
        id: product.id,
        nombre: product.nombre,
        unidad: unit ? unit.abreviatura || unit.nombre : "u",
        stock: inventoryMap.get(product.id) || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    toast.error("Error al cargar los productos");
    return [];
  }
};

export const getRecentTransfers = async (limit = 10): Promise<TransferRecord[]> => {
  try {
    const { data, error } = await supabase
      .from("movimientos")
      .select(`
        id,
        created_at,
        tipo,
        cantidad,
        notas,
        producto_id,
        almacen_origen_id,
        almacen_destino_id
      `)
      .eq("tipo", "transferencia")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching transfer history:", error);
      toast.error("Error al cargar el historial de transferencias", {
        description: error.message
      });
      throw error;
    }

    // Get relevant product names
    const productIds = data.map(item => item.producto_id).filter(Boolean);
    const { data: productsData, error: productsError } = await supabase
      .from("productos")
      .select("id, nombre")
      .in("id", productIds);

    if (productsError) {
      console.error("Error fetching product names:", productsError);
    }

    // Get store names
    const storeIds = [...new Set([
      ...data.map(item => item.almacen_origen_id).filter(Boolean),
      ...data.map(item => item.almacen_destino_id).filter(Boolean)
    ])];
    
    const { data: storesData, error: storesError } = await supabase
      .from("almacenes")
      .select("id, nombre")
      .in("id", storeIds);

    if (storesError) {
      console.error("Error fetching store names:", storesError);
    }

    // Create maps for easy lookups
    const productMap = new Map();
    if (productsData) {
      productsData.forEach(product => {
        productMap.set(product.id, product.nombre);
      });
    }

    const storeMap = new Map();
    if (storesData) {
      storesData.forEach(store => {
        storeMap.set(store.id, store.nombre);
      });
    }

    // Transform the data to match our TransferRecord interface
    return (data || []).map((item: any) => ({
      id: item.id,
      fecha: new Date(item.created_at).toLocaleDateString(),
      origen: storeMap.get(item.almacen_origen_id) || "N/A",
      destino: storeMap.get(item.almacen_destino_id) || "N/A",
      producto: productMap.get(item.producto_id) || "N/A",
      cantidad: Number(item.cantidad),
      notas: item.notas,
    }));
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    toast.error("Error al cargar el historial de transferencias");
    return [];
  }
};

export const executeStockTransfer = async (
  productId: string,
  sourceStoreId: string,
  targetStoreId: string,
  quantity: number,
  notes?: string
): Promise<void> => {
  console.log("Starting stock transfer process...");
  
  try {
    // 1. Get current quantity in source store
    const { data: sourceInventory, error: sourceError } = await supabase
      .from("inventario")
      .select("id, cantidad")
      .eq("producto_id", productId)
      .eq("almacen_id", sourceStoreId)
      .single();
      
    if (sourceError) {
      toast.error("Error al obtener inventario de origen", {
        description: sourceError.message
      });
      throw sourceError;
    }
    
    // Null check for sourceInventory
    if (!sourceInventory) {
      toast.error("No se encontró inventario en el almacén de origen");
      throw new Error("No se encontró inventario");
    }
    
    // 2. Update source inventory (decrement)
    const newSourceQuantity = Number(sourceInventory.cantidad) - quantity;
    
    if (newSourceQuantity < 0) {
      toast.error("Stock insuficiente en el almacén de origen");
      throw new Error("Stock insuficiente");
    }
    
    const { error: sourceUpdateError } = await supabase
      .from("inventario")
      .update({ cantidad: newSourceQuantity })
      .eq("id", sourceInventory.id);
    
    if (sourceUpdateError) {
      toast.error("Error al actualizar inventario de origen", {
        description: sourceUpdateError.message
      });
      throw sourceUpdateError;
    }
    
    console.log("Source inventory reduced successfully");
    
    // 3. Check if product exists in target store
    const { data: targetInventory, error: targetCheckError } = await supabase
      .from("inventario")
      .select("id, cantidad")
      .eq("producto_id", productId)
      .eq("almacen_id", targetStoreId)
      .maybeSingle();
    
    if (targetCheckError) {
      toast.error("Error al verificar inventario de destino", {
        description: targetCheckError.message
      });
      throw targetCheckError;
    }
    
    if (targetInventory) {
      // 4a. Update existing target inventory (increment)
      const newTargetQuantity = Number(targetInventory.cantidad) + quantity;
      
      const { error: targetUpdateError } = await supabase
        .from("inventario")
        .update({ cantidad: newTargetQuantity })
        .eq("id", targetInventory.id);
      
      if (targetUpdateError) {
        toast.error("Error al actualizar inventario de destino", {
          description: targetUpdateError.message
        });
        throw targetUpdateError;
      }
    } else {
      // 4b. Create new inventory record
      const { error: targetInsertError } = await supabase
        .from("inventario")
        .insert({
          producto_id: productId,
          almacen_id: targetStoreId,
          cantidad: quantity
        });
      
      if (targetInsertError) {
        toast.error("Error al crear inventario en destino", {
          description: targetInsertError.message
        });
        throw targetInsertError;
      }
    }
    
    console.log("Target inventory increased successfully");
    
    // 5. Record the movement
    const { error: movementError } = await supabase
      .from("movimientos")
      .insert({
        tipo: "transferencia",
        producto_id: productId,
        almacen_origen_id: sourceStoreId,
        almacen_destino_id: targetStoreId,
        cantidad: quantity,
        notas: notes || null,
      });
    
    if (movementError) {
      toast.error("Error al registrar el movimiento", {
        description: movementError.message
      });
      throw movementError;
    }
    
    console.log("Transfer movement recorded successfully");
    toast.success("Transferencia completada con éxito");
    
  } catch (error: any) {
    console.error("Transfer process failed:", error);
    toast.error("Error en la transferencia", {
      description: error.message || "Ha ocurrido un error durante la transferencia"
    });
    throw error;
  }
  
  console.log("Stock transfer completed successfully");
};
