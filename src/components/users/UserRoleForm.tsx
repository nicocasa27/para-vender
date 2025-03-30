
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import RoleSelector from "./RoleSelector";
import StoreMultiSelect from "@/components/users/StoreMultiSelect";

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  role: z.string().min(1, { message: "Rol requerido" }),
  storeIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onSubmit: (values: FormValues) => Promise<void>;
  isLoading?: boolean;
}

const UserRoleForm = ({ onSubmit, isLoading = false }: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "",
      storeIds: [],
    },
  });
  
  const selectedRole = form.watch("role");
  const requiresStore = selectedRole === "manager" || selectedRole === "sales";

  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values);
      form.reset();
      toast.success("Rol asignado correctamente");
    } catch (error) {
      console.error("Error en asignación de rol:", error);
      // Error handling is delegated to the onSubmit function
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignar Rol</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Usuario</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="usuario@ejemplo.com" disabled={isLoading} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol a Asignar</FormLabel>
                  <FormControl>
                    <RoleSelector 
                      value={field.value} 
                      onChange={field.onChange} 
                      disabled={isLoading} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {requiresStore && (
              <FormField
                control={form.control}
                name="storeIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiendas Asignadas</FormLabel>
                    <FormControl>
                      <StoreMultiSelect
                        value={field.value || []} 
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Asignando..." : "Asignar Rol"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default UserRoleForm;
