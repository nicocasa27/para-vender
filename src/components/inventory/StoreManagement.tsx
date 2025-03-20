
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Edit, Trash, MapPin, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface StoreData {
  id: string;
  nombre: string;
  direccion: string | null;
}

const storeFormSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre de la sucursal debe tener al menos 2 caracteres.",
  }),
  direccion: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

export function StoreManagement() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);
  const { toast } = useToast();

  const addForm = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
    }
  });

  const editForm = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
    }
  });

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore && isEditDialogOpen) {
      editForm.reset({
        nombre: selectedStore.nombre,
        direccion: selectedStore.direccion || "",
      });
    }
  }, [selectedStore, isEditDialogOpen, editForm]);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("almacenes")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sucursales.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStore = async (data: StoreFormValues) => {
    try {
      const { error } = await supabase
        .from("almacenes")
        .insert({
          nombre: data.nombre,
          direccion: data.direccion || null,
        });

      if (error) throw error;

      toast({
        title: "Sucursal agregada",
        description: "La sucursal ha sido agregada correctamente.",
      });

      addForm.reset();
      setIsAddDialogOpen(false);
      fetchStores();
    } catch (error) {
      console.error("Error adding store:", error);
      toast({
        title: "Error",
        description: "No se pudo agregar la sucursal.",
        variant: "destructive",
      });
    }
  };

  const handleEditStore = async (data: StoreFormValues) => {
    if (!selectedStore) return;
    
    try {
      const { error } = await supabase
        .from("almacenes")
        .update({
          nombre: data.nombre,
          direccion: data.direccion || null,
        })
        .eq("id", selectedStore.id);

      if (error) throw error;

      toast({
        title: "Sucursal actualizada",
        description: "La sucursal ha sido actualizada correctamente.",
      });

      editForm.reset();
      setIsEditDialogOpen(false);
      setSelectedStore(null);
      fetchStores();
    } catch (error) {
      console.error("Error updating store:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la sucursal.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStore = async (id: string) => {
    // First check if there's inventory in this store
    try {
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventario")
        .select("id")
        .eq("almacen_id", id)
        .limit(1);
      
      if (inventoryError) throw inventoryError;
      
      if (inventoryData && inventoryData.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: "Esta sucursal tiene inventario asociado. Traslade el inventario antes de eliminar.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if there are pending transfers
      const { data: transfersData, error: transfersError } = await supabase
        .from("movimientos")
        .select("id")
        .or(`almacen_origen_id.eq.${id},almacen_destino_id.eq.${id}`)
        .limit(1);
      
      if (transfersError) throw transfersError;
      
      if (transfersData && transfersData.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: "Esta sucursal tiene movimientos de inventario asociados.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if there are sales at this store
      const { data: salesData, error: salesError } = await supabase
        .from("ventas")
        .select("id")
        .eq("almacen_id", id)
        .limit(1);
      
      if (salesError) throw salesError;
      
      if (salesData && salesData.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: "Esta sucursal tiene ventas registradas.",
          variant: "destructive",
        });
        return;
      }
      
      // If no associations, proceed with deletion
      const { error } = await supabase
        .from("almacenes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucursal eliminada",
        description: "La sucursal ha sido eliminada correctamente.",
      });

      fetchStores();
    } catch (error) {
      console.error("Error deleting store:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la sucursal.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Gestión de Sucursales</h3>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Sucursal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Sucursal</DialogTitle>
                <DialogDescription>
                  Complete los detalles de la sucursal. Haga clic en guardar cuando termine.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(handleAddStore)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Sucursal</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingrese el nombre" {...field} />
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
                          <Input placeholder="Ingrese la dirección" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <p className="mt-2 text-sm">Cargando sucursales...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : stores.length > 0 ? (
                stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        <span>{store.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {store.direccion ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{store.direccion}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No disponible</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedStore(store);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteStore(store.id)}
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Store className="h-10 w-10 mb-2" />
                      <p className="text-base">No hay sucursales registradas</p>
                      <p className="text-sm">
                        Haga clic en "Agregar Sucursal" para crear una nueva
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Sucursal</DialogTitle>
            <DialogDescription>
              Modifique los detalles de la sucursal. Haga clic en actualizar cuando termine.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditStore)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Sucursal</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el nombre" {...field} />
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
                      <Input placeholder="Ingrese la dirección" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Actualizar</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
