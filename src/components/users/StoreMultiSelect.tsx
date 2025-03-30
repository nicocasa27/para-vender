
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Store {
  id: string;
  nombre: string;
}

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const StoreMultiSelect = ({ value = [], onChange, disabled = false }: Props) => {
  const [open, setOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  // Load stores on component mount
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('almacenes')
          .select('id, nombre')
          .order('nombre');
          
        if (error) throw error;
        setStores(data || []);
      } catch (error) {
        console.error("Error loading stores:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStores();
  }, []);

  const handleSelect = (storeId: string) => {
    if (value.includes(storeId)) {
      // Remove the store
      onChange(value.filter(id => id !== storeId));
    } else {
      // Add the store
      onChange([...value, storeId]);
    }
  };

  const selectedStores = stores.filter(store => value.includes(store.id));
  
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || loading}
          >
            {selectedStores.length > 0 
              ? `${selectedStores.length} tiendas seleccionadas` 
              : "Seleccionar tiendas"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar tienda..." />
            <CommandList>
              <CommandEmpty>No se encontraron tiendas</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-72">
                  {stores.map((store) => (
                    <CommandItem
                      key={store.id}
                      value={store.nombre}
                      onSelect={() => handleSelect(store.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(store.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {store.nombre}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Display selected stores as badges */}
      {selectedStores.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStores.map(store => (
            <Badge key={store.id} variant="secondary" className="text-xs">
              {store.nombre}
              <button 
                className="ml-1 hover:text-destructive"
                onClick={() => handleSelect(store.id)}
                disabled={disabled}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreMultiSelect;
