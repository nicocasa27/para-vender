import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronDown, 
  MoreHorizontal, 
  Search,
  Package,
  Filter,
  Plus,
  Edit,
  Trash,
  FileText,
  Check,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ProductWithStock {
  id: string;
  nombre: string;
  categoria: string;
  categoria_id: string;
  unidad: string;
  unidad_id: string;
  precio_compra: number;
  precio_venta: number;
  stock: {
    [key: string]: number;
  };
  stock_minimo: number;
  stock_maximo: number;
}

export const ProductTable = () => {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [stores, setStores] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStore, setSelectedStore] = useState("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [newStockQuantity, setNewStockQuantity] = useState(0);
  const [selectedStockWarehouse, setSelectedStockWarehouse] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categorias")
          .select("id, nombre");
        
        if (categoriesError) throw categoriesError;
        
        const formattedCategories = [
          { id: "all", name: "Todas las Categorías" },
          ...categoriesData.map(cat => ({ id: cat.id, name: cat.nombre }))
        ];
        setCategories(formattedCategories);
        
        const { data: storesData, error: storesError } = await supabase
          .from("almacenes")
          .select("id, nombre");
        
        if (storesError) throw storesError;
        
        const formattedStores = [
          { id: "all", name: "Todos los Almacenes" },
          ...storesData.map(store => ({ id: store.id, name: store.nombre }))
        ];
        setStores(formattedStores);
        
        const { data: productsData, error: productsError } = await supabase
          .from("productos")
          .select(`
            id, nombre, precio_compra, precio_venta, stock_minimo, stock_maximo,
            categoria_id, categorias(nombre),
            unidad_id, unidades(nombre)
          `);
        
        if (productsError) throw productsError;
        
        const productsWithStock = await Promise.all(
          productsData.map(async (product) => {
            const { data: inventoryData, error: inventoryError } = await supabase
              .from("inventario")
              .select(`
                cantidad,
                almacen_id,
                almacenes(id, nombre)
              `)
              .eq("producto_id", product.id);
            
            if (inventoryError) throw inventoryError;
            
            const stockByStore: {[key: string]: number} = {};
            inventoryData.forEach(item => {
              if (item.almacenes) {
                stockByStore[item.almacenes.nombre] = item.cantidad;
              }
            });
            
            return {
              id: product.id,
              nombre: product.nombre,
              categoria: product.categorias ? product.categorias.nombre : "Sin categoría",
              categoria_id: product.categoria_id,
              unidad: product.unidades ? product.unidades.nombre : "Unidad",
              unidad_id: product.unidad_id,
              precio_compra: product.precio_compra,
              precio_venta: product.precio_venta,
              stock: stockByStore,
              stock_minimo: product.stock_minimo,
              stock_maximo: product.stock_maximo,
            };
          })
        );
        
        setProducts(productsWithStock);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Intente nuevamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error: inventoryError } = await supabase
        .from("inventario")
        .delete()
        .eq("producto_id", id);
      
      if (inventoryError) throw inventoryError;
      
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      setProducts(prev => prev.filter(product => product.id !== id));
      
      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: ProductWithStock) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleStockUpdate = (product: ProductWithStock) => {
    setSelectedProduct(product);
    setNewStockQuantity(0);
    setSelectedStockWarehouse("");
    setIsStockDialogOpen(true);
  };

  const saveStockUpdate = async () => {
    if (!selectedProduct || !selectedStockWarehouse || newStockQuantity <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingrese una cantidad válida y seleccione un almacén.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: existingInventory, error: checkError } = await supabase
        .from("inventario")
        .select("id, cantidad")
        .eq("producto_id", selectedProduct.id)
        .eq("almacen_id", selectedStockWarehouse)
        .maybeSingle();

      if (checkError) throw checkError;

      const
