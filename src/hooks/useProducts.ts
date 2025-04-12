
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
  const [error, setError] = useState<string | null>(null);
  
  // Obtener información del usuario y sus sucursales asignadas
  const { user, userRoles, hasRole } = useAuth();
  const { stores: userStores, hasStores, isLoading: storesLoading } = useCurrentStores();
  
  // Función para obtener los IDs de las sucursales asignadas al usuario
  const getUserStoreIds = useMemo(() => {
    const isAdmin = hasRole('admin');
    const isManager = hasRole('manager');
    
    // Administradores y gerentes pueden ver todo
    if (isAdmin || isManager) {
      console.log("Usuario es admin o gerente, puede ver todas las sucursales");
      return null;
    }
    
    // Si tiene sucursales asignadas como vendedor, obtenemos sus IDs
    if (hasRole('sales') && hasStores) {
      const storeIds = userStores.map(store => store.id);
      console.log("Usuario tiene sucursales asignadas:", storeIds);
      return storeIds;
    }
    
    // Si es viewer sin sucursales asignadas, puede ver todo
    if (hasRole('viewer')) {
      console.log("Usuario es viewer sin sucursales específicas, muestra todo");
      return null;
    }
    
    console.log("Usuario sin roles específicos o sucursales asignadas");
    return [];
  }, [userRoles, userStores, hasStores, hasRole]);

  // Function to get a product by ID
  const getProductById = (id: string) => {
    return products.find((product) => product.id === id);
  };

  const refreshProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { productsData, inventoryData } = await fetchProducts();
      const categoryData = await fetchCategories();
      const storeData = await fetchStores();
      
      if (!productsData) {
        throw new Error("No se pudieron cargar los productos");
      }
      
      const mappedProducts = mapInventoryData(productsData || [], inventoryData || []);
      setProducts(mappedProducts);
      setCategories(categoryData || []);
      setStores(storeData || []);
      
      console.log(`Loaded ${mappedProducts.length} products, ${categoryData?.length} categories, ${storeData?.length} stores`);
      console.log('User store IDs:', getUserStoreIds);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setError(error.message || "Error al cargar productos");
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
      // Asegurarse de que todos los campos estén presentes
      const completeProductData = {
        ...productData,
        color: productData.color || null,
        talla: productData.talla || null
      };
      console.log("useProducts.editProduct - Datos completos:", completeProductData);
      
      const result = await updateProduct(completeProductData);
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

  // Cargar productos al montar el componente o cuando cambien los roles/tiendas
  useEffect(() => {
    if (!storesLoading) {
      refreshProducts();
    }
  }, [storesLoading, userRoles.length, getUserStoreIds]);

  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    
    return products.filter((product) => {
      // Primero filtramos por las sucursales asignadas al usuario (sales)
      if (getUserStoreIds && getUserStoreIds.length > 0) {
        // Si el producto no tiene stock en ninguna sucursal, saltarlo
        if (!product.stock_by_store || Object.keys(product.stock_by_store).length === 0) {
          return false;
        }
        
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
  
  // Filters stores based on user role - only show stores the user has access to
  const accessibleStores = useMemo(() => {
    // Admin and manager can see all stores
    if (hasRole('admin') || hasRole('manager')) {
      return stores;
    }
    
    // Sales users can only see their assigned stores
    if (hasRole('sales') && hasStores) {
      return userStores;
    }
    
    // Viewer or others get all stores
    return stores;
  }, [stores, userStores, hasRole, hasStores]);
  
  return {
    products: filteredProducts,
    allProducts: products,
    categories,
    stores: accessibleStores,
    loading,
    error,
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
    getProductById,
    userStoreIds: getUserStoreIds
  };
}
