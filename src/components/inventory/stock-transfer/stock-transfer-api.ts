
import { supabase } from "@/integrations/supabase/client";
import { StoreData, ProductStock, TransferRecord } from "./types";

export const getStores = async (): Promise<StoreData[]> => {
  const { data, error } = await supabase
    .from("almacenes")
    .select("id, nombre")
    .order("nombre");

  if (error) {
    console.error("Error fetching stores:", error);
    throw error;
  }
  
  return data || [];
};

export const getProductsInStore = async (storeId: string): Promise<ProductStock[]> => {
  const { data, error } = await supabase
    .from("inventario")
    .select(`
      cantidad,
      productos!inner(
        id,
        nombre,
        unidades(nombre, abreviatura)
      )
    `)
    .eq("almacen_id", storeId)
    .gt("cantidad", 0);

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  // Transform the data to match our ProductStock interface
  return (data || []).map(item => ({
    id: item.productos.id,
    nombre: item.productos.nombre,
    unidad: item.productos.unidades?.abreviatura || "u",
    stock: Number(item.cantidad),
  }));
};

export const getRecentTransfers = async (limit = 10): Promise<TransferRecord[]> => {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      created_at,
      tipo,
      cantidad,
      notas,
      productos(nombre),
      origen:almacenes!movimientos_almacen_origen_id_fkey(nombre),
      destino:almacenes!movimientos_almacen_destino_id_fkey(nombre)
    `)
    .eq("tipo", "transferencia")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching transfer history:", error);
    throw error;
  }

  // Transform the data to match our TransferRecord interface
  return (data || []).map(item => ({
    id: item.id,
    fecha: new Date(item.created_at).toLocaleDateString(),
    origen: item.origen?.nombre || "N/A",
    destino: item.destino?.nombre || "N/A",
    producto: item.productos?.nombre || "N/A",
    cantidad: Number(item.cantidad),
    notas: item.notas,
  }));
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
    // 1. Reduce inventory in source store
    const { error: sourceError } = await supabase.rpc(
      "update_inventory",
      {
        p_producto_id: productId,
        p_almacen_id: sourceStoreId,
        p_cantidad: -quantity
      }
    );
    
    if (sourceError) throw sourceError;
    console.log("Source inventory reduced successfully");
    
    // 2. Increase inventory in target store
    const { error: targetError } = await supabase.rpc(
      "update_inventory",
      {
        p_producto_id: productId,
        p_almacen_id: targetStoreId,
        p_cantidad: quantity
      }
    );
    
    if (targetError) throw targetError;
    console.log("Target inventory increased successfully");
    
    // 3. Record the movement
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
    
    if (movementError) throw movementError;
    console.log("Transfer movement recorded successfully");
    
  } catch (error) {
    console.error("Transfer process failed:", error);
    throw error;
  }
  
  console.log("Stock transfer completed successfully");
};
