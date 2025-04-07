import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Store } from "@/types/inventory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, RefreshCw, Edit, Trash2, Store as StoreIcon, MapPin } from "lucide-react";

const storeSchema = z.object({
  nombre: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  direccion: z.string().optional()
});

interface StoresViewProps {
  onRefresh?: () => void;
}

export function StoresView({ onRefresh }: StoresViewProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const addForm = useForm<z.infer<typeof storeSchema>>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      nombre: "",
      direccion: ""
    }
  });

  const editForm = useForm<z.infer<typeof storeSchema>>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      nombre: "",
      direccion: ""
    }
  });

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("almacenes")
        .select("*")
        .order("nombre");
      
      if (error) throw error;
      
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast.error("Error al cargar sucursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleAddStore = async (data: z.infer<typeof storeSchema>) => {
    try {
      const { error } = await supabase
        .from("almacenes")
        .insert([{ 
          nombre: data.nombre,
          direccion: data.direccion || null
        }]);
      
      if (error) throw error;
      
      toast.success("Sucursal creada correctamente");
      addForm.reset();
      setIsAddDialogOpen(false);
      fetchStores();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error adding store:", error);
      toast.error("Error al crear sucursal");
    }
  };

  const handleEditStore = async (data: z.infer<typeof storeSchema>) => {
    if (!currentStore) return;
    
    try {
      const { error } = await supabase
        .from("almacenes")
        .update({ 
          nombre: data.nombre,
          direccion: data.direccion || null
        })
        .eq("id", currentStore.id);
      
      if (error) throw error;
      
      toast.success("Sucursal actualizada correctamente");
      editForm.reset();
      setIsEditDialogOpen(false);
      setCurrentStore(null);
      fetchStores();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error updating store:", error);
      toast.error("Error al actualizar sucursal");
    }
  };

  const handleDeleteStore = async () => {
    if (!currentStore) return;
    
    try {
      // Check if the store is being used in inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventario")
        .select("id")
        .eq("almacen_id", currentStore.id)
        .limit(1);
      
      if (inventoryError) throw inventoryError;
      
      if (inventoryData && inventoryData.length > 0) {
        toast.error("No se puede eliminar la sucursal porque tiene inventario asociado");
        return;
      }
      
      const { error } = await supabase
        .from("almacenes")
        .delete()
        .eq("id", currentStore.id);
      
      if (error) throw error;
      
      toast.success("Sucursal eliminada correctamente");
      setIsDeleteDialogOpen(false);
      setCurrentStore(null);
      fetchStores();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting store:", error);
      toast.error("Error al eliminar sucursal");
    }
  };

  const openEditDialog = (store: Store) => {
    setCurrentStore(store);
    editForm.reset({ 
      nombre: store.nombre,
      direccion: store.direccion || ""
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (store: Store) => {
    setCurrentStore(store);
    setIsDeleteDialogOpen(true);
  };

  const filteredStores = stores.filter(store => 
    store.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.direccion && store.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Input
          type="search"
          placeholder="Buscar sucursales..."
          className="w-full sm:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStores}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sucursal
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredStores.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No se encontraron sucursales. Añada una nueva para comenzar.
            </div>
          ) : (
            filteredStores.map((store) => (
              <Card key={store.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <StoreIcon className="h-4 w-4" />
                        {store.nombre}
                      </CardTitle>
                      {store.direccion && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {store.direccion}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="pt-2 flex justify-end">
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(store)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(store)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add Store Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Nueva Sucursal</DialogTitle>
            <DialogDescription>
              Introduce los detalles para la nueva sucursal.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddStore)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la sucursal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección de la sucursal" {...field} />
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

      {/* Edit Store Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sucursal</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la sucursal.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditStore)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la sucursal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Dirección de la sucursal" {...field} value={field.value || ""} />
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

      {/* Delete Store Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Sucursal</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta sucursal? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteStore}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
