
import { useState, useEffect, useMemo } from "react";
import { Product, Category, Store } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchProducts, fetchCategories, fetchStores, addProduct as addProductService, updateProduct, deleteProduct as deleteProductService } from "@/services/inventoryService";

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
        storeNames[almacenId] = item.almacenes.nombre || '';
      }
    });

    // Ahora extraemos los valores de los objetos "categorias" y "unidades" 
    // que fueron modificados en el servicio
    const catName = product.categorias ? product.categorias.nombre || "Sin categoría" : "Sin categoría";
    const unitAbbr = product.unidades ? product.unidades.nombre || "u" : "u";

    return {
      id: product.id || '',
      nombre: product.nombre || '',
      precio_venta: Number(product.precio_venta) || 0,
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

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [storeFilter, setStoreFilter] = useState<string | null>(null);

  // Function to get a product by ID
  const getProductById = (id: string) => {
    return products.find((product) => product.id === id);
  };

  const refreshProducts = async () => {
    setLoading(true);
    try {
      const { productsData, inventoryData } = await fetchProducts();
      const categoryData = await fetchCategories();
      const storeData = await fetchStores();
      
      const mappedProducts = mapInventoryData(productsData || [], inventoryData || []);
      setProducts(mappedProducts);
      setCategories(categoryData || []);
      setStores(storeData || []);
      
      console.log(`Loaded ${mappedProducts.length} products, ${categoryData?.length} categories, ${storeData?.length} stores`);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: any) => {
    try {
      const result = await addProductService(productData);
      if (result.success) {
        await refreshProducts();
        return result.data;
      }
      throw new Error("Error al agregar producto");
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  };

  const editProduct = async (productData: any) => {
    try {
      const result = await updateProduct(productData);
      if (result.success) {
        await refreshProducts();
        return result.data;
      }
      throw new Error("Error al actualizar producto");
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const success = await deleteProductService(productId);
      if (success) {
        await refreshProducts();
        toast.success("Producto eliminado correctamente");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar producto");
      return false;
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Apply search filter
      const matchesSearch = searchTerm 
        ? product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      // Apply category filter
      const matchesCategory = categoryFilter 
        ? product.categoria_id === categoryFilter
        : true;
      
      // Apply store filter
      const matchesStore = storeFilter
        ? (product.stock_by_store && product.stock_by_store[storeFilter] !== undefined)
        : true;
      
      return matchesSearch && matchesCategory && matchesStore;
    });
  }, [products, searchTerm, categoryFilter, storeFilter]);
  
  return {
    products: filteredProducts,
    categories,
    stores,
    loading,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    storeFilter,
    setStoreFilter,
    refreshProducts,
    addProduct,
    editProduct,
    deleteProduct,
    getProductById
  };
}
