
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
import { useProductsFiltering } from "./product/useProductsFiltering";

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
  const { hasRole } = useAuth();
  const { stores: userStores, hasStores, isLoading: storesLoading } = useCurrentStores();
  
  // Función para obtener los IDs de las sucursales asignadas al usuario
  const getUserStoreIds = useMemo(() => {
    if (hasRole('admin') || hasRole('manager')) {
      console.log("Usuario es admin o gerente, puede ver todas las sucursales");
      return null;
    }
    
    if (hasRole('sales') && hasStores) {
      const storeIds = userStores.map(store => store.id);
      console.log("Usuario tiene sucursales asignadas:", storeIds);
      return storeIds;
    }
    
    if (hasRole('viewer')) {
      console.log("Usuario es viewer sin sucursales específicas, muestra todo");
      return null;
    }
    
    console.log("Usuario sin roles específicos o sucursales asignadas");
    return [];
  }, [userStores, hasStores, hasRole]);

  // Obtener producto por ID
  const getProductById = (id: string) => 
    products.find((product) => product.id === id);

  // Cargar datos de productos, categorías y tiendas
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
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setError(error.message || "Error al cargar productos");
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  // Operaciones de CRUD de productos
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
      const completeProductData = {
        ...productData,
        color: productData.color || null,
        talla: productData.talla || null
      };
      
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
  }, [storesLoading]);

  // Aplicar filtros para productos
  const { filteredProducts } = useProductsFiltering({
    products,
    searchTerm,
    categoryFilter,
    storeFilter,
    getUserStoreIds
  });
  
  // Filtrar tiendas según el rol del usuario
  const accessibleStores = useMemo(() => {
    if (hasRole('admin') || hasRole('manager')) return stores;
    if (hasRole('sales') && hasStores) return userStores;
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
