
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader, Save } from "lucide-react";

interface FormActionsProps {
  isSubmitting: boolean;
  isEditing: boolean;
  onReset: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  isSubmitting,
  isEditing,
  onReset,
}) => {
  return (
    <div className="flex justify-between space-x-2">
      <Button variant="outline" type="button" onClick={onReset}>
        Restablecer
      </Button>

      {isEditing ? (
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[150px] bg-blue-600 hover:bg-blue-700"
          aria-label="Guardar cambios del producto"
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[150px]"
          aria-label="Agregar nuevo producto"
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Agregando...
            </>
          ) : (
            "Agregar Producto"
          )}
        </Button>
      )}
    </div>
  );
};
