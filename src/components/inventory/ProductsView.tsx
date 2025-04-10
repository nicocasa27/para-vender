import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { Product } from "@/types/inventory";
import { ProductsSearchBar } from "@/components/inventory/products/ProductsSearchBar";
import { StoreFilterNotice } from "@/components/inventory/products/StoreFilterNotice";
import { ProductCard } from "@/components/inventory/products/ProductCard";
import { ProductDetailDialog } from "@/components/inventory/products/ProductDetailDialog";
import { ProductsStateDisplay } from "@/components/inventory/products/ProductsStateDisplay";
import { ProductModal } from "@/components/inventory/ProductModal";
import { DeleteProductDialog } from "@/components/inventory/DeleteProductDialog";
import { ProductHistorySheet } from "@/components/ProductHistorySheet";
import { toast } from "sonner";
import { formatQuantityWithUnit } from "@/utils/inventory/formatters";

interface ProductsViewProps {
  onRefresh?: () => void;
}

export function ProductsView({ onRefresh }: ProductsViewProps) {
  const {
    products,
    categories,
    stores,
    loading,
    searchTerm,
    setSearchTerm,
    storeFilter,
    refreshProducts,
    addProduct,
    editProduct,
    deleteProduct
  } = useProducts();

  const { categories: metadataCategories, units, hasMetadata, isLoading: metadataLoading } = useProductMetadata();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productDetailId, setProductDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasMetadata && !metadataLoading) {
      toast.error("Faltan datos básicos", {
        description: "No se pueden cargar categorías o unidades. Se intentarán crear valores por defecto."
      });
    }
  }, [hasMetadata, metadataLoading]);

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
      await editProduct({
        ...productData,
        id: currentProduct.id
      });
      
      setIsEditModalOpen(false);
      setCurrentProduct(null);
      if (onRefresh) onRefresh();
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
    setCurrentProduct(product);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (productId: string) => {
    setSelectedProductId(productId);
    setIsHistoryOpen(true);
  };

  const handleRefresh = () => {
    refreshProducts();
    if (onRefresh) onRefresh();
  };

  const getProductStoreName = (product: Product) => {
    return product.sucursal_nombre || 'Sin sucursal';
  };

  const getStockStatusColor = (product: Product) => {
    if (!product.stock_minimo) return "bg-green-100 text-green-800";
    if (product.stock_total <= product.stock_minimo) return "bg-red-100 text-red-800";
    if (product.stock_maximo && product.stock_total >= product.stock_maximo) return "bg-amber-100 text-amber-800";
    return "bg-green-100 text-green-800";
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Sin categoría";
    const category = categories.find(c => c.id === categoryId);
    if (category) return category.nombre;
    
    const metadataCategory = metadataCategories.find(c => c.id === categoryId);
    return metadataCategory ? metadataCategory.nombre : "Sin categoría";
  };

  const getDisplayStock = (product: Product) => {
    if (storeFilter && product.stock_by_store && product.stock_by_store[storeFilter] !== undefined) {
      return formatQuantityWithUnit(product.stock_by_store[storeFilter], product.unidad);
    }
    return formatQuantityWithUnit(product.stock_total, product.unidad);
  };

  const getStoreName = () => {
    if (!storeFilter) return "Todas las sucursales";
    const store = stores.find(s => s.id === storeFilter);
    return store ? store.nombre : "Sucursal";
  };

  return (
    <div className="space-y-4">
      <ProductsSearchBar
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              getCategoryName={getCategoryName}
              getStockStatusColor={getStockStatusColor}
              getDisplayStock={getDisplayStock}
              getProductStoreName={getProductStoreName}
              onViewDetail={setProductDetailId}
              onViewHistory={handleViewHistory}
              onEdit={openEditModal}
              onDelete={setDeleteProductId}
            />
          ))}
        </div>
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
