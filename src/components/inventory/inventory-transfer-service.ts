
import { supabase } from "@/integrations/supabase/client";
import { 
  Store, 
  Product, 
  TransferHistory, 
  UpdateInventoryParams,
  UpdateInventoryReturn
} from "./types";

export const fetchStores = async (): Promise<Store[]> => {
  try {
    const { data, error } = await supabase
      .from("almacenes")
      .select("id, nombre")
      .order("nombre");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching stores:", error);
    throw error;
  }
};

export const fetchProductsInStore = async (storeId: string): Promise<Product[]> => {
  try {
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

    if (error) throw error;

    if (data) {
      return data.map(item => ({
        id: item.productos.id,
        nombre: item.productos.nombre,
        unidad: item.productos.unidades?.abreviatura || "u",
        stock: Number(item.cantidad),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const fetchTransferHistory = async (): Promise<TransferHistory[]> => {
  try {
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
      .limit(10);

    if (error) throw error;

    if (data) {
      return data.map(item => ({
        id: item.id,
        fecha: new Date(item.created_at).toLocaleDateString(),
        origen: item.origen?.nombre || "N/A",
        destino: item.destino?.nombre || "N/A",
        producto: item.productos?.nombre || "N/A",
        cantidad: Number(item.cantidad),
        notas: item.notas,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching transfer history:", error);
    throw error;
  }
};

export const transferInventory = async (
  productId: string,
  sourceStoreId: string,
  targetStoreId: string,
  quantity: number,
  notes?: string
): Promise<void> => {
  console.log("Starting transfer process...");
  
  // Reducir inventario en almacén de origen
  const sourceParams: UpdateInventoryParams = {
    p_producto_id: productId,
    p_almacen_id: sourceStoreId,
    p_cantidad: -quantity
  };
  
  console.log("Source params:", sourceParams);
  
  // Utilizamos la opción correcta de tipo para supabase.rpc
  const { error: sourceError } = await supabase
    .rpc("update_inventory", sourceParams);
  
  if (sourceError) {
    console.error("Source error:", sourceError);
    throw sourceError;
  }
  
  console.log("Source update successful, proceeding with target update");
  
  // Aumentar inventario en almacén de destino
  const targetParams: UpdateInventoryParams = {
    p_producto_id: productId,
    p_almacen_id: targetStoreId,
    p_cantidad: quantity
  };
  
  console.log("Target params:", targetParams);
  
  // Utilizamos la opción correcta de tipo para supabase.rpc
  const { error: targetError } = await supabase
    .rpc("update_inventory", targetParams);
  
  if (targetError) {
    console.error("Target error:", targetError);
    throw targetError;
  }
  
  console.log("Target update successful, recording the movement");
  
  // Registrar el movimiento en la tabla de movimientos
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
    console.error("Movement error:", movementError);
    throw movementError;
  }

  console.log("Transfer process completed successfully");
};
