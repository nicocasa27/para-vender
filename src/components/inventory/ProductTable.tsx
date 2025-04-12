
import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import ProductTableHeader from "./ProductTableHeader";
import { ProductTableBody } from "./ProductTableBody";
import { ProductModal } from "./ProductModal";
import { DeleteProductDialog } from "./DeleteProductDialog";
import { ProductHistorySheet } from "./ProductHistorySheet";
import { Product } from "@/types/inventory";
import { useAuth } from "@/contexts/auth";

const ProductTable = () => {
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

  const { hasRole } = useAuth();
  const canViewPurchasePrice = !hasRole('sales') || hasRole('admin') || hasRole('manager');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleAddProduct = async (productData: any) => {
    await addProduct(productData);
    setIsAddModalOpen(false);
  };

  const handleEditProduct = async (productData: any) => {
    if (!currentProduct) return;
    await editProduct({
      ...productData,
      id: currentProduct.id
    });
    setIsEditModalOpen(false);
    setCurrentProduct(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return;
    const success = await deleteProduct(deleteProductId);
    if (success) {
      setDeleteProductId(null);
    }
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (productId: string) => {
    setSelectedProductId(productId);
    setIsHistoryOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProductTableHeader
        onAddProduct={() => setIsAddModalOpen(true)}
        onRefresh={refreshProducts}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        storeFilter={storeFilter}
        setStoreFilter={setStoreFilter}
        categories={categories}
        stores={stores}
      />

      <ProductTableBody
        products={products}
        onViewHistory={handleViewHistory}
        onEditProduct={openEditModal}
        onDeleteProduct={setDeleteProductId}
        selectedStore={storeFilter}
        canViewPurchasePrice={canViewPurchasePrice}
      />

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
            id: currentProduct.id,
            name: currentProduct.nombre,
            purchasePrice: currentProduct.precio_compra,
            salePrice: currentProduct.precio_venta,
            category: currentProduct.categoria_id,
            unit: currentProduct.unidad_id,
            minStock: currentProduct.stock_minimo,
            maxStock: currentProduct.stock_maximo
          }}
          isEditing
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
    </div>
  );
};

export default ProductTable;
