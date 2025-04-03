
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";

export interface Product {
  id: string;
  nombre: string;
  categoria: string;
  categoria_id: string;
  unidad: string;
  unidad_id: string;
  precio_compra: number;
  precio_venta: number;
  stock: {
    [key: string]: number;
  };
  stock_minimo: number;
  stock_maximo: number;
  stock_total?: number; // Calculado en base a stock
}

export function useProducts(selectedStore: string = "all") {
  const { toast: uiToast } = useToast();
  
  const fetchProducts = async () => {
    try {
      console.log("Fetching products, selectedStore:", selectedStore);
      
      // Get all products with their basic info
      const { data: productsData, error: productsError } = await supabase
        .from("productos")
        .select(`
          id, nombre, precio_compra, precio_venta, stock_minimo, stock_maximo,
          categoria_id, categorias(nombre),
          unidad_id, unidades(nombre)
        `);
      
      if (productsError) {
        console.error("Error fetching products data:", productsError);
        toast.error("Error al cargar productos", {
          description: productsError.message
        });
        throw productsError;
      }
      
      if (!productsData || productsData.length === 0) {
        console.log("No products found");
        return [];
      }
      
      // Get inventory data - for all stores or a specific one
      const inventoryQuery = supabase
        .from("inventario")
        .select(`
          cantidad,
          almacen_id,
          producto_id,
          almacenes(id, nombre)
        `);
        
      if (selectedStore !== "all") {
        inventoryQuery.eq("almacen_id", selectedStore);
      }
      
      const { data: inventoryData, error: inventoryError } = await inventoryQuery;
      
      if (inventoryError) {
        console.error("Error fetching inventory data:", inventoryError);
        toast.error("Error al cargar datos de inventario", {
          description: inventoryError.message
        });
        throw inventoryError;
      }
      
      // Process products with their stock information
      const productsWithStock = productsData.map(product => {
        // Filter inventory items for this product
        const productInventory = inventoryData?.filter(inv => inv.producto_id === product.id) || [];
        
        // Create a map of store ID to stock quantity
        const stockByStore: {[key: string]: number} = {};
        
        let stockTotal = 0;
        
        productInventory.forEach(item => {
          const qty = Number(item.cantidad) || 0;
          stockByStore[item.almacen_id] = qty;
          stockTotal += qty;
        });
        
        return {
          id: product.id,
          nombre: product.nombre,
          categoria: product.categorias ? product.categorias.nombre : "Sin categoría",
          categoria_id: product.categoria_id,
          unidad: product.unidades ? product.unidades.nombre : "Unidad",
          unidad_id: product.unidad_id,
          precio_compra: Number(product.precio_compra) || 0,
          precio_venta: Number(product.precio_venta) || 0,
          stock: stockByStore,
          stock_total: stockTotal,
          stock_minimo: Number(product.stock_minimo) || 0,
          stock_maximo: Number(product.stock_maximo) || 0,
        };
      });
      
      console.log(`Processed ${productsWithStock.length} products with stock information`);
      return productsWithStock;
    } catch (error: any) {
      console.error("Error fetching products:", error);
      uiToast({
        title: "Error",
        description: error.message || "No se pudieron cargar los productos",
        variant: "destructive",
      });
      return [];
    }
  };

  const { 
    data: products = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: ['products', selectedStore],
    queryFn: fetchProducts,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  return { products, isLoading, error, refetch };
}
