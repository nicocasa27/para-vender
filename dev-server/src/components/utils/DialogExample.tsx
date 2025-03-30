import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Ejemplo de uso correcto del DialogPortal dentro de Dialog
 * 
 * IMPORTANTE: DialogPortal siempre debe estar dentro de un componente Dialog
 * Error común: <DialogPortal> usado fuera de <Dialog>
 */
export function DialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Abrir Diálogo</Button>
      </DialogTrigger>
      
      {/* DialogPortal SIEMPRE debe estar anidado dentro de Dialog */}
      <DialogPortal>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ejemplo Correcto</DialogTitle>
            <DialogDescription>
              Este es un ejemplo de cómo usar DialogPortal correctamente dentro de Dialog.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            El contenido del diálogo va aquí
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
