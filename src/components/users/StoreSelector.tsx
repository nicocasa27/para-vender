
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { RoleAssignmentValues } from "./validation/roleSchemas";

interface StoreSelectorProps {
  control: Control<RoleAssignmentValues>;
  stores: { id: string; nombre: string }[];
}

export function StoreSelector({ control, stores }: StoreSelectorProps) {
  return (
    <FormField
      control={control}
      name="almacenId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Sucursal</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value || undefined}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una sucursal" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {stores
                .filter(store => !!store.id && !!store.nombre && store.id !== "")
                .map((store) => (
                  <SelectItem key={store.id} value={store.id || "store-sin-id"}>
                    {store.nombre || "Sin nombre"}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
