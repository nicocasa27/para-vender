
import { UserWithRoles } from "@/types/auth";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const { stores } = useStores();
  
  // Initialize form with default values
  const form = useForm<RoleAssignmentValues>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      userId: selectedUser?.id || "",
      role: "viewer",
      almacenId: "",
    },
  });

  // Update form when selected user changes - using useEffect correctly
  useEffect(() => {
    if (selectedUser) {
      form.setValue("userId", selectedUser.id);
    }
  }, [selectedUser, form]);

  const handleAddRole = async (values: RoleAssignmentValues) => {
    try {
      console.log("Adding role:", values);
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: values.userId,
          role: values.role,
          almacen_id: values.role === "sales" ? values.almacenId : null,
        });

      if (error) throw error;

      toast({
        title: "Rol asignado",
        description: "El rol ha sido asignado correctamente",
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el rol",
        variant: "destructive",
      });
    }
  };

  const currentRole = form.watch("role");
  const needsStore = currentRole === "sales";
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
