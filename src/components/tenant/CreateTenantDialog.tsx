
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTenant } from '@/contexts/tenant/TenantContext';

const tenantFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(50, { message: "El nombre no puede exceder 50 caracteres" }),
  slug: z
    .string()
    .min(2, { message: "El identificador debe tener al menos 2 caracteres" })
    .max(30, { message: "El identificador no puede exceder 30 caracteres" })
    .regex(/^[a-z0-9-]+$/, { 
      message: "Solo letras minúsculas, números y guiones son permitidos" 
    })
});

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTenantDialog = ({ open, onOpenChange }: CreateTenantDialogProps) => {
  const { createTenant } = useTenant();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof tenantFormSchema>>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('name', value);
    
    // Auto-generate slug from name if slug is empty or hasn't been manually edited
    if (!form.getValues('slug') || form.getValues('slug') === form.getValues('name').toLowerCase().replace(/\s+/g, '-')) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      form.setValue('slug', slug);
    }
  };

  const onSubmit = async (values: z.infer<typeof tenantFormSchema>) => {
    try {
      setIsSubmitting(true);
      const tenant = await createTenant(values.name, values.slug);
      if (tenant) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Organización</DialogTitle>
          <DialogDescription>
            Crea una nueva organización para gestionar inventarios y ventas independientes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Organización</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={handleNameChange}
                      placeholder="Mi Empresa" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificador Único</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="mi-empresa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Organización"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
