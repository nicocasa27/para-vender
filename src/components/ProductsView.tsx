
import { useState, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useProductMetadata } from "@/hooks/useProductMetadata";
import { Product } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, RefreshCw, Search, Edit, Trash2, History } from "lucide-react";
import { ProductHistorySheet } from "@/components/ProductHistorySheet";
import { toast } from "sonner";
import { ProductModal } from "@/components/inventory/ProductModal";
import { DeleteProductDialog } from "@/components/inventory/DeleteProductDialog";
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
      toast.info("Iniciando proceso de agregar producto...");
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
    console.log("🔑 openEditModal - ID del producto:", product.id);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const getProductDetail = (id: string) => {
    return products.find(p => p.id === id) || null;
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No se encontraron productos. Añada uno nuevo para comenzar.
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium line-clamp-2">{product.nombre}</CardTitle>
                  <Badge variant="outline" className={getStockStatusColor(product)}>
                    {formatQuantityWithUnit(product.stock_total, product.unidad)}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getCategoryName(product.categoria_id)}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Precio compra:</div>
                    <div className="font-medium">${product.precio_compra?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Precio venta:</div>
                    <div className="font-medium">${product.precio_venta.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setProductDetailId(product.id)}
                >
                  Ver detalle
                </Button>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleViewHistory(product.id)}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openEditModal(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setDeleteProductId(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

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
          isEditing={true}
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

      {productDetailId && (
        <Dialog 
          open={!!productDetailId} 
          onOpenChange={(open) => !open && setProductDetailId(null)}
        >
          <DialogContent className="max-w-2xl">
            {(() => {
              const product = getProductDetail(productDetailId);
              if (!product) return null;
              
              return (
                <>
                  <DialogHeader>
                    <DialogTitle>{product.nombre}</DialogTitle>
                    <DialogDescription>
                      Información detallada del producto
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Información General</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Categoría:</span>
                          <span>{getCategoryName(product.categoria_id)}</span>
                        </div>
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Unidad:</span>
                          <span>{product.unidad || "Unidad"}</span>
                        </div>
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Precio compra:</span>
                          <span>${product.precio_compra?.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Precio venta:</span>
                          <span>${product.precio_venta.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Inventario</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Stock total:</span>
                          <span>{formatQuantityWithUnit(product.stock_total, product.unidad)}</span>
                        </div>
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Stock mínimo:</span>
                          <span>{formatQuantityWithUnit(product.stock_minimo, product.unidad)}</span>
                        </div>
                        <div className="grid grid-cols-2 text-sm">
                          <span className="text-muted-foreground">Stock máximo:</span>
                          <span>{formatQuantityWithUnit(product.stock_maximo, product.unidad)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm mb-2">Inventario por Sucursal</h4>
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {product.stock_by_store && Object.keys(product.stock_by_store).length > 0 ? (
                          Object.entries(product.stock_by_store).map(([storeId, quantity]) => (
                            <div key={storeId} className="grid grid-cols-2 text-sm">
                              <span className="text-muted-foreground">
                                {product.store_names?.[storeId] || storeId}:
                              </span>
                              <span>{formatQuantityWithUnit(quantity, product.unidad)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No hay inventario disponible en ninguna sucursal.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setProductDetailId(null)}
                    >
                      Cerrar
                    </Button>
                    <Button onClick={() => {
                      openEditModal(product);
                      setProductDetailId(null);
                    }}>
                      Editar
                    </Button>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
