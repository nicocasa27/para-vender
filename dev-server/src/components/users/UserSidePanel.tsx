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
 * Panel lateral para gestionar usuarios
 */
export function UserSidePanel() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild></DialogTrigger>
        <Button variant="outline">Abrir Panel de Usuario</Button>
      </DialogTrigger>
      
      {/* DialogPortal SIEMPRE debe estar anidado dentro de Dialog */}
      <DialogPortal>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Panel de Usuario</DialogTitle>
            <DialogDescription>
              Gestione la información del usuario desde aquí.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            El contenido del panel de usuario va aquí
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