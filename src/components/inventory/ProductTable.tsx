
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProductModal } from "./ProductModal";
import { Product } from "@/types/inventory";
import { useProductManagement } from "@/hooks/useProductManagement";
import ProductFilters from "./ProductFilters";
import ProductList from "./ProductList";
import DeleteProductDialog from "./DeleteProductDialog";
import MovementHistoryPanel from "./MovementHistoryPanel";

const ProductTable = () => {
  const { 
    products, 
    loading, 
    categories, 
    stores, 
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct
  } = useProductManagement();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all-categories");
  const [storeFilter, setStoreFilter] = useState<string>("all-stores");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleAddProduct = async (productData: any) => {
    const success = await addProduct(productData);
    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const handleEditProduct = async (productData: any) => {
    if (!currentProduct) return;
    
    const success = await updateProduct(currentProduct.id, productData);
    if (success) {
      setIsEditModalOpen(false);
      setCurrentProduct(null);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;
    
    const success = await deleteProduct(deleteProductId);
    if (success) {
      setDeleteProductId(null);
    }
  };

  const handleViewHistory = (productId: string) => {
    setSelectedProductId(productId);
    setIsHistoryOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all-categories" || product.categoria_id === categoryFilter;
    const matchesStore = storeFilter === "all-stores" || product.stock_by_store?.[storeFilter] !== undefined;
    
    return matchesSearch && matchesCategory && matchesStore;
  });

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold">Productos</h2>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Producto
          </Button>
          <Button variant="outline" onClick={loadProducts}>
            Actualizar
          </Button>
        </div>
      </div>

      <ProductFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        storeFilter={storeFilter}
        setStoreFilter={setStoreFilter}
        categories={categories}
        stores={stores}
      />

      <ProductList
        products={filteredProducts}
        onView={handleViewHistory}
        onEdit={(product) => {
          setCurrentProduct(product);
          setIsEditModalOpen(true);
        }}
        onDelete={(productId) => setDeleteProductId(productId)}
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
        onClose={() => setDeleteProductId(null)}
        onConfirm={confirmDeleteProduct}
      />

      <MovementHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        productId={selectedProductId}
      />
    </div>
  );
};

export default ProductTable;
