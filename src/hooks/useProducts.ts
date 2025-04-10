
import { useState, useEffect, useMemo } from "react";
import { Product, Category, Store } from "@/types/inventory";
import { toast } from "sonner";
import { 
  fetchProducts, 
  fetchCategories, 
  fetchStores, 
  addProduct as addProductService, 
  updateProduct, 
  deleteProduct as deleteProductService 
} from "@/services/inventoryService";
import { mapInventoryData } from "@/utils/inventory/mappers";
import { useAuth } from "@/contexts/auth";
import { useCurrentStores } from "@/hooks/useCurrentStores";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [storeFilter, setStoreFilter] = useState<string | null>(null);
  
  // Obtener información del usuario y sus sucursales asignadas
  const { user, userRoles } = useAuth();
  const { stores: userStores, hasStores } = useCurrentStores();
  
  // Función para obtener los IDs de las sucursales asignadas al usuario
  const getUserStoreIds = useMemo(() => {
    const isAdmin = userRoles.some(role => role.role === 'admin');
    
    // Si es admin, no filtramos por sucursal (puede ver todo)
    if (isAdmin) {
      return null;
    }
    
    // Si tiene sucursales asignadas, obtenemos sus IDs
    if (hasStores) {
      return userStores.map(store => store.id);
    }
    
    return [];
  }, [userRoles, userStores, hasStores]);

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
      console.log('User store IDs:', getUserStoreIds);
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
      // Primero filtramos por las sucursales asignadas al usuario
      if (getUserStoreIds) {
        // Si el usuario tiene sucursales asignadas pero el producto no tiene stock en ninguna
        if (getUserStoreIds.length > 0) {
          // Verificar si el producto tiene stock en alguna de las sucursales del usuario
          const hasStockInUserStore = getUserStoreIds.some(storeId => 
            product.stock_by_store && 
            product.stock_by_store[storeId] !== undefined
          );
          
          // Si no tiene stock en ninguna sucursal del usuario, no mostrar
          if (!hasStockInUserStore) {
            return false;
          }
        }
      }
      
      // Aplicar filtro de búsqueda
      const matchesSearch = searchTerm 
        ? product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      
      // Aplicar filtro de categoría
      const matchesCategory = categoryFilter 
        ? product.categoria_id === categoryFilter
        : true;
      
      // Aplicar filtro de sucursal seleccionada por el usuario en la UI
      const matchesStore = storeFilter
        ? (product.stock_by_store && 
           product.stock_by_store[storeFilter] !== undefined && 
           product.stock_by_store[storeFilter] > 0)
        : true;
      
      return matchesSearch && matchesCategory && matchesStore;
    });
  }, [products, searchTerm, categoryFilter, storeFilter, getUserStoreIds]);
  
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
