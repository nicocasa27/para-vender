import { useMemo } from "react";
import { Product } from "@/types/inventory";

// Safe mapping function for nested properties
function mapInventoryData(products: any[], inventoryData: any[]) {
  return products.map(product => {
    const inventoryItems = inventoryData?.filter(
      item => item.producto_id === product.id
    ) || [];

    const stockByStore: {[key: string]: number} = {};
    const storeNames: {[key: string]: string} = {};

    let stockTotal = 0;
    
    inventoryItems.forEach(item => {
      const cantidad = Number(item.cantidad);
      const almacenId = item.almacen_id;
      stockByStore[almacenId] = cantidad;
      stockTotal += cantidad;
      
      if (item.almacenes) {
        storeNames[almacenId] = item.almacenes.nombre;
      }
    });

    const catName = product.categorias ? product.categorias.nombre : "Sin categoría";
    const unitAbbr = product.unidades ? product.unidades.nombre : "u";

    return {
      id: product.id,
      nombre: product.nombre,
      precio_venta: Number(product.precio_venta),
      precio_compra: Number(product.precio_compra || 0),
      stock_total: stockTotal,
      categoria: catName,
      categoria_id: product.categoria_id,
      unidad: unitAbbr,
      unidad_id: product.unidad_id,
      stock_minimo: Number(product.stock_minimo || 0),
      stock_maximo: Number(product.stock_maximo || 0),
      stock_by_store: stockByStore,
      store_names: storeNames
    } as Product;
  });
}

export function useProducts(
  productsData: any[],
  inventoryData: any[]
) {
  // Create a memoized version of the products
  const products = useMemo(() => {
    return mapInventoryData(productsData || [], inventoryData || []);
  }, [productsData, inventoryData]);

  // Function to get a product by ID
  const getProductById = (id: string) => {
    return products.find((product) => product.id === id);
  };
  
  return {
    products,
    getProductById
  };
}
