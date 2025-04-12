
import { Product } from "@/types/inventory";

export function mapInventoryData(productsData: any[], inventoryData: any[]): Product[] {
  const mappedProducts = productsData.map(product => {
    // Calcular stock total y por almacén
    const productInventory = inventoryData.filter(item => item.producto_id === product.id);
    const stockTotal = calculateTotalStock(productInventory);
    const stockByStore = mapStockByStore(productInventory);
    const storeNames = mapStoreNames(productInventory);
    
    console.log(`Producto ${product.nombre} (${product.id}): Stock total = ${stockTotal}, Stock por tienda =`, stockByStore);
    
    return {
      ...product,
      stock_total: stockTotal,
      stock_by_store: stockByStore,
      store_names: storeNames,
      inventario: productInventory
    };
  });
  
  return mappedProducts;
}

function calculateTotalStock(inventory: any[]): number {
  if (!inventory || inventory.length === 0) return 0;
  return inventory.reduce((total, item) => total + (Number(item.cantidad) || 0), 0);
}

function mapStockByStore(inventory: any[]): { [key: string]: number } {
  if (!inventory || inventory.length === 0) return {};
  
  const result: { [key: string]: number } = {};
  
  inventory.forEach(item => {
    if (item.almacen_id) {
      result[item.almacen_id] = Number(item.cantidad) || 0;
    }
  });
  
  return result;
}

function mapStoreNames(inventory: any[]): { [key: string]: string } {
  if (!inventory || inventory.length === 0) return {};
  
  const result: { [key: string]: string } = {};
  
  inventory.forEach(item => {
    if (item.almacen_id && item.almacenes && item.almacenes.nombre) {
      result[item.almacen_id] = item.almacenes.nombre;
    }
  });
  
  return result;
}
