
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { Product } from "@/types/inventory";
import { toast } from "sonner";

export function useProductsView(onRefresh?: () => void) {
  const {
    products,
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
    deleteProduct
  } = useProducts();

  const { categories: metadataCategories, hasMetadata } = useProductMetadata();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productDetailId, setProductDetailId] = useState<string | null>(null);

  // Asegura que los datos estén actualizados cuando se abre el componente
  useEffect(() => {
    if (!loading) {
      console.log("useProductsView - Datos de productos cargados:", products.length);
    }
  }, [loading, products]);

  const handleAddProduct = async (productData: any) => {
    try {
      console.log("Agregando producto con datos:", productData);
      await addProduct(productData);
      toast.success("Producto agregado exitosamente");
      setIsAddModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error al añadir producto:", error);
      toast.error("Error al añadir producto", {
        description: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  };

  const handleEditProduct = async (productData: any) => {
    if (!currentProduct) {
      toast.error("No hay producto seleccionado para editar");
      return;
    }
    
    try {
      const dataWithId = {
        ...productData,
        id: currentProduct.id
      };
      
      console.log("🔄 ProductsView.handleEditProduct: Datos enviados:", dataWithId);
      toast.info("Iniciando proceso de actualización...");
      
      await editProduct(dataWithId);
      
      toast.success("Producto actualizado exitosamente");
      setIsEditModalOpen(false);
      setCurrentProduct(null);
      
      // Refrescar productos después de editar
      await refreshProducts();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error al editar producto:", error);
      toast.error("Error al editar producto", {
        description: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return;
    
    try {
      const success = await deleteProduct(deleteProductId);
      if (success) {
        setDeleteProductId(null);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      toast.error("Error al eliminar producto");
    }
  };

  const openEditModal = (product: Product) => {
    console.log("🔍 openEditModal - Producto seleccionado:", product);
    console.log("🔍 Stock del producto:", product.stock_total);
    console.log("🔍 Stock por tienda:", product.stock_by_store);
    setCurrentProduct(product);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (productId: string) => {
    setSelectedProductId(productId);
    setIsHistoryOpen(true);
  };

  const handleRefresh = async () => {
    console.log("Actualizando lista de productos...");
    await refreshProducts();
    if (onRefresh) onRefresh();
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Sin categoría";
    const category = categories.find(c => c.id === categoryId);
    if (category) return category.nombre;
    
    const metadataCategory = metadataCategories.find(c => c.id === categoryId);
    return metadataCategory ? metadataCategory.nombre : "Sin categoría";
  };

  const getStoreName = () => {
    if (!storeFilter) return "Todas las sucursales";
    const store = stores.find(s => s.id === storeFilter);
    return store ? store.nombre : "Sucursal";
  };

  return {
    products,
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
    isAddModalOpen,
    setIsAddModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    currentProduct,
    setCurrentProduct,
    deleteProductId,
    setDeleteProductId,
    isHistoryOpen,
    setIsHistoryOpen,
    selectedProductId,
    setSelectedProductId,
    productDetailId,
    setProductDetailId,
    handleAddProduct,
    handleEditProduct,
    handleDeleteConfirm,
    openEditModal,
    handleViewHistory,
    handleRefresh,
    getCategoryName,
    getStoreName,
    hasMetadata
  };
}
