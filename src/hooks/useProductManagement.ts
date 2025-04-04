
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product, Category, Store } from "@/types/inventory";

export function useProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadStores();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('productos')
        .select(`
          id, 
          nombre, 
          precio_venta,
          precio_compra,
          stock_minimo,
          stock_maximo,
          categoria_id,
          categorias(nombre),
          unidad_id,
          unidades(nombre)
        `);

      if (productsError) {
        throw productsError;
      }

      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventario')
        .select(`
          producto_id, 
          cantidad, 
          almacen_id, 
          almacenes(nombre)
        `);
        
      if (inventoryError) {
        throw inventoryError;
      }
      
      const productsWithStock: Product[] = productsData.map(product => {
        const productInventory = inventoryData.filter(item => item.producto_id === product.id);
        
        const stockTotal = productInventory.reduce((sum, item) => sum + Number(item.cantidad), 0);
        
        const stockByStore: {[key: string]: number} = {};
        const storeNames: {[key: string]: string} = {};
        
        productInventory.forEach(item => {
          stockByStore[item.almacen_id] = Number(item.cantidad);
          if (item.almacenes) {
            storeNames[item.almacen_id] = item.almacenes.nombre;
          }
        });
          
        return {
          id: product.id,
          nombre: product.nombre,
          precio_venta: Number(product.precio_venta),
          precio_compra: Number(product.precio_compra),
          stock_total: stockTotal,
          stock_by_store: stockByStore,
          store_names: storeNames,
          categoria_id: product.categoria_id,
          categoria: product.categorias?.nombre || "Sin categoría",
          unidad_id: product.unidad_id,
          unidad: product.unidades?.nombre || "Unidad",
          stock_minimo: Number(product.stock_minimo),
          stock_maximo: Number(product.stock_maximo)
        };
      });

      setProducts(productsWithStock);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Error al cargar productos", {
        description: "No se pudieron cargar los productos"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nombre');
      
      if (error) throw error;
      setCategories(data.filter(category => !!category.id && !!category.nombre));
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Error al cargar categorías", {
        description: "No se pudieron cargar las categorías"
      });
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('almacenes')
        .select('id, nombre');
      
      if (error) throw error;
      setStores(data.filter(store => !!store.id && !!store.nombre));
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Error al cargar sucursales", {
        description: "No se pudieron cargar las sucursales"
      });
    }
  };

  const addProduct = async (productData: any) => {
    try {
      console.log("Adding product:", productData);
      
      if (!productData.name || !productData.category || !productData.unit) {
        toast.error("Datos incompletos", {
          description: "Por favor complete todos los campos obligatorios"
        });
        return;
      }
      
      const { data: newProduct, error: productError } = await supabase
        .from('productos')
        .insert([{
          nombre: productData.name,
          precio_compra: productData.purchasePrice || 0,
          precio_venta: productData.salePrice || 0,
          categoria_id: productData.category,
          unidad_id: productData.unit,
          stock_minimo: productData.minStock || 0,
          stock_maximo: productData.maxStock || 0
        }])
        .select('id')
        .single();

      if (productError) {
        console.error("Error inserting product:", productError);
        throw productError;
      }

      console.log("Product added successfully:", newProduct);

      if (productData.initialStock > 0 && productData.warehouse) {
        const { error: inventoryError } = await supabase
          .from('inventario')
          .insert([{
            producto_id: newProduct.id,
            almacen_id: productData.warehouse,
            cantidad: productData.initialStock
          }]);

        if (inventoryError) {
          console.error("Error inserting inventory:", inventoryError);
          throw inventoryError;
        }

        const { error: movementError } = await supabase
          .from('movimientos')
          .insert([{
            tipo: 'entrada',
            producto_id: newProduct.id,
            almacen_destino_id: productData.warehouse,
            cantidad: productData.initialStock,
            notas: 'Stock inicial'
          }]);
          
        if (movementError) {
          console.error("Error registering movement:", movementError);
        }
      }

      toast.success("Producto agregado", {
        description: `${productData.name} ha sido agregado correctamente`
      });
      
      loadProducts();
      return true;
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Error al agregar producto", {
        description: "No se pudo guardar el producto"
      });
      return false;
    }
  };

  const updateProduct = async (productId: string, productData: any) => {
    try {
      console.log("Updating product:", productData);
      
      if (!productData.name || !productData.category || !productData.unit) {
        toast.error("Datos incompletos", {
          description: "Por favor complete todos los campos obligatorios"
        });
        return false;
      }
      
      const { error: productError } = await supabase
        .from('productos')
        .update({
          nombre: productData.name,
          precio_compra: productData.purchasePrice || 0,
          precio_venta: productData.salePrice || 0,
          categoria_id: productData.category,
          unidad_id: productData.unit,
          stock_minimo: productData.minStock || 0,
          stock_maximo: productData.maxStock || 0
        })
        .eq('id', productId);

      if (productError) {
        console.error("Error updating product:", productError);
        throw productError;
      }

      toast.success("Producto actualizado", {
        description: `${productData.name} ha sido actualizado correctamente`
      });
      
      loadProducts();
      return true;
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Error al actualizar producto", {
        description: "No se pudo actualizar el producto"
      });
      return false;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error: inventoryError } = await supabase
        .from('inventario')
        .delete()
        .eq('producto_id', productId);

      if (inventoryError) throw inventoryError;

      const { error: productError } = await supabase
        .from('productos')
        .delete()
        .eq('id', productId);

      if (productError) throw productError;

      toast.success("Producto eliminado", {
        description: "El producto ha sido eliminado correctamente"
      });
      
      loadProducts();
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar producto", {
        description: "No se pudo eliminar el producto"
      });
      return false;
    }
  };

  return {
    products,
    loading,
    categories,
    stores,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
}
