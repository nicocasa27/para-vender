
import { useState } from "react";
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

  const handleAddProduct = async (productData: any) => {
    try {
      await addProduct(productData);
      setIsAddModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error al añadir producto:", error);
      toast.error("Error al añadir producto");
    }
  };

  const handleEditProduct = async (productData: any) => {
    if (!currentProduct) return;
    
    try {
      console.log("Datos del formulario para editar:", productData);
      
      // Asegurarse de que el ID del producto esté incluido
      await editProduct({
        ...productData,
        id: currentProduct.id
      });
      
      setIsEditModalOpen(false);
      setCurrentProduct(null);
      
      // Refrescar la lista de productos
      await refreshProducts();
      if (onRefresh) onRefresh();
      
      toast.success("Producto actualizado correctamente");
    } catch (error) {
      console.error("Error al editar producto:", error);
      toast.error("Error al editar producto");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return;
    const success = await deleteProduct(deleteProductId);
    if (success) {
      setDeleteProductId(null);
      if (onRefresh) onRefresh();
    }
  };

  const openEditModal = (product: Product) => {
    // Actualizamos el producto antes de abrir el modal para asegurarnos de tener la última versión
    console.log("Abriendo modal de edición para producto:", product);
    console.log("Stock actual del producto:", product.stock_total);
    setCurrentProduct(product);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (productId: string) => {
    setSelectedProductId(productId);
    setIsHistoryOpen(true);
  };

  const handleRefresh = async () => {
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

  // Obtener el stock actual del producto en edición
  const getCurrentStock = () => {
    if (!currentProduct) return 0;
    return currentProduct.stock_total || 0;
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
    getCurrentStock,
    hasMetadata
  };
}
