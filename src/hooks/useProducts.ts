
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Product, Category, Store } from '@/types/inventory';
import * as inventoryService from '@/services/inventoryService';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all-categories');
  const [storeFilter, setStoreFilter] = useState<string>('all-stores');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { productsData, inventoryData } = await inventoryService.fetchProducts();
      
      const productsWithStock: Product[] = productsData.map(product => {
        const productInventory = inventoryData.filter(item => item.producto_id === product.id);
        
        const stockTotal = productInventory.reduce((sum, item) => sum + Number(item.cantidad), 0);
        
        const stockByStore: {[key: string]: number} = {};
        const storeNames: {[key: string]: string} = {};
        
        productInventory.forEach(item => {
          stockByStore[item.almacen_id] = Number(item.cantidad);
          if (item.almacenes) {
            storeNames[item.almacen_id] = item.almacenes.nombre;
          }
        });
        
        let categoryName = "Sin categoría";
        let categoryId = product.categoria_id || "";
        
        if (product.categorias) {
          if (typeof product.categorias === 'object' && product.categorias !== null) {
            categoryName = product.categorias.nombre || "Sin categoría";
          }
        }
        
        return {
          id: product.id,
          nombre: product.nombre,
          precio_venta: Number(product.precio_venta) || 0,
          precio_compra: Number(product.precio_compra) || 0,
          stock_total: stockTotal,
          stock_by_store: stockByStore,
          store_names: storeNames,
          categoria_id: categoryId,
          categoria: categoryName,
          unidad_id: product.unidad_id,
          unidad: product.unidades?.nombre || "Unidad",
          stock_minimo: Number(product.stock_minimo) || 0,
          stock_maximo: Number(product.stock_maximo) || 0
        };
      });

      setProducts(productsWithStock);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error al cargar productos", {
        description: "No se pudieron cargar los productos"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await inventoryService.fetchCategories();
      
      console.log("Categorías cargadas:", data);
      
      if (Array.isArray(data)) {
        const validCategories = data.filter(
          (cat) => !!cat.id && !!cat.nombre && cat.id.trim() !== ""
        );
        
        console.log("Categorías válidas filtradas:", validCategories);
        
        setCategories(validCategories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Error al cargar categorías", {
        description: "No se pudieron cargar las categorías correctamente"
      });
    }
  }, []);

  const loadStores = useCallback(async () => {
    try {
      const data = await inventoryService.fetchStores();
      
      if (Array.isArray(data)) {
        const validStores = data.filter(
          (store) => !!store.id && !!store.nombre && store.id.trim() !== ""
        );
        
        setStores(validStores);
      }
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Error al cargar sucursales", {
        description: "No se pudieron cargar las sucursales correctamente"
      });
    }
  }, []);

  const handleAddProduct = async (productData: any) => {
    try {
      console.log("🚀 handleAddProduct: Datos recibidos:", productData);
      
      if (!productData.nombre && !productData.name) {
        throw new Error("El nombre del producto es requerido");
      }
      
      if (!productData.categoria_id && !productData.category) {
        throw new Error("La categoría del producto es requerida");
      }
      
      if (!productData.unidad_id && !productData.unit) {
        throw new Error("La unidad del producto es requerida");
      }
      
      await inventoryService.addProduct(productData);
      
      await loadProducts();
      return true;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error; // Propagamos el error para manejarlo en el componente
    }
  };

  const handleEditProduct = async (productData: any) => {
    console.log("🔄 handleEditProduct: INICIO - Datos recibidos:", productData);
    toast.info("Procesando edición de producto...");
    
    try {
      if (!productData.id) {
        console.error("❌ handleEditProduct: Error - ID de producto no proporcionado");
        const errorMsg = "El ID del producto es requerido para la actualización";
        toast.error("Error de validación", { description: errorMsg });
        throw new Error(errorMsg);
      }
      
      // Verificar campos obligatorios
      if ((!productData.nombre && !productData.name) || 
          (!productData.categoria_id && !productData.category) || 
          (!productData.unidad_id && !productData.unit)) {
        const errorMsg = "Todos los campos obligatorios deben estar completos";
        toast.error("Error de validación", { description: errorMsg });
        throw new Error(errorMsg);
      }
      
      console.log("✅ handleEditProduct: Validaciones pasadas, enviando a updateProduct");
      
      // Aquí esperamos explícitamente la respuesta de updateProduct
      const result = await inventoryService.updateProduct(productData);
      
      console.log("✅ handleEditProduct: Resultado de la actualización:", result);
      toast.success("Producto actualizado correctamente");
      
      // Recargar productos
      await loadProducts();
      return result;
    } catch (error) {
      console.error("❌ Error en handleEditProduct:", error);
      toast.error("Error al editar producto", {
        description: error instanceof Error ? error.message : "Error desconocido"
      });
      throw error; // Propagamos el error para manejarlo en el componente
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await inventoryService.deleteProduct(productId);
      
      toast.success("Producto eliminado", {
        description: "El producto ha sido eliminado correctamente"
      });
      
      loadProducts();
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar producto", {
        description: "No se pudo eliminar el producto"
      });
      return false;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || categoryFilter === "all-categories" || product.categoria_id === categoryFilter;
    const matchesStore = !storeFilter || storeFilter === "all-stores" || product.stock_by_store?.[storeFilter] !== undefined;
    
    return matchesSearch && matchesCategory && matchesStore;
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadStores();
  }, [loadProducts, loadCategories, loadStores]);

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
    refreshProducts: loadProducts,
    addProduct: handleAddProduct,
    editProduct: handleEditProduct,
    deleteProduct: handleDeleteProduct,
  };
}
