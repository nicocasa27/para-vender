
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { ProductMovementHistory } from "./ProductMovementHistory";

interface MovementHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
}

const MovementHistoryPanel: React.FC<MovementHistoryPanelProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Historial de Movimientos</SheetTitle>
          <SheetDescription>
            Registro de entradas, salidas y transferencias
          </SheetDescription>
        </SheetHeader>
        {productId && (
          <ProductMovementHistory productId={productId} />
        )}
        <div className="mt-4 flex justify-end">
          <SheetClose asChild>
            <Button variant="outline">Cerrar</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MovementHistoryPanel;
