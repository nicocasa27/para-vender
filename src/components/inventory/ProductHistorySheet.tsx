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

interface ProductHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}

export function ProductHistorySheet({
  isOpen,
  onOpenChange,
  productId
}: ProductHistorySheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
}
