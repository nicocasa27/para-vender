
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Category } from "@/types/inventory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, RefreshCw, Edit, Trash2 } from "lucide-react";

const categorySchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" })
});

interface CategoriesViewProps {
  onRefresh?: () => void;
}

export function CategoriesView({ onRefresh }: CategoriesViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const addForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: ""
    }
  });

  const editForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre: ""
    }
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (data: z.infer<typeof categorySchema>) => {
    try {
      const { error } = await supabase
        .from("categorias")
        .insert([{ nombre: data.nombre }]);
      
      if (error) throw error;
      
      toast.success("Categoría creada correctamente");
      addForm.reset();
      setIsAddDialogOpen(false);
      fetchCategories();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Error al crear categoría");
    }
  };

  const handleEditCategory = async (data: z.infer<typeof categorySchema>) => {
    if (!currentCategory) return;
    
    try {
      const { error } = await supabase
        .from("categorias")
        .update({ nombre: data.nombre })
        .eq("id", currentCategory.id);
      
      if (error) throw error;
      
      toast.success("Categoría actualizada correctamente");
      editForm.reset();
      setIsEditDialogOpen(false);
      setCurrentCategory(null);
      fetchCategories();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Error al actualizar categoría");
    }
  };

  const handleDeleteCategory = async () => {
    if (!currentCategory) return;
    
    try {
      // Check if the category is being used
      const { data: products, error: productsError } = await supabase
        .from("productos")
        .select("id")
        .eq("categoria_id", currentCategory.id)
        .limit(1);
      
      if (productsError) throw productsError;
      
      if (products && products.length > 0) {
        toast.error("No se puede eliminar la categoría porque está siendo utilizada por productos");
        return;
      }
      
      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", currentCategory.id);
      
      if (error) throw error;
      
      toast.success("Categoría eliminada correctamente");
      setIsDeleteDialogOpen(false);
      setCurrentCategory(null);
      fetchCategories();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error al eliminar categoría");
    }
  };

  const openEditDialog = (category: Category) => {
    setCurrentCategory(category);
    editForm.reset({ nombre: category.nombre });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const filteredCategories = categories.filter(category => 
    category.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Input
          type="search"
          placeholder="Buscar categorías..."
          className="w-full sm:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCategories}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No se encontraron categorías. Añada una nueva para comenzar.
            </div>
          ) : (
            filteredCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category.nombre}</CardTitle>
                </CardHeader>
                <CardFooter className="pt-2 flex justify-end">
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(category)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Nueva Categoría</DialogTitle>
            <DialogDescription>
              Introduce el nombre para la nueva categoría.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddCategory)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la categoría" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica el nombre de la categoría.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditCategory)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la categoría" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Actualizar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
