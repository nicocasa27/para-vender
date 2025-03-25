
import { UserWithRoles } from "@/types/auth";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStores } from "@/hooks/useStores";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";

// Form schema with validation
const roleAssignmentSchema = z.object({
  userId: z.string().min(1, "Usuario es requerido"),
  role: z.enum(["admin", "manager", "sales", "viewer"] as const),
  almacenId: z.string().optional(),
});

type RoleAssignmentValues = z.infer<typeof roleAssignmentSchema>;

interface UserRoleFormProps {
  selectedUser: UserWithRoles | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserRoleForm({ selectedUser, onSuccess, onCancel }: UserRoleFormProps) {
  const { toast: uiToast } = useToast();
  const { stores } = useStores();
  const { handleError } = useSupabaseQuery();
  
  // Initialize form with default values
  const form = useForm<RoleAssignmentValues>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      userId: selectedUser?.id || "",
      role: "viewer",
      almacenId: "",
    },
  });

  // Current role from form state
  const currentRole = form.watch("role");
  const needsStore = currentRole === "sales";

  // Update form when selected user changes
  useEffect(() => {
    if (selectedUser) {
      form.setValue("userId", selectedUser.id);
    }
  }, [selectedUser, form]);

  const handleAddRole = async (values: RoleAssignmentValues) => {
    try {
      console.log("Adding role:", values);
      
      // Check if user already has this role
      if (selectedUser?.roles) {
        // For regular roles (not 'sales'), check if user already has this role type
        if (values.role !== 'sales') {
          const hasRole = selectedUser.roles.some(role => 
            role.role === values.role
          );
          
          if (hasRole) {
            toast.error("Error al asignar rol", {
              description: `El usuario ya tiene el rol de ${values.role}`
            });
            return;
          }
        } 
        // For 'sales' role, check if user already has this role for this specific store
        else if (values.almacenId) {
          const hasStoreRole = selectedUser.roles.some(role => 
            role.role === 'sales' && role.almacen_id === values.almacenId
          );
          
          if (hasStoreRole) {
            const storeName = stores.find(store => store.id === values.almacenId)?.nombre || 'esta sucursal';
            toast.error("Error al asignar rol", {
              description: `El usuario ya es vendedor en ${storeName}`
            });
            return;
          }
        }
      }
      
      // Proceed with adding the role
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: values.userId,
          role: values.role,
          almacen_id: values.role === "sales" ? values.almacenId : null,
        });

      if (error) {
        handleError(error, "Error al asignar rol");
        return;
      }

      toast.success("Rol asignado", {
        description: "El rol ha sido asignado correctamente"
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast.error("Error al asignar rol", {
        description: error.message || "No se pudo asignar el rol"
      });
    }
  };

  const userName = selectedUser?.full_name || selectedUser?.email || "";

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Asignar Rol</DialogTitle>
        <DialogDescription>
          Asigne un rol al usuario {userName}
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddRole)} className="space-y-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="sales">Vendedor</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {needsStore && (
            <FormField
              control={form.control}
              name="almacenId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sucursal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una sucursal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button type="submit">Asignar Rol</Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
