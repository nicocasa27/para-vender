
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserWithRoles } from "@/types/auth";

const roleSchema = z.object({
  role: z.enum(["admin", "manager", "sales", "viewer"], {
    required_error: "Debes seleccionar un rol",
  }),
  store_id: z.string().optional(),
});

export function useRoleAssignment(
  selectedUser: UserWithRoles | null,
  stores: any[] = [],
  onSuccess: () => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role: "viewer",
      store_id: undefined,
    },
  });

  const currentRole = form.watch("role");
  
  // Determinar si el rol seleccionado necesita un almacén
  const needsStore = currentRole === "sales";
  
  // Si el rol necesita un almacén, validar que se haya seleccionado uno
  useEffect(() => {
    if (needsStore) {
      form.register("store_id", { required: "Debes seleccionar un almacén" });
    } else {
      form.unregister("store_id");
    }
  }, [needsStore, form]);

  const handleAddRole = async (values: z.infer<typeof roleSchema>) => {
    if (!selectedUser) {
      toast.error("No se puede asignar rol: usuario no seleccionado");
      return;
    }
    
    // Validación defensiva del ID de usuario
    if (!selectedUser.id) {
      toast.error("No se puede asignar rol: ID de usuario inválido");
      console.error("ID de usuario inválido:", selectedUser);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Añadiendo rol:", values.role, "a usuario:", selectedUser.id);
      console.log("Usuario seleccionado:", selectedUser);
      console.log("Almacén seleccionado:", values.store_id || "Ninguno");
      
      // Verificar si el rol ya existe para este usuario
      const { data: existingRoles, error: checkError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", selectedUser.id)
        .eq("role", values.role)
        .eq("almacen_id", values.store_id || null);
        
      if (checkError) {
        throw new Error(checkError.message);
      }
      
      if (existingRoles && existingRoles.length > 0) {
        toast.info("El usuario ya tiene este rol asignado");
        onSuccess();
        return;
      }
      
      // Insertar el nuevo rol
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUser.id,
          role: values.role,
          almacen_id: values.store_id || null,
        });
        
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success("Rol asignado correctamente");
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Error al asignar rol:", error);
      toast.error("Error al asignar rol", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    currentRole,
    needsStore,
    isSubmitting,
    handleAddRole,
  };
}
