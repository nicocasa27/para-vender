
import { useEffect } from "react";
import { toast } from "sonner";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { ProductToolbar } from "@/components/inventory/products/ProductToolbar";
import { ProductCardList } from "@/components/inventory/products/ProductCardList";
import { StoreFilterNotice } from "@/components/inventory/products/StoreFilterNotice";
import { ProductsStateDisplay } from "@/components/inventory/products/ProductsStateDisplay";
import { ProductModal } from "@/components/inventory/ProductModal";
import { DeleteProductDialog } from "@/components/inventory/DeleteProductDialog";
import { ProductHistorySheet } from "@/components/ProductHistorySheet";
import { ProductDetailDialog } from "@/components/inventory/products/ProductDetailDialog";
import { useProductsView } from "@/hooks/useProductsView";
import { getStockStatusColor, getDisplayStock, getProductStoreName } from "@/components/inventory/products/ProductUtils";

interface ProductsViewProps {
  onRefresh?: () => void;
}

export function ProductsView({ onRefresh }: ProductsViewProps) {
  const {
    products,
    loading,
    searchTerm,
    setSearchTerm,
    storeFilter,
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
  } = useProductsView(onRefresh);

  const { isLoading: metadataLoading } = useProductMetadata();

  useEffect(() => {
    if (!hasMetadata && !metadataLoading) {
      toast.error("Faltan datos básicos", {
        description: "No se pueden cargar categorías o unidades. Se intentarán crear valores por defecto."
      });
    }
  }, [hasMetadata, metadataLoading]);

  // Obtener el stock actual del producto en edición
  const getCurrentStock = () => {
    if (!currentProduct) return 0;
    return currentProduct.stock_total || 0;
  };

  return (
    <div className="space-y-4">
      <ProductToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={handleRefresh}
        onAddNew={() => setIsAddModalOpen(true)}
      />

      <StoreFilterNotice 
        storeFilter={storeFilter} 
        getStoreName={getStoreName} 
      />

      <ProductsStateDisplay 
        loading={loading} 
        isEmpty={products.length === 0} 
      />

      {!loading && products.length > 0 && (
        <ProductCardList
          products={products}
          getCategoryName={getCategoryName}
          getStockStatusColor={getStockStatusColor}
          getDisplayStock={(product) => getDisplayStock(product, storeFilter)}
          getProductStoreName={getProductStoreName}
          onViewDetail={setProductDetailId}
          onViewHistory={handleViewHistory}
          onEdit={openEditModal}
          onDelete={setDeleteProductId}
        />
      )}

      {isAddModalOpen && (
        <ProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddProduct}
        />
      )}

      {isEditModalOpen && currentProduct && (
        <ProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentProduct(null);
          }}
          onSubmit={handleEditProduct}
          initialData={{
            name: currentProduct.nombre,
            purchasePrice: currentProduct.precio_compra,
            salePrice: currentProduct.precio_venta,
            category: currentProduct.categoria_id,
            unit: currentProduct.unidad_id,
            minStock: currentProduct.stock_minimo,
            maxStock: currentProduct.stock_maximo,
            location: currentProduct.sucursal_id || "no-location",
            color: currentProduct.color || "",
            talla: currentProduct.talla || ""
          }}
          isEditing
          currentStock={getCurrentStock()}
        />
      )}

      <DeleteProductDialog 
        isOpen={deleteProductId !== null}
        onOpenChange={(open) => !open && setDeleteProductId(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ProductHistorySheet
        isOpen={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        productId={selectedProductId}
      />

      <ProductDetailDialog
        productId={productDetailId}
        products={products}
        getCategoryName={getCategoryName}
        getProductStoreName={getProductStoreName}
        onClose={() => setProductDetailId(null)}
        onEdit={(product) => {
          openEditModal(product);
          setProductDetailId(null);
        }}
      />
    </div>
  );
}
