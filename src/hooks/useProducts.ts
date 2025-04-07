
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
        
        // Corregir acceso a la información de categoría
        let categoryName = "Sin categoría";
        let categoryId = product.categoria_id || "";
        
        if (product.categorias) {
          if (typeof product.categorias === 'object' && product.categorias !== null) {
            // Acceder directamente al nombre de la categoría
            categoryName = product.categorias.nombre || "Sin categoría";
          }
        }
        
        console.log("Producto:", product.nombre, 
          "- categoría_id:", categoryId, 
          "- categoría nombre:", categoryName, 
          "- categorias objeto:", JSON.stringify(product.categorias));
          
        return {
          id: product.id,
          nombre: product.nombre,
          precio_venta: Number(product.precio_venta),
          precio_compra: Number(product.precio_compra),
          stock_total: stockTotal,
          stock_by_store: stockByStore,
          store_names: storeNames,
          categoria_id: categoryId,
          categoria: categoryName,
          unidad_id: product.unidad_id,
          unidad: product.unidades?.nombre || "Unidad",
          stock_minimo: Number(product.stock_minimo),
          stock_maximo: Number(product.stock_maximo)
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
      
      const validCategories = data.filter(
        (cat) => !!cat.id && !!cat.nombre && cat.id.trim() !== ""
      );
      
      console.log("Categorías válidas filtradas:", validCategories);
      
      setCategories(validCategories);
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
      
      const validStores = data.filter(
        (store) => !!store.id && !!store.nombre && store.id.trim() !== ""
      );
      
      setStores(validStores);
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Error al cargar sucursales", {
        description: "No se pudieron cargar las sucursales correctamente"
      });
    }
  }, []);

  const handleAddProduct = async (productData: any) => {
    try {
      if (!productData.name || !productData.category || !productData.unit) {
        toast.error("Datos incompletos", {
          description: "Por favor complete todos los campos obligatorios"
        });
        return;
      }
      
      await inventoryService.addProduct(productData);
      
      toast.success("Producto agregado", {
        description: `${productData.name} ha sido agregado correctamente`
      });
      
      loadProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Error al agregar producto", {
        description: "No se pudo guardar el producto"
      });
    }
  };

  const handleEditProduct = async (productId: string, productData: any) => {
    try {
      if (!productData.name || !productData.category || !productData.unit) {
        toast.error("Datos incompletos", {
          description: "Por favor complete todos los campos obligatorios"
        });
        return;
      }
      
      await inventoryService.updateProduct(productId, productData);
      
      toast.success("Producto actualizado", {
        description: `${productData.name} ha sido actualizado correctamente`
      });
      
      loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error al actualizar producto", {
        description: "No se pudo actualizar el producto"
      });
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
